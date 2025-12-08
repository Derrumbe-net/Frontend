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
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    public function createReport(Request $request, Response $response){
        $data = $request->getParsedBody();
        $files = $request->getUploadedFiles();
        
        // --- 📂 FTPS File Upload Logic ---
        $imageUrl = null;
        $uploadedFile = null;
        
        // 1. Define the specific folder name here
        $targetFolder = 'Report_Folder'; 

        if (isset($files['image_file'])) {
            $rawFile = $files['image_file'];
            if (is_array($rawFile)) {
                $uploadedFile = $rawFile[0] ?? null;
            } else {
                $uploadedFile = $rawFile;
            }
        }

        if ($uploadedFile instanceof UploadedFileInterface && $uploadedFile->getError() === UPLOAD_ERR_OK && $uploadedFile->getSize() > 0) {
            
            try {
                $stream = $uploadedFile->getStream();
                $content = $stream->getContents();
                
                $originalFileName = pathinfo($uploadedFile->getClientFilename(), PATHINFO_FILENAME);
                $fileExtension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
                $fileName = $originalFileName . '_' . time() . '.' . $fileExtension;

                // 2. UPDATE: Pass $targetFolder as the 3rd argument
                $remotePath = $this->reportModel->uploadTextFile($fileName, $content, $targetFolder);

                if ($remotePath) {
                    $data['image_url'] = $remotePath; 
                    $imageUrl = $remotePath;
                } else {
                    error_log("ReportController: FTPS upload returned false.");
                    return $this->jsonResponse($response, ['error' => 'Failed to upload image via FTPS'], 500);
                }
            } catch (\Exception $e) {
                error_log("ReportController: Exception during file upload - " . $e->getMessage());
                return $this->jsonResponse($response, ['error' => 'Internal file handling error'], 500);
            }
        }

        // --- 💾 Database Creation ---
        if (empty($data)) {
            error_log("ReportController Warning: POST data is empty.");
        }

        $id = $this->reportModel->createReport($data);

        if ($id) {
            $responseData = ['message' => 'Report created', 'id' => $id];
            if ($imageUrl) {
                $responseData['image_url'] = $imageUrl;
            }
            return $this->jsonResponse($response, $responseData, 201);
        } else {
            error_log("ReportController Error: DB Insert failed. Data: " . json_encode($data));
            return $this->jsonResponse($response, ['error' => 'Failed to create report in database'], 500);
        }
    }

    public function getAllReports(Request $request, Response $response){
        return $this->jsonResponse($response, $this->reportModel->getAllReports());
    }

    public function getReport(Request $request, Response $response, $args){
        $rep = $this->reportModel->getReportById($args['id']);
        return $rep ? $this->jsonResponse($response, $rep)
                    : $this->jsonResponse($response, ['error' => 'Not found'], 404);
    }

    public function updateReport(Request $request, Response $response, $args){
        $updated = $this->reportModel->updateReport($args['id'], $request->getParsedBody());
        return $updated ? $this->jsonResponse($response, ['message' => 'Updated'])
                        : $this->jsonResponse($response, ['error' => 'Failed'], 500);
    }

    public function deleteReport(Request $request, Response $response, $args){
        $deleted = $this->reportModel->deleteReport($args['id']);
        return $deleted ? $this->jsonResponse($response, ['message' => 'Deleted'])
                        : $this->jsonResponse($response, ['error' => 'Failed'], 500);
    }
}