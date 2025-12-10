<?php

namespace DerrumbeNet\Controller;

use DerrumbeNet\Model\Publication;

class PublicationController {
    private Publication $publicationModel;
    public function __construct($db) { $this->publicationModel = new Publication($db); }

    private function jsonResponse($response, $data, $status = 200) {
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload);
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    public function createPublication($request, $response) {
        $data = $request->getParsedBody();
        $id = $this->publicationModel->createPublication($data);
        if ($id) return $this->jsonResponse($response, ['message'=>'Publication created', 'publication_id' => $id], 201);
        return $this->jsonResponse($response, ['error'=>'Failed'], 500);
    }

    public function getAllPublications($request, $response) {
        return $this->jsonResponse($response, $this->publicationModel->getAllPublications());
    }

    public function getPublication($request, $response, $args) {
        $pub = $this->publicationModel->getPublicationById($args['id']);
        if ($pub) return $this->jsonResponse($response, $pub);
        return $this->jsonResponse($response, ['error'=>'Not found'], 404);
    }

    public function updatePublication($request, $response, $args) {
        $data = $request->getParsedBody();

        if (empty($data) || !is_array($data)) {
            return $this->jsonResponse($response, ['message'=>'No data provided for update'], 400);
        }

        $updated = $this->publicationModel->updatePublication($args['id'], $data);

        if ($updated) {
            return $this->jsonResponse($response, ['message'=>'Updated successfully']);
        }

        return $this->jsonResponse($response, ['error'=>'Failed to update'], 500);
    }

    public function deletePublication($request, $response, $args) {
        $deleted = $this->publicationModel->deletePublication($args['id']);
        if ($deleted) return $this->jsonResponse($response, ['message'=>'Deleted']);
        return $this->jsonResponse($response, ['error'=>'Failed'], 500);
    }

    public function uploadPublicationImage($request, $response, $args) {
        $publicationId = $args['id'];
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
            $pub = $this->publicationModel->getPublicationById($publicationId);
            if (!$pub) {
                return $this->jsonResponse($response, ['error' => 'Publication not found'], 404);
            }

            // --- CHANGE STARTS HERE ---

            // Get original name
            $originalName = $uploadedFile->getClientFilename();

            // Sanitize filename: verify it only contains safe characters (alphanumeric, dot, underscore, dash)
            // This prevents issues with spaces in URLs or malicious path traversal
            $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);

            $tempPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $filename;
            $uploadedFile->moveTo($tempPath);

            // Upload to FTP
            $this->publicationModel->uploadImageToFtp($tempPath, $filename);

            // Update Database
            $this->publicationModel->updatePublicationImageColumn($publicationId, $filename);

            // Cleanup
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

    public function servePublicationImage($request, $response, $args) {
        $publicationId = $args['id'];

        try {
            $pub = $this->publicationModel->getPublicationById($publicationId);

            if (!$pub) {
                return $response->withStatus(404)->write('Publication not found');
            }

            $fileName = $pub['image_url'] ?? null;

            if (empty($fileName)) {
                return $response->withStatus(404)->write('Image not defined for this publication');
            }

            // Fetch content from FTP
            $imageContent = $this->publicationModel->getPublicationImageContent($fileName);

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
            return $response->withStatus(500)->write('Error fetching image');
        }
    }
}
