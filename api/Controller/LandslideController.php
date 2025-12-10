<?php

namespace DerrumbeNet\Controller;

use DerrumbeNet\Model\Landslide;

class LandslideController {
    private Landslide $landslideModel;

    public function __construct($db, Landslide $landslideModel = null) {
        $this->landslideModel = $landslideModel ?? new Landslide($db);
    }

    private function jsonResponse($response, $data, $status = 200) {
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload);
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    public function createLandslide($request, $response) {
        $data = $request->getParsedBody();
        $newId = $this->landslideModel->createLandslide($data);
        if ($newId) return $this->jsonResponse($response, ['message'=>'Landslide created','id'=>$newId], 201);
        return $this->jsonResponse($response, ['error'=>'Failed to create'], 500);
    }

    public function getAllLandslides($request, $response) {
        $lands = $this->landslideModel->getAllLandslides();
        return $this->jsonResponse($response, $lands);
    }

    public function getLandslide($request, $response, $args) {
        $land = $this->landslideModel->getLandslideById($args['id']);
        if ($land) return $this->jsonResponse($response, $land);
        return $this->jsonResponse($response, ['error'=>'Not found'], 404);
    }

    public function updateLandslide($request, $response, $args) {
        $data = $request->getParsedBody();
        $updated = $this->landslideModel->updateLandslide($args['id'], $data);
        if ($updated) return $this->jsonResponse($response, ['message'=>'Updated']);
        return $this->jsonResponse($response, ['error'=>'Failed'], 500);
    }

    public function deleteLandslide($request, $response, $args) {
        $deleted = $this->landslideModel->deleteLandslide($args['id']);
        if ($deleted) return $this->jsonResponse($response, ['message'=>'Deleted']);
        return $this->jsonResponse($response, ['error'=>'Failed'], 500);
    }

    public function getLandslideImages($request, $response, $args) {
        $id = $args['id'];
        $landslide = $this->landslideModel->getLandslideById($id);
        if (!$landslide) {
            return $this->jsonResponse($response, ['error' => 'Landslide not found'], 404);
        }

        $folderName = $landslide['image_url'];
        if (!$folderName) {
            // Fallback: If no column exists, try constructing it or return empty
            return $this->jsonResponse($response, ['images' => []]);
        }

        try {
            $images = $this->landslideModel->getLandslideImagesList($folderName);
            return $this->jsonResponse($response, ['images' => $images]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => $e->getMessage()], 500);
        }
    }

    // GET /landslides/{id}/images/{filename}
    public function serveLandslideImage($request, $response, $args) {
        $id = $args['id'];
        $filename = $args['filename'];

        $landslide = $this->landslideModel->getLandslideById($id);

        // Handle case where landslide doesn't exist or has no folder
        $folderName = $landslide['image_url'] ?? null;

        if (!$folderName) {
            // FIX 1: Write to Body, then return response with status
            $response->getBody()->write('Folder name not found in DB');
            return $response->withStatus(404);
        }

        try {
            $imageContent = $this->landslideModel->getLandslideImageContent($folderName, $filename);

            $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $mimeType = match ($extension) {
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
                default => 'image/jpeg',
            };

            $response->getBody()->write($imageContent);
            return $response->withHeader('Content-Type', $mimeType);

        } catch (\Exception $e) {
            // FIX 2: Write to Body, then return response with status
            $response->getBody()->write('Image not found');
            return $response->withStatus(404);
        }
    }
}