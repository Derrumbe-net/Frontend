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
        $this->emailService      = new EmailService();
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

        try {
            // Build email using a template (you can create report_submitted.html)
            $body = $this->emailService->renderTemplate('report_submitted', [
                'id'               => $reportId,
                'reported_at'      => $data['reported_at'] ?? 'N/A',
                'city'             => $data['city'] ?? 'N/A',
                'latitude'         => $data['latitude'] ?? 'N/A',
                'longitude'        => $data['longitude'] ?? 'N/A',
                'physical_address' => $data['physical_address'] ?: 'N/A',
                'description'      => $data['description'] ?? 'N/A',
                'reporter_name'    => $data['reporter_name'] ?? 'N/A',
                'reporter_phone'   => $data['reporter_phone'] ?: 'N/A',
                'reporter_email'   => $data['reporter_email'] ?: 'N/A',
                'cms_link' => $_ENV['FRONTEND_URL'] . "/cms"
            ]);

            $this->emailService->sendEmail(
                $_ENV['SUPERADMIN_EMAIL'],
                "New Report Submitted (#{$reportId})",
                $body
            );

        } catch (\Exception $e) {
            error_log("Report email error: " . $e->getMessage());
        }

        // Generate Folder Name: {id}_{reported_at}
        // Example: "15_2025-12-07"
        $reportedAt = $data['reported_at'] ?? date('Y-m-d');
        $safeDate = str_replace([':', ' '], ['-', '_'], $reportedAt);
        $folderName = "{$reportId}_{$safeDate}";
        $rawDate = $data['reported_at'] ?? date('Y-m-d');
        
        // YYYY-MM-DD format 
        $dateFormatted = date('Y-m-d', strtotime($rawDate));

        // Create folder name: {date}_{id}
        $folderName = "{$dateFormatted}_{$reportId}";

        $this->reportModel->updateReportImage($reportId, $folderName);

        return $this->jsonResponse($response, [
            'message' => 'Report metadata created. Ready for upload.',
            'report_id' => $reportId,
            'target_folder' => $folderName
        ], 201);
    }

    public function uploadReportImage(Request $request, Response $response, $args)
    {
        $reportId = $args['id'];
    
        $report = $this->reportModel->getReportById($reportId);
        if (!$report) {
            return $this->jsonResponse($response, ['error' => 'Report not found'], 404);
        }
    
        $rawDate = $report['reported_at'];
        $dateFormatted = date('Y-m-d', strtotime($rawDate));
        
        $targetFolder = "{$dateFormatted}_{$reportId}";
    
        $files = $request->getUploadedFiles();
        $uploadedFile = $files['image_file'] ?? null;
    
        if ($uploadedFile instanceof UploadedFileInterface && $uploadedFile->getError() === UPLOAD_ERR_OK) {
    
            $ext = strtolower(pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png'];
    
            if (!in_array($ext, $allowed)) {
                return $this->jsonResponse($response, ['error' => 'Invalid file type'], 400);
            }
    
            try {
                $content = $uploadedFile->getStream()->getContents();
                $fileName = 'image_' . time() . '_' . uniqid() . '.' . $ext;
    
                // This uploads the physical file
                $fullPath = $this->reportModel->uploadTextFile($fileName, $content, $targetFolder);
    
                if ($fullPath) {
                    $this->reportModel->updateReportImage($reportId, $targetFolder);
                    return $this->jsonResponse($response, [
                        'message' => 'Image uploaded successfully',
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

    public function getAllReports($request,$response){
        return $this->jsonResponse($response,$this->reportModel->getAllReports());
    }

    public function getReport($request,$response,$args){
        $rep = $this->reportModel->getReportById($args['id']);
        return $rep ? $this->jsonResponse($response,$rep)
                    : $this->jsonResponse($response,['error'=>'Not found'],404);
    }

    private function sanitizeNumericFields(array $data) {
        $numericFields = ['latitude', 'longitude'];

        foreach ($numericFields as $field) {
            if (isset($data[$field]) && $data[$field] === '') {
                $data[$field] = null;  // MySQL accepts NULL
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

    public function getReportImages(Request $request, Response $response, $args) {
        $reportId = $args['id'];
        
        // Fetch all image data encoded in Base64
        $images = $this->reportModel->getReportImagesBase64($reportId);
    
        // If no images found, you might want to return 200 with empty array, or 404
        if (empty($images)) {
             return $this->jsonResponse($response, []);
        }
    
        return $this->jsonResponse($response, $images);
    }

// GET /reports/{id}/images
public function listReportImages(Request $request, Response $response, $args) {
    $reportId = $args['id'];
    
    // Get Folder Name from DB
    $report = $this->reportModel->getReportById($reportId);
    if (!$report || empty($report['image_url'])) {
        return $this->jsonResponse($response, []);
    }

    $folderName = $report['image_url']; // e.g. "2023-10-01_15"

    // Get List from FTP
    $files = $this->reportModel->getReportImageList($folderName);

    // Return JSON list
    return $this->jsonResponse($response, $files);
}

public function serveReportImage(Request $request, Response $response, $args) {
    $reportId = $args['id'];
    $fileName = $args['filename'];

    // Get Folder Name from DB
    $report = $this->reportModel->getReportById($reportId);
    if (!$report || empty($report['image_url'])) {
        return $response->withStatus(404);
    }

    $folderName = $report['image_url'];

    // Get Binary Content
    $imageContent = $this->reportModel->getReportImageContent($folderName, $fileName);

    if (!$imageContent) {
        return $response->withStatus(404)->getBody()->write('Image not found');
    }

    // Determine Mime Type
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $mime = match($ext) {
        'jpg', 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        default => 'application/octet-stream'
    };

    // Return Binary Stream
    $response->getBody()->write($imageContent);
    return $response->withHeader('Content-Type', $mime);
}



}
