<?php

namespace Controller;

use DerrumbeNet\Controller\LandslideController;
use DerrumbeNet\Model\Landslide; // Import the Model
use PDO;
use PHPUnit\Framework\TestCase;
use Slim\Psr7\Request;
use Slim\Psr7\Response;

class LandslideControllerTest extends TestCase
{
    private $landslideModelMock;
    private $controller;
    private $response;

    protected function setUp(): void
    {
        // 1. Create a Mock of the Landslide Model
        // We don't need to mock PDO anymore because we are mocking the Model directly
        $this->landslideModelMock = $this->createMock(Landslide::class);

        // 2. Pass a dummy PDO (null is fine since the model is mocked)
        // and our Mock Model to the Controller
        $pdoDummy = $this->createMock(PDO::class);
        $this->controller = new LandslideController($pdoDummy, $this->landslideModelMock);

        $this->response = new Response();
    }

    private function createMockRequest($body = [], $args = [])
    {
        $request = $this->createMock(Request::class);
        $request->method('getParsedBody')->willReturn($body);
        return $request;
    }

    // --- CRUD TESTS ---

    public function testCreateLandslideSuccess()
    {
        $this->landslideModelMock->method('createLandslide')->willReturn(123);

        $request = $this->createMockRequest(['latitude' => '10.0']);
        $response = $this->controller->createLandslide($request, $this->response);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertStringContainsString('"id":123', (string)$response->getBody());
    }

    public function testCreateLandslideFailure()
    {
        $this->landslideModelMock->method('createLandslide')->willReturn(false);

        $request = $this->createMockRequest(['latitude' => '10.0']);
        $response = $this->controller->createLandslide($request, $this->response);

        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testGetAllLandslides()
    {
        $this->landslideModelMock->method('getAllLandslides')->willReturn([['id'=>1], ['id'=>2]]);

        $request = $this->createMockRequest();
        $response = $this->controller->getAllLandslides($request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('[{"id":1},{"id":2}]', (string)$response->getBody());
    }

    public function testGetLandslideFound()
    {
        $this->landslideModelMock->method('getLandslideById')->willReturn(['id'=>55, 'city'=>'Mayaguez']);

        $request = $this->createMockRequest();
        $response = $this->controller->getLandslide($request, $this->response, ['id' => 55]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('Mayaguez', (string)$response->getBody());
    }

    public function testGetLandslideNotFound()
    {
        $this->landslideModelMock->method('getLandslideById')->willReturn(false);

        $request = $this->createMockRequest();
        $response = $this->controller->getLandslide($request, $this->response, ['id' => 99]);

        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUpdateLandslideSuccess()
    {
        $this->landslideModelMock->method('updateLandslide')->willReturn(true);

        $request = $this->createMockRequest(['city' => 'New City']);
        $response = $this->controller->updateLandslide($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('Updated', (string)$response->getBody());
    }

    public function testUpdateLandslideFailure()
    {
        $this->landslideModelMock->method('updateLandslide')->willReturn(false);

        $request = $this->createMockRequest(['city' => 'New City']);
        $response = $this->controller->updateLandslide($request, $this->response, ['id' => 1]);

        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testDeleteLandslideSuccess()
    {
        $this->landslideModelMock->method('deleteLandslide')->willReturn(true);

        $request = $this->createMockRequest();
        $response = $this->controller->deleteLandslide($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testDeleteLandslideFailure()
    {
        $this->landslideModelMock->method('deleteLandslide')->willReturn(false);

        $request = $this->createMockRequest();
        $response = $this->controller->deleteLandslide($request, $this->response, ['id' => 1]);

        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- IMAGE TESTS ---

    public function testGetLandslideImagesSuccess()
    {
        // 1. Mock finding the landslide
        $this->landslideModelMock->method('getLandslideById')
            ->willReturn(['image_url' => 'folder_123']);

        // 2. Mock finding the images in that folder
        $this->landslideModelMock->method('getLandslideImagesList')
            ->willReturn(['img1.jpg', 'img2.png']);

        $request = $this->createMockRequest();
        $response = $this->controller->getLandslideImages($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('img1.jpg', (string)$response->getBody());
    }

    public function testGetLandslideImagesNoFolder()
    {
        // Landslide exists, but 'image_url' (folder) is empty/null
        $this->landslideModelMock->method('getLandslideById')
            ->willReturn(['image_url' => null]);

        $request = $this->createMockRequest();
        $response = $this->controller->getLandslideImages($request, $this->response, ['id' => 1]);

        // Expect empty array, not error
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('"images":[]', (string)$response->getBody());
    }

    public function testGetLandslideImagesException()
    {
        $this->landslideModelMock->method('getLandslideById')
            ->willReturn(['image_url' => 'folder_bad']);

        // Simulate NAS/File System error
        $this->landslideModelMock->method('getLandslideImagesList')
            ->willThrowException(new \Exception("NAS unreachable"));

        $request = $this->createMockRequest();
        $response = $this->controller->getLandslideImages($request, $this->response, ['id' => 1]);

        $this->assertEquals(500, $response->getStatusCode());
        $this->assertStringContainsString('NAS unreachable', (string)$response->getBody());
    }

    public function testServeLandslideImageSuccessPng()
    {
        $this->landslideModelMock->method('getLandslideById')
            ->willReturn(['image_url' => 'folder_123']);

        // Mock returning raw image bytes
        $this->landslideModelMock->method('getLandslideImageContent')
            ->willReturn('fake_image_bytes');

        $request = $this->createMockRequest();
        $response = $this->controller->serveLandslideImage($request, $this->response, ['id' => 1, 'filename' => 'pic.png']);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('image/png', $response->getHeaderLine('Content-Type'));
        $this->assertEquals('fake_image_bytes', (string)$response->getBody());
    }

    public function testServeLandslideImageNotFound()
    {
        $this->landslideModelMock->method('getLandslideById')
            ->willReturn(['image_url' => 'folder_123']);

        // Simulate file not found on disk
        $this->landslideModelMock->method('getLandslideImageContent')
            ->willThrowException(new \Exception("File not found"));

        $request = $this->createMockRequest();
        $response = $this->controller->serveLandslideImage($request, $this->response, ['id' => 1, 'filename' => 'missing.jpg']);

        // Look for the manual 404 write
        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('Image not found', (string)$response->getBody());
    }

    public function testServeLandslideImageNoFolderInDB()
    {
        // Landslide has no folder configured
        $this->landslideModelMock->method('getLandslideById')
            ->willReturn(['image_url' => null]);

        $request = $this->createMockRequest();
        $response = $this->controller->serveLandslideImage($request, $this->response, ['id' => 1, 'filename' => 'pic.jpg']);

        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('Folder name not found in DB', (string)$response->getBody());
    }
}