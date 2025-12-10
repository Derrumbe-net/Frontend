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

    public function updateReport($request,$response,$args){
        $updated = $this->reportModel->updateReport($args['id'],$request->getParsedBody());
        return $updated ? $this->jsonResponse($response,['message'=>'Updated'])
                        : $this->jsonResponse($response,['error'=>'Failed'],500);
    }

    public function deleteReport($request,$response,$args){
        $deleted = $this->reportModel->deleteReport($args['id']);
        return $deleted ? $this->jsonResponse($response,['message'=>'Deleted'])
                        : $this->jsonResponse($response,['error'=>'Failed'],500);
    }
}