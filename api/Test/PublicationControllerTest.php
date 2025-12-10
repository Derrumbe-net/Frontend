<?php
namespace DerrumbeNet\Test;

use PHPUnit\Framework\TestCase;
use Slim\Psr7\Request;
use Slim\Psr7\Response;
use DerrumbeNet\Controller\PublicationController;
use DerrumbeNet\Model\Publication;

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

    private function createMockRequest($body)
    {
        $request = $this->createMock(Request::class);
        $request->method('getParsedBody')->willReturn($body);
        return $request;
    }

    public function testCreatePublicationSuccess()
    {
        $data = ['admin_id' => 1, 'title' => 'New Publication'];
        $request = $this->createMockRequest($data);

        // Expect the Model to return an ID '123'
        $this->publicationModelMock->method('createPublication')->willReturn('123');

        $response = $this->controller->createPublication($request, $this->response);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            '{"message":"Publication created","publication_id":"123"}',
            (string) $response->getBody()
        );
    }

    public function testGetPublicationFound()
    {
        $request = $this->createMock(Request::class);
        $args = ['id' => 42];
        $expectedData = ['publication_id' => 42, 'title' => 'Test Pub'];

        // Expect Model to return array
        $this->publicationModelMock->method('getPublicationById')->willReturn($expectedData);

        $response = $this->controller->getPublication($request, $this->response, $args);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            json_encode($expectedData),
            (string) $response->getBody()
        );
    }

    public function testUpdatePublicationSuccess()
    {
        $data = ['title' => 'Updated Pub'];
        $request = $this->createMockRequest($data);
        $args = ['id' => 42];

        // Expect Model to return true
        $this->publicationModelMock->method('updatePublication')->willReturn(true);

        $response = $this->controller->updatePublication($request, $this->response, $args);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            '{"message":"Updated successfully"}',
            (string) $response->getBody()
        );
    }

    public function testUpdatePublicationEmptyData()
    {
        $request = $this->createMockRequest([]);
        $args = ['id' => 42];

        $response = $this->controller->updatePublication($request, $this->response, $args);

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testDeletePublicationSuccess()
    {
        $request = $this->createMock(Request::class);
        $args = ['id' => 42];

        $this->publicationModelMock->method('deletePublication')->willReturn(true);

        $response = $this->controller->deletePublication($request, $this->response, $args);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            '{"message":"Deleted"}',
            (string) $response->getBody()
        );
    }
}