<?php

namespace DerrumbeNet\Controller;

use DerrumbeNet\Model\Report;
use DerrumbeNet\Helpers\EmailService;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\UploadedFileInterface;

class ReportController {
    private Report $reportModel;
    private EmailService $emailService;

    public function __construct($db){
        $this->reportModel = new Report($db);
        $this->emailService = new EmailService();
    }

    private function jsonResponse(Response $response, $data, $status = 200){
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload);
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    public function createReport(Request $request, Response $response){
        $data = $request->getParsedBody();

        if (empty($data)) {
            return $this->jsonResponse($response, ['error' => 'No data provided'], 400);
        }

        $reportId = $this->reportModel->createReport($data);

        if (!$reportId) {
            return $this->jsonResponse($response, ['error' => 'Failed to create report'], 500);
        }

        $rawDate = $data['reported_at'] ?? date('Y-m-d');
        $dateFormatted = date('Y-m-d', strtotime($rawDate));
        $folderName = "{$dateFormatted}_{$reportId}";

        $this->reportModel->updateReportImage($reportId, $folderName);

        return $this->jsonResponse($response, [
            'message' => 'Report metadata created. Ready for upload.',
            'report_id' => $reportId,
            'target_folder' => $folderName
        ], 201);
    }

    public function getAllReports($request,$response){
        return $this->jsonResponse($response,$this->reportModel->getAllReports());
    }

    public function getReport($request,$response,$args){
        $rep = $this->reportModel->getReportById($args['id']);
        return $rep ? $this->jsonResponse($response,$rep)
            : $this->jsonResponse($response,['error'=>'Not found'],404);
    }

    private function sanitizeNumericFields(array $data) {
        $numericFields = ['latitude', 'longitude', 'landslide_id', 'is_validated'];

        foreach ($numericFields as $field) {
            if (array_key_exists($field, $data) && $data[$field] === '') {
                $data[$field] = null;
            }
        }
        return $data;
    }

    public function updateReport(Request $request, Response $response, array $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();

        if (empty($data) || !is_array($data)) {
            return $this->jsonResponse($response, ['error' => 'No valid data provided'], 400);
        }

        $data = $this->sanitizeNumericFields($data);

        $updated = $this->reportModel->updateReport($id, $data);

        if (!$updated) {
            return $this->jsonResponse($response, ['error' => 'Failed to update report'], 500);
        }

        return $this->jsonResponse($response, [
            'message' => 'Report updated successfully',
            'report_id' => $id
        ], 200);
    }

    public function deleteReport($request,$response,$args){
        $deleted = $this->reportModel->deleteReport($args['id']);
        return $deleted ? $this->jsonResponse($response,['message'=>'Deleted'])
            : $this->jsonResponse($response,['error'=>'Failed'],500);
    }


    /**
     * Uploads the image keeping the ORIGINAL filename.
     */
    public function uploadReportImage(Request $request, Response $response, $args)
    {
        $reportId = $args['id'];
        $report = $this->reportModel->getReportById($reportId);

        if (!$report) {
            return $this->jsonResponse($response, ['error' => 'Report not found'], 404);
        }

        // Determine folder from DB or construct it
        $targetFolder = $report['image_url'];
        if (empty($targetFolder)) {
            $rawDate = $report['reported_at'];
            $dateFormatted = date('Y-m-d', strtotime($rawDate));
            $targetFolder = "{$dateFormatted}_{$reportId}";
            $this->reportModel->updateReportImage($reportId, $targetFolder);
        }

        $files = $request->getUploadedFiles();
        $uploadedFile = $files['image_file'] ?? null;

        if ($uploadedFile instanceof UploadedFileInterface && $uploadedFile->getError() === UPLOAD_ERR_OK) {

            $clientName = $uploadedFile->getClientFilename();
            $ext = strtolower(pathinfo($clientName, PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp'];

            if (!in_array($ext, $allowed)) {
                return $this->jsonResponse($response, ['error' => 'Invalid file type'], 400);
            }

            $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($clientName, PATHINFO_FILENAME));
            $finalFileName = $safeName . '.' . $ext;

            try {
                $content = $uploadedFile->getStream()->getContents();

                $fullPath = $this->reportModel->uploadTextFile($finalFileName, $content, $targetFolder);

                if ($fullPath) {
                    return $this->jsonResponse($response, [
                        'message' => 'Image uploaded successfully',
                        'filename' => $finalFileName,
                        'path' => $fullPath
                    ]);
                }
                return $this->jsonResponse($response, ['error' => 'FTP upload failed'], 500);

            } catch (\Exception $e) {
                error_log("Upload Exception: " . $e->getMessage());
                return $this->jsonResponse($response, ['error' => 'Internal error'], 500);
            }
        }

        return $this->jsonResponse($response, ['error' => 'No valid file sent'], 400);
    }

    /**
     * Returns a JSON list of filenames: { "images": ["pub1.webp", "site.jpg"] }
     */
    public function getReportImages(Request $request, Response $response, $args) {
        $id = $args['id'];
        $report = $this->reportModel->getReportById($id);

        if (!$report) {
            return $this->jsonResponse($response, ['error' => 'Report not found'], 404);
        }

        $folderName = $report['image_url'];

        // If no folder assigned yet, return empty list
        if (!$folderName) {
            return $this->jsonResponse($response, ['images' => []]);
        }

        try {
            $images = $this->reportModel->getReportImageList($folderName);
            return $this->jsonResponse($response, ['images' => $images]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Serves the raw binary of the image
     */
    public function serveReportImage(Request $request, Response $response, $args) {
        $id = $args['id'];
        $filename = $args['filename'];

        $report = $this->reportModel->getReportById($id);
        $folderName = $report['image_url'];

        if (!$folderName) {
            return $response->withStatus(404)->write('Folder name not found in DB');
        }

        try {
            $imageContent = $this->reportModel->getReportImageContent($folderName, $filename);

            if (!$imageContent) {
                return $response->withStatus(404)->write('Image content empty or not found');
            }

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
            return $response->withStatus(404)->write('Image not found');
        }
    }
}