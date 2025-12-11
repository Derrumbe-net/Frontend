<?php

namespace DerrumbeNet\Test\Model;

// FIX: Manually load the shared mocks
require_once __DIR__ . '/SharedFtpMocks.php';

use DerrumbeNet\Model\Project;
use PDO;
use PDOException;
use PDOStatement;
use PHPUnit\Framework\TestCase;

class ProjectModelTest extends TestCase
{
    private $stmtMock;
    private $pdoMock;
    private $projectModel;

    protected function setUp(): void
    {
        // RESET SHARED STATE
        FtpState::reset();

        $_ENV['FTPS_SERVER'] = 'test.ftp';
        $_ENV['FTPS_USER'] = 'user';
        $_ENV['FTPS_PASS'] = 'pass';
        $_ENV['FTPS_PORT'] = 21;
        $_ENV['FTPS_BASE_PATH'] = 'files/';

        $this->stmtMock = $this->createMock(PDOStatement::class);
        $this->pdoMock = $this->createMock(PDO::class);
        $this->pdoMock->method('prepare')->willReturn($this->stmtMock);
        $this->pdoMock->method('query')->willReturn($this->stmtMock);
        $this->pdoMock->method('lastInsertId')->willReturn('123');

        $this->projectModel = new Project($this->pdoMock);
    }

    // --- DB TESTS ---
    public function testCreateProjectSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $result = $this->projectModel->createProject(['admin_id' => 1, 'title' => 'Test']);
        $this->assertEquals('123', $result);
    }

    public function testCreateProjectFailure() {
        $this->stmtMock->method('execute')->willReturn(false);
        $this->assertFalse($this->projectModel->createProject([]));
    }

    public function testCreateProjectException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->projectModel->createProject([]));
    }

    public function testGetProjectByIdFound() {
        $this->stmtMock->method('fetch')->willReturn(['project_id' => 1]);
        $this->assertEquals(['project_id' => 1], $this->projectModel->getProjectById(1));
    }

    public function testGetProjectByIdNotFound() {
        $this->stmtMock->method('fetch')->willReturn(false);
        $this->assertFalse($this->projectModel->getProjectById(99));
    }

    public function testGetAllProjects() {
        $this->stmtMock->method('fetchAll')->willReturn([]);
        $this->assertEquals([], $this->projectModel->getAllProjects());
    }

    public function testGetProjectsByStatus() {
        $this->stmtMock->method('fetchAll')->willReturn([]);
        $this->assertEquals([], $this->projectModel->getProjectsByStatus('active'));
    }

    public function testUpdateProjectSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->projectModel->updateProject(1, []));
    }

    public function testUpdateProjectException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->projectModel->updateProject(1, []));
    }

    public function testUpdateProjectImageColumnSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->projectModel->updateProjectImageColumn(1, 'img.jpg'));
    }

    public function testUpdateProjectImageColumnException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->projectModel->updateProjectImageColumn(1, 'img.jpg'));
    }

    public function testDeleteProjectSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->projectModel->deleteProject(1));
    }

    public function testDeleteProjectFailure() {
        $this->stmtMock->method('execute')->willReturn(false);
        $this->assertFalse($this->projectModel->deleteProject(1));
    }

    // --- FTP TESTS ---

    public function testUploadImageToFtpSuccess() {
        $result = $this->projectModel->uploadImageToFtp('local.jpg', 'remote.jpg');
        $this->assertEquals('remote.jpg', $result);
    }

    public function testUploadImageToFtpConnectFail() {
        FtpState::$connect = false;
        $this->expectException(\Exception::class);
        $this->projectModel->uploadImageToFtp('a', 'b');
    }

    public function testUploadImageToFtpLoginFail() {
        FtpState::$login = false;
        $this->expectException(\Exception::class);
        $this->projectModel->uploadImageToFtp('a', 'b');
    }

    public function testUploadImageToFtpPutFail() {
        FtpState::$put = false;
        $this->expectException(\Exception::class);
        $this->projectModel->uploadImageToFtp('a', 'b');
    }

    public function testGetProjectImageContentSuccess() {
        $content = $this->projectModel->getProjectImageContent('pic.jpg');
        $this->assertEquals('fake_content_bytes', $content);
    }

    public function testGetProjectImageContentDownloadFail() {
        FtpState::$get = false;
        $this->expectException(\Exception::class);
        $this->projectModel->getProjectImageContent('pic.jpg');
    }
}