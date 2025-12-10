<?php
namespace DerrumbeNet\Test;

use PHPUnit\Framework\TestCase;
use Slim\Psr7\Request;
use Slim\Psr7\Response;
use Slim\Psr7\UploadedFile;
use DerrumbeNet\Controller\StationInfoController;
use DerrumbeNet\Model\StationInfo;

class StationInfoControllerTest extends TestCase
{
    private $stationModelMock;
    private $controller;
    private $response;

    protected function setUp(): void
    {
        // 1. Mock the Model
        $this->stationModelMock = $this->createMock(StationInfo::class);

        // 2. Inject it
        $this->controller = new StationInfoController($this->stationModelMock);
        $this->response = new Response();
    }

    private function createMockRequest($body)
    {
        $request = $this->createMock(Request::class);
        $request->method('getParsedBody')->willReturn($body);
        return $request;
    }

    public function testCreateStationSuccess()
    {
        $data = ['city' => 'Test Station'];
        $request = $this->createMockRequest($data);

        $this->stationModelMock->method('createStationInfo')->willReturn('123');

        $response = $this->controller->createStation($request, $this->response);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            '{"message":"Station created","id":"123"}',
            (string) $response->getBody()
        );
    }

    public function testUpdateStationSuccess()
    {
        $data = ['city' => 'Updated'];
        $request = $this->createMockRequest($data);
        $args = ['id' => 42];

        $this->stationModelMock->method('updateStationInfo')->willReturn(true);

        $response = $this->controller->updateStation($request, $this->response, $args);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            '{"message":"Updated"}',
            (string) $response->getBody()
        );
    }

    public function testUploadStationSensorImageSuccess()
    {
        // Mock File
        $uploadedFile = $this->createMock(UploadedFile::class);
        $uploadedFile->method('getError')->willReturn(UPLOAD_ERR_OK);
        $uploadedFile->method('getClientFilename')->willReturn('sensor.jpg');

        // Mock Request
        $request = $this->createMock(Request::class);
        $request->method('getUploadedFiles')->willReturn(['image' => $uploadedFile]);

        $args = ['id' => 42];

        // Mock Model: station exists
        $this->stationModelMock->method('getStationInfoById')->willReturn(['station_id' => 42]);

        // Mock Model: Upload returns path
        $this->stationModelMock->method('uploadSensorImageToFtp')->willReturn('stations/sensor.jpg');
        $this->stationModelMock->method('updateStationSensorImage')->willReturn(true);

        $response = $this->controller->uploadStationSensorImage($request, $this->response, $args);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('sensor.jpg', (string)$response->getBody());
    }
}