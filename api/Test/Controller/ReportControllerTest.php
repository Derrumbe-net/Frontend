<?php
namespace Controller;

use DerrumbeNet\Controller\ReportController;
use DerrumbeNet\Helpers\EmailService;
use DerrumbeNet\Model\Report;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\UploadedFileInterface;
use Psr\Http\Message\StreamInterface;
use Slim\Psr7\Request;
use Slim\Psr7\Response;

class ReportControllerTest extends TestCase
{
    private $reportModelMock;
    private $emailServiceMock;
    private $controller;
    private $response;

    protected function setUp(): void
    {
        $this->reportModelMock = $this->createMock(Report::class);
        $this->emailServiceMock = $this->createMock(EmailService::class);

        $this->controller = new ReportController(
            $this->reportModelMock,
            $this->emailServiceMock
        );
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

    public function testCreateReportSuccess()
    {
        $this->reportModelMock->method('createReport')->willReturn('101');
        $this->reportModelMock->method('updateReportImage')->willReturn(true); // Verifies logic

        $request = $this->createMockRequest(['city' => 'Test', 'reported_at' => '2025-01-01']);
        $response = $this->controller->createReport($request, $this->response);

        $this->assertEquals(201, $response->getStatusCode());
        $this->assertStringContainsString('"report_id":"101"', (string)$response->getBody());
    }

    public function testCreateReportNoData()
    {
        $request = $this->createMockRequest([]); // Empty body
        $response = $this->controller->createReport($request, $this->response);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testCreateReportFailure()
    {
        $this->reportModelMock->method('createReport')->willReturn(false); // DB Error

        $request = $this->createMockRequest(['city' => 'Test']);
        $response = $this->controller->createReport($request, $this->response);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testGetAllReports()
    {
        $this->reportModelMock->method('getAllReports')->willReturn([['id'=>1]]);
        $request = $this->createMockRequest();
        $response = $this->controller->getAllReports($request, $this->response);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testGetReportFound()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['id'=>1]);
        $request = $this->createMockRequest();
        $response = $this->controller->getReport($request, $this->response, ['id'=>1]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testGetReportNotFound()
    {
        $this->reportModelMock->method('getReportById')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->getReport($request, $this->response, ['id'=>99]);

        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUpdateReportSuccess()
    {
        $this->reportModelMock->method('updateReport')->willReturn(true);

        // Test sanitization: empty string '' should become null in logic
        $data = ['city' => 'Updated', 'latitude' => ''];
        $request = $this->createMockRequest($data);

        $response = $this->controller->updateReport($request, $this->response, ['id'=>1]);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testUpdateReportEmptyData()
    {
        $request = $this->createMockRequest([]);
        $response = $this->controller->updateReport($request, $this->response, ['id'=>1]);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUpdateReportFailure()
    {
        $this->reportModelMock->method('updateReport')->willReturn(false);
        $request = $this->createMockRequest(['city'=>'A']);
        $response = $this->controller->updateReport($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testDeleteReportSuccess()
    {
        $this->reportModelMock->method('deleteReport')->willReturn(true);
        $request = $this->createMockRequest();
        $response = $this->controller->deleteReport($request, $this->response, ['id'=>1]);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testDeleteReportFailure()
    {
        $this->reportModelMock->method('deleteReport')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->deleteReport($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- IMAGE UPLOAD TESTS ---

    public function testUploadReportImageSuccess()
    {
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('photo.jpg');

        // Mock getStream()->getContents()
        $streamMock = $this->createMock(StreamInterface::class);
        $streamMock->method('getContents')->willReturn('fake_data');
        $fileMock->method('getStream')->willReturn($streamMock);

        // Report exists, has folder
        $this->reportModelMock->method('getReportById')
            ->willReturn(['report_id' => 99, 'image_url' => 'folder_99', 'reported_at' => '2025-01-01']);

        // Expect upload
        $this->reportModelMock->expects($this->once())
            ->method('uploadTextFile')
            ->willReturn('path/to/file.jpg');

        $request = $this->createMockRequest([], ['image_file' => $fileMock]);
        $response = $this->controller->uploadReportImage($request, $this->response, ['id' => 99]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testUploadReportImageCreatesFolderIfEmpty()
    {
        // Report exists, BUT image_url (folder) is empty
        $this->reportModelMock->method('getReportById')
            ->willReturn(['report_id' => 99, 'image_url' => '', 'reported_at' => '2025-01-01']);

        // Expect updateReportImage to be called to save new folder name
        $this->reportModelMock->expects($this->once())->method('updateReportImage');

        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('photo.jpg');
        $fileMock->method('getStream')->willReturn($this->createMock(StreamInterface::class));
        $this->reportModelMock->method('uploadTextFile')->willReturn('path.jpg');

        $request = $this->createMockRequest([], ['image_file' => $fileMock]);
        $this->controller->uploadReportImage($request, $this->response, ['id' => 99]);
    }

    public function testUploadReportImageReportNotFound()
    {
        $this->reportModelMock->method('getReportById')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->uploadReportImage($request, $this->response, ['id' => 99]);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testUploadReportImageInvalidType()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'f']);

        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('malicious.exe'); // Invalid ext

        $request = $this->createMockRequest([], ['image_file' => $fileMock]);
        $response = $this->controller->uploadReportImage($request, $this->response, ['id' => 99]);

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUploadReportImageNoFile()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'f']);
        $request = $this->createMockRequest([], []); // No files
        $response = $this->controller->uploadReportImage($request, $this->response, ['id' => 99]);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUploadReportImageFtpFail()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'f']);

        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('pic.jpg');
        $fileMock->method('getStream')->willReturn($this->createMock(StreamInterface::class));

        // Model returns false (upload failed)
        $this->reportModelMock->method('uploadTextFile')->willReturn(false);

        $request = $this->createMockRequest([], ['image_file' => $fileMock]);
        $response = $this->controller->uploadReportImage($request, $this->response, ['id' => 99]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    public function testUploadReportImageException()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'f']);
        $fileMock = $this->createMock(UploadedFileInterface::class);
        $fileMock->method('getError')->willReturn(UPLOAD_ERR_OK);
        $fileMock->method('getClientFilename')->willReturn('pic.jpg');
        $fileMock->method('getStream')->willReturn($this->createMock(StreamInterface::class));

        $this->reportModelMock->method('uploadTextFile')->willThrowException(new \Exception("Err"));

        $request = $this->createMockRequest([], ['image_file' => $fileMock]);
        $response = $this->controller->uploadReportImage($request, $this->response, ['id' => 99]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- GET IMAGES ---

    public function testGetReportImagesSuccess()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'folder']);
        $this->reportModelMock->method('getReportImageList')->willReturn(['a.jpg']);

        $request = $this->createMockRequest();
        $response = $this->controller->getReportImages($request, $this->response, ['id'=>1]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('a.jpg', (string)$response->getBody());
    }

    public function testGetReportImagesReportNotFound()
    {
        $this->reportModelMock->method('getReportById')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->getReportImages($request, $this->response, ['id'=>1]);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testGetReportImagesNoFolder()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>null]);
        $request = $this->createMockRequest();
        $response = $this->controller->getReportImages($request, $this->response, ['id'=>1]);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('"images":[]', (string)$response->getBody());
    }

    public function testGetReportImagesException()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'f']);
        $this->reportModelMock->method('getReportImageList')->willThrowException(new \Exception("Err"));

        $request = $this->createMockRequest();
        $response = $this->controller->getReportImages($request, $this->response, ['id'=>1]);
        $this->assertEquals(500, $response->getStatusCode());
    }

    // --- SERVE IMAGE ---

    public function testServeReportImageSuccess()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'f']);
        $this->reportModelMock->method('getReportImageContent')->willReturn('bytes');

        $request = $this->createMockRequest();
        $response = $this->controller->serveReportImage($request, $this->response, ['id'=>1, 'filename'=>'a.png']);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('image/png', $response->getHeaderLine('Content-Type'));
    }

    public function testServeReportImageReportNotFound()
    {
        $this->reportModelMock->method('getReportById')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->serveReportImage($request, $this->response, ['id'=>1, 'filename'=>'a.jpg']);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testServeReportImageNoFolder()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>null]);
        $request = $this->createMockRequest();
        $response = $this->controller->serveReportImage($request, $this->response, ['id'=>1, 'filename'=>'a.jpg']);

        $this->assertEquals(404, $response->getStatusCode());
        $response->getBody()->rewind();
        $this->assertStringContainsString('Folder name not found', (string)$response->getBody());
    }

    public function testServeReportImageContentEmpty()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'f']);
        $this->reportModelMock->method('getReportImageContent')->willReturn(false);

        $request = $this->createMockRequest();
        $response = $this->controller->serveReportImage($request, $this->response, ['id'=>1, 'filename'=>'a.jpg']);

        $this->assertEquals(404, $response->getStatusCode());
        $response->getBody()->rewind();
        $this->assertStringContainsString('Image content empty', (string)$response->getBody());
    }

    public function testServeReportImageException()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'f']);
        $this->reportModelMock->method('getReportImageContent')->willThrowException(new \Exception("Err"));

        $request = $this->createMockRequest();
        $response = $this->controller->serveReportImage($request, $this->response, ['id'=>1, 'filename'=>'a.jpg']);

        $this->assertEquals(404, $response->getStatusCode());
        $response->getBody()->rewind();
        $this->assertStringContainsString('Image not found', (string)$response->getBody());
    }

    // --- DELETE IMAGE ---

    public function testDeleteReportImageSuccess()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'f']);
        $this->reportModelMock->method('deleteImageFile')->willReturn(true);

        $request = $this->createMockRequest();
        $response = $this->controller->deleteReportImage($request, $this->response, ['id'=>1, 'filename'=>'a.jpg']);
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testDeleteReportImageReportNotFound()
    {
        $this->reportModelMock->method('getReportById')->willReturn(false);
        $request = $this->createMockRequest();
        $response = $this->controller->deleteReportImage($request, $this->response, ['id'=>1, 'filename'=>'a.jpg']);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testDeleteReportImageNoFolder()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>null]);
        $request = $this->createMockRequest();
        $response = $this->controller->deleteReportImage($request, $this->response, ['id'=>1, 'filename'=>'a.jpg']);
        $this->assertEquals(404, $response->getStatusCode());
    }

    public function testDeleteReportImageFailure()
    {
        $this->reportModelMock->method('getReportById')->willReturn(['image_url'=>'f']);
        $this->reportModelMock->method('deleteImageFile')->willReturn(false);

        $request = $this->createMockRequest();
        $response = $this->controller->deleteReportImage($request, $this->response, ['id'=>1, 'filename'=>'a.jpg']);
        $this->assertEquals(500, $response->getStatusCode());
    }
}