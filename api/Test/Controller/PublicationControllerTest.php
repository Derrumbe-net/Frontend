<?php
namespace Controller;

use DerrumbeNet\Controller\PublicationController;
use DerrumbeNet\Model\Publication;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\UploadedFileInterface; // Required for file upload tests
use Slim\Psr7\Request;
use Slim\Psr7\Response;

class PublicationControllerTest extends TestCase
{
    private $publicationModelMock;
    private $controller;
    private $response;

    protected function setUp(): void
    {
        // 1. Mock the Model directly
        $this->publicationModelMock = $this->createMock(Publication::class);

        // 2. Inject the mocked model
        $this->controller = new PublicationController($this->publicationModelMock);
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

    public function testCreatePublicationSuccess()
    {
        $this->publicationModelMock->method('createPublication')->willReturn('123');

        $request = $this->createMockRequest(['title' => 'New Pub']);
        $response = $this->controller->createPublication($request, $this->response);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertStringContainsString('123', (string)$response->getBody());
    }

    public function testCreatePublicationFailure()
    {
        $this->publicationModelMock->method('createPublication')->willReturn(false);

        $request = $this->createMockRequest(['title' => 'Fail']);
        $response = $this->controller->createPublication($request, $this->response);

        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testGetAllPublications()
    {
        $this->publicationModelMock->method('getAllPublications')
            ->willReturn([['id'=>1], ['id'=>2]]);

        $request = $this->createMockRequest();
        $response = $this->controller->getAllPublications($request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertCount(2, json_decode((string)$response->getBody(), true));
    }

    public function testGetPublicationFound()
    {
        $this->publicationModelMock->method('getPublicationById')
            ->willReturn(['id' => 42, 'title' => 'Test']);

        $request = $this->createMockRequest();
        $response = $this->controller->getPublication($request, $this->response, ['id' => 42]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testGetPublicationNotFound()
    {
        $this->publicationModelMock->method('getPublicationById')->willReturn(false);

        $request = $this->createMockRequest();
        $response = $this->controller->getPublication($request, $this->response, ['id' => 99]);

        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUpdatePublicationSuccess()
    {
        $this->publicationModelMock->method('updatePublication')->willReturn(true);

        $request = $this->createMockRequest(['title' => 'Updated']);
        $response = $this->controller->updatePublication($request, $this->response, ['id' => 42]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('Updated successfully', (string)$response->getBody());
    }

    public function testUpdatePublicationEmptyData()
    {
        // No mock needed for model, controller returns early
        $request = $this->createMockRequest([]);
        $response = $this->controller->updatePublication($request, $this->response, ['id' => 42]);

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUpdatePublicationFailure()
    {
        $this->publicationModelMock->method('updatePublication')->willReturn(false);

        $request = $this->createMockRequest(['title' => 'Fail']);
        $response = $this->controller->updatePublication($request, $this->response, ['id' => 42]);

        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testDeletePublicationSuccess()
    {
        $this->publicationModelMock->method('deletePublication')->willReturn(true);

        $request = $this->createMockRequest();
        $response = $this->controller->deletePublication($request, $this->response, ['id' => 42]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testDeletePublicationFailure()
    {
        $this->publicationModelMock->method('deletePublication')->willReturn(false);

        $request = $this->createMockRequest();
        $response = $this->controller->deletePublication($request, $this->response, ['id' => 42]);

        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- FILE UPLOAD TESTS ---

    public function testUploadPublicationImageSuccess()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('doc.pdf');

        // Mock finding the publication
        $this->publicationModelMock->method('getPublicationById')->willReturn(['id'=>1]);

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadPublicationImage($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('Image uploaded successfully', (string)$response->getBody());
    }

    public function testUploadPublicationImageNoFile()
    {
        $request = $this->createMockRequest([], []); // Empty files array
        $response = $this->controller->uploadPublicationImage($request, $this->response, ['id' => 1]);

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUploadPublicationImageUploadError()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_CANT_WRITE);

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadPublicationImage($request, $this->response, ['id' => 1]);

        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testUploadPublicationImageNotFound()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);

        $this->publicationModelMock->method('getPublicationById')->willReturn(false);

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadPublicationImage($request, $this->response, ['id' => 99]);

        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUploadPublicationImageException()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('doc.pdf');

        $this->publicationModelMock->method('getPublicationById')->willReturn(['id'=>1]);

        // Simulate FTP failure
        $this->publicationModelMock->method('uploadImageToFtp')
            ->willThrowException(new \Exception("FTP Error"));

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadPublicationImage($request, $this->response, ['id' => 1]);

        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- SERVE IMAGE TESTS ---

    public function testServePublicationImageSuccess()
    {
        $this->publicationModelMock->method('getPublicationById')
            ->willReturn(['id'=>1, 'image_url'=>'test.png']);

        $this->publicationModelMock->method('getPublicationImageContent')
            ->willReturn('fake_image_bytes');

        $request = $this->createMockRequest();
        $response = $this->controller->servePublicationImage($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('image/png', $response->getHeaderLine('Content-Type'));
    }

    public function testServePublicationImageNotFound()
    {
        $this->publicationModelMock->method('getPublicationById')->willReturn(false);

        $request = $this->createMockRequest();
        $response = $this->controller->servePublicationImage($request, $this->response, ['id' => 99]);

        $response->getBody()->rewind();
        $this->assertEquals('Publication not found', (string)$response->getBody());
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testServePublicationImageNotDefined()
    {
        $this->publicationModelMock->method('getPublicationById')
            ->willReturn(['id'=>1, 'image_url'=>null]);

        $request = $this->createMockRequest();
        $response = $this->controller->servePublicationImage($request, $this->response, ['id' => 1]);

        $response->getBody()->rewind();
        $this->assertEquals('Image not defined for this publication', (string)$response->getBody());
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testServePublicationImageException()
    {
        $this->publicationModelMock->method('getPublicationById')
            ->willReturn(['id'=>1, 'image_url'=>'test.jpg']);

        $this->publicationModelMock->method('getPublicationImageContent')
            ->willThrowException(new \Exception("File read error"));

        $request = $this->createMockRequest();
        $response = $this->controller->servePublicationImage($request, $this->response, ['id' => 1]);

        $response->getBody()->rewind();
        $this->assertEquals('Error fetching image', (string)$response->getBody());
        $this->assertEquals(500, $response->getStatusCode());
    }
}