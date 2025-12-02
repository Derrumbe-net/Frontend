<?php

namespace DerrumbeNet\Controller;

use DerrumbeNet\Model\StationInfo;

class StationInfoController {
    private StationInfo $stationInfoModel;
    public function __construct($db) { $this->stationInfoModel = new StationInfo($db); }

    private function jsonResponse($response, $data, $status=200){
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload);
        return $response->withHeader('Content-Type','application/json')->withStatus($status);
    }

    public function createStation($request,$response){
        $id = $this->stationInfoModel->createStationInfo($request->getParsedBody());
        return $id ? $this->jsonResponse($response,['message'=>'Station created','id'=>$id],201)
                   : $this->jsonResponse($response,['error'=>'Failed'],500);
    }

    public function getAllStations($request,$response){
        return $this->jsonResponse($response,$this->stationInfoModel->getAllStationInfos());
    }

    public function getStation($request,$response,$args){
        $station = $this->stationInfoModel->getStationInfoById($args['id']);
        return $station ? $this->jsonResponse($response,$station)
                        : $this->jsonResponse($response,['error'=>'Not found'],404);
    }

    public function updateStation($request,$response,$args){
        $updated = $this->stationInfoModel->updateStationInfo($args['id'],$request->getParsedBody());
        return $updated ? $this->jsonResponse($response,['message'=>'Updated'])
                        : $this->jsonResponse($response,['error'=>'Failed'],500);
    }

    public function deleteStation($request,$response,$args){
        $deleted = $this->stationInfoModel->deleteStationInfo($args['id']);
        return $deleted ? $this->jsonResponse($response,['message'=>'Deleted'])
                        : $this->jsonResponse($response,['error'=>'Failed'],500);
    }

    public function getAllStationFilesData($request, $response) {
        try {
            $stations = $this->stationInfoModel->getAllStationInfos();
            $result = [];

            foreach ($stations as $station) {
                if (!empty($station['ftp_file_path'])) {
                    $fileName = $station['ftp_file_path'];

                    try {
                        $data = $this->stationInfoModel->getStationFileData($fileName);
                        echo "<pre>";
                        echo "</pre>";
                        $result[] = [
                            'station_id' => $station['station_id'],
                            'file_path'  => $fileName,
                            'data'       => $data
                        ];
                    } catch (Exception $e) {
                        $result[] = [
                            'station_id' => $station['station_id'],
                            'file_path'  => $fileName,
                            'error'      => $e->getMessage()
                        ];
                    }
                } else {
                    $result[] = [
                        'station_id' => $station['station_id'],
                        'error' => 'No ftp_file_path defined for this station'
                    ];
                }
            }

            return $this->jsonResponse($response, $result);

        } catch (Exception $e) {
            return $this->jsonResponse($response, [
                'error' => 'Failed to fetch station file data',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getStationFileData($request, $response, $args) {
        try {
            $station = $this->stationInfoModel->getStationInfoById($args['id']);
            if (!$station || empty($station['ftp_file_path'])) {
                return $this->jsonResponse($response, ['error' => 'No FTP file path defined for this station'], 404);
            }

            $data = $this->stationInfoModel->getStationFileData($station['ftp_file_path']);
            return $this->jsonResponse($response, [
                'station_id' => $station['station_id'],
                'file_path'  => $station['ftp_file_path'],
                'data'       => $data
            ]);

        } catch (Exception $e) {
            return $this->jsonResponse($response, [
                'error' => 'Failed to read station file',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function processStationFileAndUpdate($request, $response, $args) {
        $stationId = $args['id'] ?? null;
        if (!$stationId) {
            return $this->jsonResponse($response, ['error' => 'Station ID not provided'], 400);
        }

        try {
            $result = $this->stationInfoModel->processStationFileAndUpdate($stationId);

            if ($result) {
                return $this->jsonResponse($response, [
                    'message' => "Station ID $stationId processed and updated successfully"
                ]);
            } else {
                return $this->jsonResponse($response, [
                    'error' => "Failed to process or update station ID $stationId"
                ], 500);
            }
        } catch (Exception $e) {
            return $this->jsonResponse($response, [
                'error' => 'Exception occurred while processing station file',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function serveStationImage($request, $response, $args) {
        $stationId = $args['id'];
        $type = $args['type']; // 'sensor' or 'data'

        try {
            $station = $this->stationInfoModel->getStationInfoById($stationId);

            if (!$station) {
                return $response->withStatus(404)->write('Station not found');
            }

            // Determine which column to look at
            $column = ($type === 'sensor') ? 'sensor_image_url' : 'data_image_url';
            $fileName = $station[$column] ?? null;

            if (empty($fileName)) {
                // Return a 404 or a placeholder if no image defined
                return $response->withStatus(404)->write('Image not defined for this station');
            }

            // Fetch binary content
            $imageContent = $this->stationInfoModel->getStationImageContent($fileName);

            // Determine Mime Type (Simple check based on extension, or default to jpeg)
            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $mimeType = match ($extension) {
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
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
