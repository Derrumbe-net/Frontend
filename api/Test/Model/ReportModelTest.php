<?php

namespace DerrumbeNet\Test\Model;

// FIX: Manually load the shared mocks
require_once __DIR__ . '/SharedFtpMocks.php';

use DerrumbeNet\Model\Report;
use PDO;
use PDOException;
use PDOStatement;
use PHPUnit\Framework\TestCase;

class ReportModelTest extends TestCase
{
    private $stmtMock;
    private $pdoMock;
    private $reportModel;

    protected function setUp(): void
    {
        // RESET SHARED STATE
        FtpState::reset();

        // Setup List for this specific test
        FtpState::$nlist = ['image.jpg', 'doc.pdf'];

        $_ENV['FTPS_SERVER'] = 'test.ftp';
        $_ENV['FTPS_USER'] = 'user';
        $_ENV['FTPS_PASS'] = 'pass';
        $_ENV['FTPS_BASE_PATH_REPORTS'] = '/files/';

        $this->stmtMock = $this->createMock(PDOStatement::class);
        $this->pdoMock = $this->createMock(PDO::class);
        $this->pdoMock->method('prepare')->willReturn($this->stmtMock);
        $this->pdoMock->method('query')->willReturn($this->stmtMock);
        $this->pdoMock->method('lastInsertId')->willReturn('123');

        $this->reportModel = new Report($this->pdoMock);
    }

    // --- DB TESTS ---
    public function testCreateReportSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertEquals('123', $this->reportModel->createReport(['city' => 'Test']));
    }
    public function testCreateReportFailure() {
        $this->stmtMock->method('execute')->willReturn(false);
        $this->assertFalse($this->reportModel->createReport(['city' => 'Fail']));
    }
    public function testCreateReportException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->reportModel->createReport([]));
    }
    public function testUpdateReportSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->reportModel->updateReport(1, []));
    }
    public function testUpdateReportException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->reportModel->updateReport(1, []));
    }
    public function testUpdateReportImageSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->reportModel->updateReportImage(1, 'path'));
    }
    public function testUpdateReportImageException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->reportModel->updateReportImage(1, 'path'));
    }
    public function testGetReportById() {
        $this->stmtMock->method('fetch')->willReturn(['id'=>1]);
        $this->assertEquals(['id'=>1], $this->reportModel->getReportById(1));
    }
    public function testGetAllReports() {
        $this->stmtMock->method('fetchAll')->willReturn([['id'=>1]]);
        $this->assertCount(1, $this->reportModel->getAllReports());
    }
    public function testDeleteReport() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->reportModel->deleteReport(1));
    }

    // --- FTP TESTS ---

    public function testUploadTextFileSuccess() {
        $result = $this->reportModel->uploadTextFile('test.txt', 'content', 'folder');
        $this->assertStringContainsString('test.txt', $result);
    }

    public function testUploadTextFileConnectFail() {
        FtpState::$connect = false;
        $this->assertFalse($this->reportModel->uploadTextFile('a', 'b'));
    }

    public function testUploadTextFileChdirFail() {
        FtpState::$chdir = false;
        $this->assertFalse($this->reportModel->uploadTextFile('a', 'b'));
    }

    public function testGetReportImageListSuccess() {
        $list = $this->reportModel->getReportImageList('folder');
        $this->assertContains('image.jpg', $list);
    }

    public function testGetReportImageContentSuccess() {
        $content = $this->reportModel->getReportImageContent('folder', 'image.jpg');
        $this->assertEquals('fake_content_bytes', $content);
    }

    public function testDeleteImageFileSuccess() {
        $this->assertTrue($this->reportModel->deleteImageFile('folder', 'img.jpg'));
    }
}