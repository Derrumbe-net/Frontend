<?php

namespace DerrumbeNet\Controller;

use DerrumbeNet\Model\TeamMember;

class TeamMemberController
{
    private TeamMember $model;

    public function __construct(TeamMember $model)
    {
        $this->model = $model;
    }

    private function jsonResponse($response, $data, $status = 200)
    {
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload);
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    // GET /team-members
    public function getAllMembers($request, $response)
    {
        return $this->jsonResponse($response, $this->model->getAllMembers());
    }

    // GET /team-members/{id}
    public function getMember($request, $response, $args)
    {
        $member = $this->model->getMemberById($args['id']);
        if ($member) return $this->jsonResponse($response, $member);
        return $this->jsonResponse($response, ['error' => 'Not found'], 404);
    }

    // POST /team-members
    public function createMember($request, $response)
    {
        $data = $request->getParsedBody();
        $id   = $this->model->createMember($data);
        if ($id) return $this->jsonResponse($response, ['message' => 'Member created', 'member_id' => $id], 201);
        return $this->jsonResponse($response, ['error' => 'Failed to create member'], 500);
    }

    // PUT /team-members/{id}
    public function updateMember($request, $response, $args)
    {
        $data = $request->getParsedBody();
        if (empty($data) || !is_array($data)) {
            return $this->jsonResponse($response, ['message' => 'No data provided'], 400);
        }
        $updated = $this->model->updateMember($args['id'], $data);
        if ($updated) return $this->jsonResponse($response, ['message' => 'Updated successfully']);
        return $this->jsonResponse($response, ['error' => 'Failed to update'], 500);
    }

    // DELETE /team-members/{id}
    public function deleteMember($request, $response, $args)
    {
        $deleted = $this->model->deleteMember($args['id']);
        if ($deleted) return $this->jsonResponse($response, ['message' => 'Deleted']);
        return $this->jsonResponse($response, ['error' => 'Failed to delete'], 500);
    }

    // POST /team-members/{id}/image  (multipart/form-data key: 'image')
    public function uploadMemberImage($request, $response, $args)
    {
        $memberId     = $args['id'];
        $uploadedFiles = $request->getUploadedFiles();

        if (empty($uploadedFiles['image'])) {
            return $this->jsonResponse($response, ['error' => 'No image file provided'], 400);
        }

        $uploadedFile = $uploadedFiles['image'];

        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            return $this->jsonResponse($response, ['error' => 'File upload error'], 500);
        }

        try {
            $member = $this->model->getMemberById($memberId);
            if (!$member) {
                return $this->jsonResponse($response, ['error' => 'Member not found'], 404);
            }

            $originalName = $uploadedFile->getClientFilename();
            $filename     = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);

            $tempPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $filename;
            $uploadedFile->moveTo($tempPath);

            $this->model->uploadImageToFtp($tempPath, $filename);
            $this->model->updateMemberImageColumn($memberId, $filename);

            if (file_exists($tempPath)) unlink($tempPath);

            return $this->jsonResponse($response, [
                'message'   => 'Image uploaded successfully',
                'image_url' => $filename,
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => $e->getMessage()], 500);
        }
    }

    // GET /team-members/{id}/image
    public function serveMemberImage($request, $response, $args)
    {
        $memberId = $args['id'];

        try {
            $member = $this->model->getMemberById($memberId);
            if (!$member) {
                $response->getBody()->write('Member not found');
                return $response->withStatus(404);
            }

            $fileName = $member['image_url'] ?? null;
            if (empty($fileName)) {
                $response->getBody()->write('No image for this member');
                return $response->withStatus(404);
            }

            $imageContent = $this->model->getMemberImageContent($fileName);

            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $mimeType  = match ($extension) {
                'png'  => 'image/png',
                'gif'  => 'image/gif',
                'webp' => 'image/webp',
                'svg'  => 'image/svg+xml',
                default => 'image/jpeg',
            };

            $response->getBody()->write($imageContent);
            return $response->withHeader('Content-Type', $mimeType);
        } catch (\Exception $e) {
            error_log($e->getMessage());
            $response->getBody()->write('Error fetching image');
            return $response->withStatus(500);
        }
    }
}
