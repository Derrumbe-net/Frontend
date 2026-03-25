<?php

namespace DerrumbeNet\Controller;

use DerrumbeNet\Model\FundingSource;

class FundingSourceController
{
    private FundingSource $model;

    public function __construct(FundingSource $model)
    {
        $this->model = $model;
    }

    private function jsonResponse($response, $data, $status = 200)
    {
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload);
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    // GET /funding-sources
    public function getAllFundingSources($request, $response)
    {
        return $this->jsonResponse($response, $this->model->getAllFundingSources());
    }

    // GET /funding-sources/{id}
    public function getFundingSource($request, $response, $args)
    {
        $item = $this->model->getFundingSourceById($args['id']);
        if ($item) return $this->jsonResponse($response, $item);
        return $this->jsonResponse($response, ['error' => 'Not found'], 404);
    }

    // POST /funding-sources
    public function createFundingSource($request, $response)
    {
        $data = $request->getParsedBody();
        $id   = $this->model->createFundingSource($data);
        if ($id) return $this->jsonResponse($response, ['message' => 'Funding source created', 'funding_id' => $id], 201);
        return $this->jsonResponse($response, ['error' => 'Failed to create'], 500);
    }

    // PUT /funding-sources/{id}
    public function updateFundingSource($request, $response, $args)
    {
        $data = $request->getParsedBody();
        if (empty($data) || !is_array($data)) {
            return $this->jsonResponse($response, ['message' => 'No data provided'], 400);
        }
        $updated = $this->model->updateFundingSource($args['id'], $data);
        if ($updated) return $this->jsonResponse($response, ['message' => 'Updated successfully']);
        return $this->jsonResponse($response, ['error' => 'Failed to update'], 500);
    }

    // DELETE /funding-sources/{id}
    public function deleteFundingSource($request, $response, $args)
    {
        $deleted = $this->model->deleteFundingSource($args['id']);
        if ($deleted) return $this->jsonResponse($response, ['message' => 'Deleted']);
        return $this->jsonResponse($response, ['error' => 'Failed to delete'], 500);
    }

    // POST /funding-sources/{id}/image
    public function uploadFundingSourceImage($request, $response, $args)
    {
        $id            = $args['id'];
        $uploadedFiles = $request->getUploadedFiles();

        if (empty($uploadedFiles['image'])) {
            return $this->jsonResponse($response, ['error' => 'No image file provided'], 400);
        }

        $uploadedFile = $uploadedFiles['image'];
        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            return $this->jsonResponse($response, ['error' => 'File upload error'], 500);
        }

        try {
            $item = $this->model->getFundingSourceById($id);
            if (!$item) return $this->jsonResponse($response, ['error' => 'Funding source not found'], 404);

            $originalName = $uploadedFile->getClientFilename();
            $filename     = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
            $tempPath     = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $filename;

            $uploadedFile->moveTo($tempPath);
            $this->model->uploadImageToFtp($tempPath, $filename);
            $this->model->updateFundingSourceImageColumn($id, $filename);
            if (file_exists($tempPath)) unlink($tempPath);

            return $this->jsonResponse($response, [
                'message'   => 'Image uploaded successfully',
                'image_url' => $filename,
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => $e->getMessage()], 500);
        }
    }

    // GET /funding-sources/{id}/image
    public function serveFundingSourceImage($request, $response, $args)
    {
        try {
            $item = $this->model->getFundingSourceById($args['id']);
            if (!$item) {
                $response->getBody()->write('Not found');
                return $response->withStatus(404);
            }

            $fileName = $item['image_url'] ?? null;
            if (empty($fileName)) {
                $response->getBody()->write('No image defined');
                return $response->withStatus(404);
            }

            $imageContent = $this->model->getFundingSourceImageContent($fileName);

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
