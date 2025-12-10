<?php
namespace Controller;

use DerrumbeNet\Controller\ProjectController;
use DerrumbeNet\Model\Project;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\UploadedFileInterface; // Import the interface
use Slim\Psr7\Request;
use Slim\Psr7\Response;

class ProjectControllerTest extends TestCase
{
    private $projectModelMock;
    private $controller;
    private $response;

    protected function setUp(): void
    {
        // 1. Mock the Model directly
        $this->projectModelMock = $this->createMock(Project::class);
        $this->controller = new ProjectController($this->projectModelMock);
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

    public function testCreateProjectSuccess()
    {
        $this->projectModelMock->method('createProject')->willReturn('123');
        $request = $this->createMockRequest(['title' => 'New']);
        $response = $this->controller->createProject($request, $this->response);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertStringContainsString('123', (string)$response->getBody());
    }

    public function testCreateProjectFailure()
    {
        $this->projectModelMock->method('createProject')->willReturn(false);
        $request = $this->createMockRequest([]);
        $response = $this->controller->createProject($request, $this->response);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testGetAllProjects()
    {
        $data = [['id'=>1], ['id'=>2]];
        $this->projectModelMock->method('getAllProjects')->willReturn($data);

        $request = $this->createMockRequest();
        $response = $this->controller->getAllProjects($request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertCount(2, json_decode((string)$response->getBody(), true));
    }

    public function testGetProjectFound()
    {
        $this->projectModelMock->method('getProjectById')->willReturn(['id'=>1, 'title'=>'Test']);
        $request = $this->createMockRequest();
        $response = $this->controller->getProject($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testGetProjectNotFound()
    {
        $this->projectModelMock->method('getProjectById')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->getProject($request, $this->response, ['id' => 99]);

        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUpdateProjectSuccess()
    {
        $this->projectModelMock->method('updateProject')->willReturn(true);
        $request = $this->createMockRequest(['title'=>'Updated']);
        $response = $this->controller->updateProject($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('Updated', (string)$response->getBody());
    }

    public function testUpdateProjectFailure()
    {
        $this->projectModelMock->method('updateProject')->willReturn(false);
        $request = $this->createMockRequest([]);
        $response = $this->controller->updateProject($request, $this->response, ['id' => 1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testDeleteProjectSuccess()
    {
        $this->projectModelMock->method('deleteProject')->willReturn(true);
        $request = $this->createMockRequest();
        $response = $this->controller->deleteProject($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testDeleteProjectFailure()
    {
        $this->projectModelMock->method('deleteProject')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->deleteProject($request, $this->response, ['id' => 1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- FILE UPLOAD TESTS ---

    public function testUploadProjectImageSuccess()
    {
        // 1. Mock the Uploaded File Interface
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('image(1).jpg'); // Name with special chars
        $fileMock->expects($this->once())->method('moveTo'); // Verify file is "moved"

        // 2. Mock finding the project
        $this->projectModelMock->method('getProjectById')->willReturn(['id' => 1]);

        // 3. Mock FTP upload and DB update in the model
        $this->projectModelMock->expects($this->once())->method('uploadImageToFtp');
        $this->projectModelMock->expects($this->once())->method('updateProjectImageColumn')
            ->with(1, 'image_1_.jpg'); // Expect sanitized filename

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadProjectImage($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('image_1_.jpg', (string)$response->getBody());
    }

    public function testUploadProjectImageNoFile()
    {
        // Empty files array
        $request = $this->createMockRequest([], []);
        $response = $this->controller->uploadProjectImage($request, $this->response, ['id' => 1]);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUploadProjectImageUploadError()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_INI_SIZE); // Simulate upload error

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadProjectImage($request, $this->response, ['id' => 1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testUploadProjectImageProjectNotFound()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);

        $this->projectModelMock->method('getProjectById')->willReturn(false);

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadProjectImage($request, $this->response, ['id' => 99]);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUploadProjectImageException()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('pic.jpg');

        $this->projectModelMock->method('getProjectById')->willReturn(['id' => 1]);

        // Simulate FTP failure
        $this->projectModelMock->method('uploadImageToFtp')
            ->willThrowException(new \Exception("FTP Timeout"));

        $request = $this->createMockRequest([], ['image' => $fileMock]);
        $response = $this->controller->uploadProjectImage($request, $this->response, ['id' => 1]);

        $this->assertEquals(500, $response->getStatusCode());
        $this->assertStringContainsString('FTP Timeout', (string)$response->getBody());
    }

    // --- IMAGE SERVING TESTS ---

    public function testServeProjectImageSuccess()
    {
        $this->projectModelMock->method('getProjectById')
            ->willReturn(['id' => 1, 'image_url' => 'pic.png']);

        $this->projectModelMock->method('getProjectImageContent')
            ->willReturn('fake_png_data');

        $request = $this->createMockRequest();
        $response = $this->controller->serveProjectImage($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('image/png', $response->getHeaderLine('Content-Type'));
        $this->assertEquals('fake_png_data', (string)$response->getBody());
    }

    public function testServeProjectImageNotFound()
    {
        $this->projectModelMock->method('getProjectById')->willReturn(false);

        $request = $this->createMockRequest();
        $response = $this->controller->serveProjectImage($request, $this->response, ['id' => 99]);

        // Fix: Use getBody() to read expected output since we wrote to it
        $response->getBody()->rewind();
        $this->assertEquals('Project not found', (string)$response->getBody());
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testServeProjectImageNoImageDefined()
    {
        // Project exists but has null image_url
        $this->projectModelMock->method('getProjectById')
            ->willReturn(['id' => 1, 'image_url' => null]);

        $request = $this->createMockRequest();
        $response = $this->controller->serveProjectImage($request, $this->response, ['id' => 1]);

        $response->getBody()->rewind();
        $this->assertEquals('Image not defined for this project', (string)$response->getBody());
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testServeProjectImageException()
    {
        $this->projectModelMock->method('getProjectById')
            ->willReturn(['id' => 1, 'image_url' => 'pic.jpg']);

        // Simulate FTP Read Error
        $this->projectModelMock->method('getProjectImageContent')
            ->willThrowException(new \Exception("File missing on FTP"));

        $request = $this->createMockRequest();
        $response = $this->controller->serveProjectImage($request, $this->response, ['id' => 1]);

        $response->getBody()->rewind();
        $this->assertEquals('Error fetching image', (string)$response->getBody());
        $this->assertEquals(500, $response->getStatusCode());
    }
}