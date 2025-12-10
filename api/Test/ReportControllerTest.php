<?php
namespace DerrumbeNet\Test;

use PHPUnit\Framework\TestCase;
use Slim\Psr7\Request;
use Slim\Psr7\Response;
use Slim\Psr7\UploadedFile;
use DerrumbeNet\Controller\ReportController;
use DerrumbeNet\Model\Report;
use DerrumbeNet\Helpers\EmailService;

class ReportControllerTest extends TestCase
{
    private $reportModelMock;
    private $emailServiceMock;
    private $controller;
    private $response;

    protected function setUp(): void
    {
        // Mock Model AND EmailService
        $this->reportModelMock = $this->createMock(Report::class);
        $this->emailServiceMock = $this->createMock(EmailService::class);

        $this->controller = new ReportController(
            $this->reportModelMock,
            $this->emailServiceMock
        );
        $this->response = new Response();
    }

    public function testCreateReportSuccess()
    {
        // Mock Request
        $request = $this->createMock(Request::class);
        $request->method('getParsedBody')->willReturn(['city' => 'Test', 'reported_at' => '2025-01-01']);

        // Mock Model Behavior
        $this->reportModelMock->method('createReport')->willReturn('101');
        $this->reportModelMock->method('updateReportImage')->willReturn(true);

        $response = $this->controller->createReport($request, $this->response);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertStringContainsString('"report_id":"101"', (string)$response->getBody());
    }

    public function testUploadReportImageSuccess()
    {
        $reportId = 99;

        // 1. Mock Uploaded File
        $uploadedFile = $this->createMock(UploadedFile::class);
        $uploadedFile->method('getError')->willReturn(UPLOAD_ERR_OK);
        $uploadedFile->method('getClientFilename')->willReturn('photo.jpg');
        $uploadedFile->method('getStream')->willReturn(
            $this->createMock(\Psr\Http\Message\StreamInterface::class) // Stream mock
        );

        // 2. Mock Request
        $request = $this->createMock(Request::class);
        $request->method('getUploadedFiles')->willReturn(['image_file' => $uploadedFile]);

        // 3. Mock Model Behavior
        // Return a report so validation passes
        $this->reportModelMock->method('getReportById')->willReturn([
            'report_id' => $reportId,
            'image_url' => '2025-01-01_99'
        ]);

        // Mock the FTP upload function! This prevents actual FTP connection.
        $this->reportModelMock->expects($this->once())
            ->method('uploadTextFile')
            ->willReturn('files/landslides/2025-01-01_99/photo.jpg');

        $response = $this->controller->uploadReportImage($request, $this->response, ['id' => $reportId]);

        $this->assertEquals(200, $response->getStatusCode());

        $body = json_decode((string)$response->getBody(), true);
        $this->assertEquals('files/landslides/2025-01-01_99/photo.jpg', $body['path']);
    }
}