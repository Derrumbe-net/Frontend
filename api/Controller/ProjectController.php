<?php

namespace DerrumbeNet\Controller;

use DerrumbeNet\Model\Project;

class ProjectController
{
    private Project $projectModel;

    public function __construct(Project $projectModel)
    {
        $this->projectModel = $projectModel;
    }

    private function jsonResponse($response, $data, $status = 200)
    {
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload);
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    public function createProject($request, $response)
    {
        $id = $this->projectModel->createProject($request->getParsedBody());
        return $id ? $this->jsonResponse($response, ['message' => 'Project created', 'project_id' => $id], 201)
            : $this->jsonResponse($response, ['error' => 'Failed'], 500);
    }

    public function getAllProjects($request, $response)
    {
        return $this->jsonResponse($response, $this->projectModel->getAllProjects());
    }

    public function getProject($request, $response, $args)
    {
        $proj = $this->projectModel->getProjectById($args['id']);
        return $proj ? $this->jsonResponse($response, $proj)
            : $this->jsonResponse($response, ['error' => 'Not found'], 404);
    }

    public function updateProject($request, $response, $args)
    {
        $updated = $this->projectModel->updateProject($args['id'], $request->getParsedBody());
        return $updated ? $this->jsonResponse($response, ['message' => 'Updated'])
            : $this->jsonResponse($response, ['error' => 'Failed'], 500);
    }

    public function deleteProject($request, $response, $args)
    {
        $deleted = $this->projectModel->deleteProject($args['id']);
        return $deleted ? $this->jsonResponse($response, ['message' => 'Deleted'])
            : $this->jsonResponse($response, ['error' => 'Failed'], 500);
    }

    public function uploadProjectImage($request, $response, $args)
    {
        $projectId = $args['id'];
        $uploadedFiles = $request->getUploadedFiles();

        if (empty($uploadedFiles['image'])) {
            return $this->jsonResponse($response, ['error' => 'No image file provided'], 400);
        }

        /** @var UploadedFileInterface $uploadedFile */
        $uploadedFile = $uploadedFiles['image'];

        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            return $this->jsonResponse($response, ['error' => 'File upload error'], 500);
        }

        try {
            $proj = $this->projectModel->getProjectById($projectId);
            if (!$proj) {
                return $this->jsonResponse($response, ['error' => 'Project not found'], 404);
            }

            // Get original filename
            $originalName = $uploadedFile->getClientFilename();

            // Sanitize filename: allow alphanumeric, dot, underscore, dash
            $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);

            $tempPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $filename;
            $uploadedFile->moveTo($tempPath);

            // Upload to FTP (files/projects/)
            $this->projectModel->uploadImageToFtp($tempPath, $filename);

            // Update Database with the clean filename
            $this->projectModel->updateProjectImageColumn($projectId, $filename);

            // Cleanup local temp file
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

            return $this->jsonResponse($response, [
                'message' => 'Image uploaded successfully',
                'image_url' => $filename
            ]);

        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => $e->getMessage()], 500);
        }
    }

    public function serveProjectImage($request, $response, $args)
    {
        $projectId = $args['id'];

        try {
            $proj = $this->projectModel->getProjectById($projectId);

            if (!$proj) {
                // FIX 1: Write to Body, then return response
                $response->getBody()->write('Project not found');
                return $response->withStatus(404);
            }

            $fileName = $proj['image_url'] ?? null;

            if (empty($fileName)) {
                // FIX 2: Write to Body, then return response
                $response->getBody()->write('Image not defined for this project');
                return $response->withStatus(404);
            }

            // Fetch content from FTP
            $imageContent = $this->projectModel->getProjectImageContent($fileName);

            // Determine Mime Type
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $mimeType = match ($extension) {
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
                'svg' => 'image/svg+xml',
                default => 'image/jpeg',
            };

            $response->getBody()->write($imageContent);
            return $response->withHeader('Content-Type', $mimeType);

        } catch (\Exception $e) {
            error_log($e->getMessage());
            // FIX 3: Write to Body, then return response
            $response->getBody()->write('Error fetching image');
            return $response->withStatus(500);
        }
    }
}
