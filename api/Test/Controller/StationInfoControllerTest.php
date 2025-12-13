<?php
namespace Controller;

use DerrumbeNet\Controller\StationInfoController;
use DerrumbeNet\Model\StationInfo;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\UploadedFileInterface;
use Slim\Psr7\Request;
use Slim\Psr7\Response;

class StationInfoControllerTest extends TestCase
{
    private $stationModelMock;
    private $controller;
    private $response;

    protected function setUp(): void
    {
        $this->stationModelMock = $this->createMock(StationInfo::class);
        $this->controller = new StationInfoController($this->stationModelMock);
        $this->response = new Response();
    }

    private function createMockRequest($body = [], $uploadedFiles = [])
    {
        $request = $this->createMock(Request::class);
        $request->method('getParsedBody')->willReturn($body);
        $request->method('getUploadedFiles')->willReturn($uploadedFiles);
        return $request;
    }

    // --- CRUD TESTS ---

    public function testCreateStationSuccess()
    {
        $this->stationModelMock->method('createStationInfo')->willReturn('123');
        $request = $this->createMockRequest(['city' => 'Test']);
        $response = $this->controller->createStation($request, $this->response);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertStringContainsString('123', (string)$response->getBody());
    }

    public function testCreateStationFailure()
    {
        $this->stationModelMock->method('createStationInfo')->willReturn(false);
        $request = $this->createMockRequest(['city' => 'Test']);
        $response = $this->controller->createStation($request, $this->response);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testGetAllStations()
    {
        $this->stationModelMock->method('getAllStationInfos')->willReturn([['id'=>1]]);
        $request = $this->createMockRequest();
        $response = $this->controller->getAllStations($request, $this->response);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testGetStationFound()
    {
        $this->stationModelMock->method('getStationInfoById')->willReturn(['id'=>1]);
        $request = $this->createMockRequest();
        $response = $this->controller->getStation($request, $this->response, ['id'=>1]);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testGetStationNotFound()
    {
        $this->stationModelMock->method('getStationInfoById')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->getStation($request, $this->response, ['id'=>99]);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUpdateStationSuccess()
    {
        $this->stationModelMock->method('updateStationInfo')->willReturn(true);
        $request = $this->createMockRequest(['city' => 'Updated']);
        $response = $this->controller->updateStation($request, $this->response, ['id'=>1]);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testUpdateStationEmptyData()
    {
        $request = $this->createMockRequest([]);
        $response = $this->controller->updateStation($request, $this->response, ['id'=>1]);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUpdateStationFailure()
    {
        $this->stationModelMock->method('updateStationInfo')->willReturn(false);
        $request = $this->createMockRequest(['city' => 'Updated']);
        $response = $this->controller->updateStation($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testDeleteStationSuccess()
    {
        $this->stationModelMock->method('deleteStationInfo')->willReturn(true);
        $request = $this->createMockRequest();
        $response = $this->controller->deleteStation($request, $this->response, ['id'=>1]);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testDeleteStationFailure()
    {
        $this->stationModelMock->method('deleteStationInfo')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->deleteStation($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- FILE DATA TESTS ---

    public function testGetAllStationFilesData()
    {
        $stations = [
            ['station_id' => 1, 'ftp_file_path' => 'file1.txt'],
            ['station_id' => 2, 'ftp_file_path' => ''], // Empty path
            ['station_id' => 3, 'ftp_file_path' => 'bad.txt'], // Will throw
        ];

        $this->stationModelMock->method('getAllStationInfos')->willReturn($stations);

        // Mock getStationFileData to return data for file1, throw for bad.txt
        $this->stationModelMock->method('getStationFileData')
            ->will($this->returnValueMap([
                ['file1.txt', ['some_data']],
                ['bad.txt',   new \Exception("File error")] // This won't work directly with returnValueMap for Exceptions
            ]));

        // Using callback for complex logic mocking
        $this->stationModelMock->method('getStationFileData')->willReturnCallback(function($path) {
            if ($path == 'bad.txt') throw new \Exception("File error");
            return ['data' => 'ok'];
        });

        $request = $this->createMockRequest();
        $response = $this->controller->getAllStationFilesData($request, $this->response);

        $body = json_decode((string)$response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertCount(3, $body); // 3 stations processed
        $this->assertArrayHasKey('error', $body[1]); // Station 2 has error (no path)
        $this->assertArrayHasKey('error', $body[2]); // Station 3 has error (exception)
    }

    public function testGetAllStationFilesDataException()
    {
        $this->stationModelMock->method('getAllStationInfos')
            ->willThrowException(new \Exception("DB Error"));

        $request = $this->createMockRequest();
        $response = $this->controller->getAllStationFilesData($request, $this->response);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testGetStationFileDataSuccess()
    {
        $this->stationModelMock->method('getStationInfoById')
            ->willReturn(['station_id'=>1, 'ftp_file_path'=>'data.json']);

        $this->stationModelMock->method('getStationFileData')->willReturn(['temp'=>20]);

        $request = $this->createMockRequest();
        $response = $this->controller->getStationFileData($request, $this->response, ['id'=>1]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testGetStationFileDataNotFound()
    {
        $this->stationModelMock->method('getStationInfoById')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->getStationFileData($request, $this->response, ['id'=>99]);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testGetStationFileDataException()
    {
        $this->stationModelMock->method('getStationInfoById')
            ->willReturn(['station_id'=>1, 'ftp_file_path'=>'data.json']);

        $this->stationModelMock->method('getStationFileData')
            ->willThrowException(new \Exception("Read error"));

        $request = $this->createMockRequest();
        $response = $this->controller->getStationFileData($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- PROCESSING TESTS ---

    public function testProcessStationFileAndUpdateSuccess()
    {
        $this->stationModelMock->method('processStationFileAndUpdate')->willReturn(true);
        $request = $this->createMockRequest();
        $response = $this->controller->processStationFileAndUpdate($request, $this->response, ['id'=>1]);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testProcessStationFileAndUpdateFailure()
    {
        $this->stationModelMock->method('processStationFileAndUpdate')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->processStationFileAndUpdate($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testProcessStationFileAndUpdateNoId()
    {
        $request = $this->createMockRequest();
        $response = $this->controller->processStationFileAndUpdate($request, $this->response, []);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testProcessStationFileAndUpdateException()
    {
        $this->stationModelMock->method('processStationFileAndUpdate')
            ->willThrowException(new \Exception("Processing error"));

        $request = $this->createMockRequest();
        $response = $this->controller->processStationFileAndUpdate($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- BATCH UPDATE ---

    public function testBatchUpdateStationsSuccess()
    {
        $this->stationModelMock->method('updateStationsBatch')->willReturn(5); // 5 updated

        $data = ['stations' => [['id'=>1], ['id'=>2]]];
        $request = $this->createMockRequest($data);

        $response = $this->controller->batchUpdateStations($request, $this->response);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('updated_count":5', (string)$response->getBody());
    }

    public function testBatchUpdateStationsInvalidPayload()
    {
        $request = $this->createMockRequest(['wrong_key' => []]);
        $response = $this->controller->batchUpdateStations($request, $this->response);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testBatchUpdateStationsEmptyList()
    {
        $request = $this->createMockRequest(['stations' => []]);
        $response = $this->controller->batchUpdateStations($request, $this->response);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('No stations to update', (string)$response->getBody());
    }

    public function testBatchUpdateStationsException()
    {
        $this->stationModelMock->method('updateStationsBatch')
            ->willThrowException(new \Exception("DB error"));

        $request = $this->createMockRequest(['stations' => [['id'=>1]]]);
        $response = $this->controller->batchUpdateStations($request, $this->response);
        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- UPLOAD IMAGE ---

    public function testUploadStationSensorImageSuccess()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('pic.jpg');

        $this->stationModelMock->method('getStationInfoById')->willReturn(['id'=>1]);

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadStationSensorImage($request, $this->response, ['id'=>1]);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testUploadStationSensorImageNoFile()
    {
        $request = $this->createMockRequest([], []);
        $response = $this->controller->uploadStationSensorImage($request, $this->response, ['id'=>1]);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUploadStationSensorImageUploadError()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_CANT_WRITE);
        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadStationSensorImage($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testUploadStationSensorImageStationNotFound()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $this->stationModelMock->method('getStationInfoById')->willReturn(false);

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadStationSensorImage($request, $this->response, ['id'=>99]);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUploadStationSensorImageException()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('pic.jpg');

        $this->stationModelMock->method('getStationInfoById')->willReturn(['id'=>1]);
        $this->stationModelMock->method('uploadSensorImageToFtp')->willThrowException(new \Exception("FTP Error"));

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadStationSensorImage($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- SERVE IMAGE ---

    public function testServeStationImageSuccess()
    {
        $this->stationModelMock->method('getStationInfoById')
            ->willReturn(['id'=>1, 'sensor_image_url'=>'pic.png']);

        $this->stationModelMock->method('getStationImageContent')->willReturn('bytes');

        $request = $this->createMockRequest();
        // Request for 'sensor' image
        $response = $this->controller->serveStationImage($request, $this->response, ['id'=>1, 'type'=>'sensor']);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('image/png', $response->getHeaderLine('Content-Type'));
    }

    public function testServeStationImageNotFound()
    {
        $this->stationModelMock->method('getStationInfoById')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->serveStationImage($request, $this->response, ['id'=>1, 'type'=>'sensor']);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testServeStationImageNotDefined()
    {
        $this->stationModelMock->method('getStationInfoById')
            ->willReturn(['id'=>1, 'sensor_image_url'=>null]); // Null image

        $request = $this->createMockRequest();
        $response = $this->controller->serveStationImage($request, $this->response, ['id'=>1, 'type'=>'sensor']);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testServeStationImageException()
    {
        $this->stationModelMock->method('getStationInfoById')
            ->willReturn(['id'=>1, 'sensor_image_url'=>'pic.jpg']);

        $this->stationModelMock->method('getStationImageContent')
            ->willThrowException(new \Exception("Read fail"));

        $request = $this->createMockRequest();
        $response = $this->controller->serveStationImage($request, $this->response, ['id'=>1, 'type'=>'sensor']);
        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- HISTORY ---

    public function testGetStationWcHistorySuccess()
    {
        $this->stationModelMock->method('getStationWcHistoryData')->willReturn([1,2,3]);
        $request = $this->createMockRequest();
        $response = $this->controller->getStationWcHistory($request, $this->response, ['id'=>1]);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testGetStationWcHistoryNoId()
    {
        $request = $this->createMockRequest();
        $response = $this->controller->getStationWcHistory($request, $this->response, []);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testGetStationWcHistoryException()
    {
        $this->stationModelMock->method('getStationWcHistoryData')
            ->willThrowException(new \Exception("Err"));
        $request = $this->createMockRequest();
        $response = $this->controller->getStationWcHistory($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }
}