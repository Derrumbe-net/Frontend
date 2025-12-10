<?php
namespace DerrumbeNet\Test;

use PHPUnit\Framework\TestCase;
use Slim\Psr7\Request;
use Slim\Psr7\Response;
use DerrumbeNet\Controller\ProjectController;
use DerrumbeNet\Model\Project;

class ProjectControllerTest extends TestCase
{
    private $projectModelMock;
    private $controller;
    private $response;

    protected function setUp(): void
    {
        // 1. Mock the Model directly (No more PDO mocks!)
        $this->projectModelMock = $this->createMock(Project::class);

        // 2. Inject the mocked model
        $this->controller = new ProjectController($this->projectModelMock);

        $this->response = new Response();
    }

    private function createMockRequest($body, $uploadedFiles = [])
    {
        $request = $this->createMock(Request::class);
        $request->method('getParsedBody')->willReturn($body);
        $request->method('getUploadedFiles')->willReturn($uploadedFiles);
        return $request;
    }

    public function testCreateProjectSuccess()
    {
        $data = ['title' => 'New Project'];
        $request = $this->createMockRequest($data);

        // EXPECTATION: Model->createProject will be called once and return ID '123'
        $this->projectModelMock->expects($this->once())
            ->method('createProject')
            ->with($data)
            ->willReturn('123');

        $response = $this->controller->createProject($request, $this->response);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            '{"message":"Project created","project_id":"123"}',
            (string) $response->getBody()
        );
    }

    public function testCreateProjectFailure()
    {
        $request = $this->createMockRequest(['admin_id' => 1]);

        // EXPECTATION: Model returns false (failure)
        $this->projectModelMock->method('createProject')->willReturn(false);

        $response = $this->controller->createProject($request, $this->response);

        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testGetProjectFound()
    {
        $request = $this->createMock(Request::class);
        $args = ['id' => 42];
        $expected = ['project_id' => 42, 'title' => 'Test'];

        // EXPECTATION: Model returns array
        $this->projectModelMock->method('getProjectById')
            ->with(42)
            ->willReturn($expected);

        $response = $this->controller->getProject($request, $this->response, $args);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            json_encode($expected),
            (string) $response->getBody()
        );
    }
}