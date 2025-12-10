<?php

namespace DerrumbeNet\Controller;

use DerrumbeNet\Model\Report;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\UploadedFileInterface;

class ReportController {
    private Report $reportModel;
    
    public function __construct($db){ 
        $this->reportModel = new Report($db); 
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

        $data['image_url'] = ''; 
        $reportId = $this->reportModel->createReport($data);

        if (!$reportId) {
            return $this->jsonResponse($response, ['error' => 'Failed to create report'], 500);
        }

        // Generate Folder Name: {id}_{reported_at}
        // Example: "15_2025-12-07"
        $reportedAt = $data['reported_at'] ?? date('Y-m-d');
        $safeDate = str_replace([':', ' '], ['-', '_'], $reportedAt);
        $folderName = "{$reportId}_{$safeDate}";

        // Temporarily store the FOLDER NAME in the DB so Step 2 knows where to put the file
        $this->reportModel->updateReportImage($reportId, $folderName);

        // Return ID so frontend can call upload
        return $this->jsonResponse($response, [
            'message' => 'Report metadata created. Ready for upload.',
            'report_id' => $reportId,
            'target_folder' => $folderName
        ], 201);
    }

    public function updateReport(Request $request, Response $response, $args){
        $id = $args['id'];
        $data = $request->getParsedBody();

        if (!$data) {
            return $this->jsonResponse($response, ['error' => 'No data provided'], 400);
        }

        // Default values if frontend didn’t send them
        $data['is_validated'] = isset($data['is_validated']) ? (int)$data['is_validated'] : 0;
        $data['internal_notes'] = $data['internal_notes'] ?? null;

        $updated = $this->reportModel->updateReport($id, $data);

        if ($updated) {
            return $this->jsonResponse($response, ['message' => 'Report updated']);
        }

        return $this->jsonResponse($response, ['error' => 'Failed to update report'], 500);
    }

public function uploadReportImage(Request $request, Response $response, $args){
    $reportId = $args['id'];
    
    // Get the report to access the date and ID
    $report = $this->reportModel->getReportById($reportId);
    if (!$report) {
        return $this->jsonResponse($response, ['error' => 'Report not found'], 404);
    }

    $reportedAt = $report['reported_at']; 
    $safeDate = str_replace([':', ' '], ['-', '_'], $reportedAt);
    $targetFolder = "{$reportId}_{$safeDate}";

    $files = $request->getUploadedFiles();
    $uploadedFile = $files['image_file'] ?? null;
    if (is_array($uploadedFile)) $uploadedFile = $uploadedFile[0] ?? null;

    if ($uploadedFile instanceof UploadedFileInterface && $uploadedFile->getError() === UPLOAD_ERR_OK) {
        try {
            $content = $uploadedFile->getStream()->getContents();
            $ext = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
            // Unique filename to prevent overwriting previous images
            $fileName = 'image_' . time() . '_' . uniqid() . '.' . $ext;

            $fullPath = $this->reportModel->uploadTextFile($fileName, $content, $targetFolder);

            if ($fullPath) {
                $this->reportModel->updateReportImage($reportId, $fullPath);

                return $this->jsonResponse($response, [
                    'message' => 'Image uploaded successfully',
                    'full_path' => $fullPath,
                    'folder_used' => $targetFolder
                ]);
            } else {
                return $this->jsonResponse($response, ['error' => 'FTP upload failed'], 500);
            }

        } catch (\Exception $e) {
            error_log("Upload Exception: " . $e->getMessage());
            return $this->jsonResponse($response, ['error' => 'Internal error'], 500);
        }
    }

    return $this->jsonResponse($response, ['error' => 'No valid file sent'], 400);
}
    // ... Standard methods ...
    public function getAllReports(Request $request, Response $response){
        return $this->jsonResponse($response, $this->reportModel->getAllReports());
    }

    public function getReport(Request $request, Response $response, $args){
        $id = $args['id'];
        $report = $this->reportModel->getReportById($id);

        if (!$report) {
            return $this->jsonResponse($response, ['error' => 'Report not found'], 404);
        }

        return $this->jsonResponse($response, $report);
    }

    // (Add updateReport/deleteReport/getReport as needed)
}