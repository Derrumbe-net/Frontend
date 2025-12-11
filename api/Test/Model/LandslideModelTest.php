<?php

namespace DerrumbeNet\Test\Model;

// FIX: Manually load the shared mocks
require_once __DIR__ . '/SharedFtpMocks.php';

use DerrumbeNet\Model\Landslide;
use PDO;
use PDOException;
use PDOStatement;
use PHPUnit\Framework\TestCase;

class LandslideModelTest extends TestCase
{
    private $stmtMock;
    private $pdoMock;
    private $landslideModel;

    protected function setUp(): void
    {
        // RESET SHARED STATE
        FtpState::reset();

        // Setup specific list for this test
        FtpState::$nlist = ['image1.jpg', 'doc.txt', 'photo.png'];

        $_ENV['FTPS_SERVER'] = 'test.ftp.com';
        $_ENV['FTPS_USER'] = 'user';
        $_ENV['FTPS_PASS'] = 'pass';
        $_ENV['FTPS_PORT'] = 21;
        $_ENV['FTPS_BASE_PATH'] = 'files/';

        $this->stmtMock = $this->createMock(PDOStatement::class);
        $this->pdoMock = $this->createMock(PDO::class);
        $this->pdoMock->method('prepare')->willReturn($this->stmtMock);
        $this->pdoMock->method('query')->willReturn($this->stmtMock);
        $this->pdoMock->method('lastInsertId')->willReturn('123');

        $this->landslideModel = new Landslide($this->pdoMock);
    }

    // --- DB TESTS ---
    public function testCreateLandslideSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $result = $this->landslideModel->createLandslide(['admin_id' => 1]);
        $this->assertEquals('123', $result);
    }
    public function testCreateLandslideFailure() {
        $this->stmtMock->method('execute')->willReturn(false);
        $this->assertFalse($this->landslideModel->createLandslide(['admin_id' => 1]));
    }
    public function testCreateLandslideException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->landslideModel->createLandslide(['admin_id' => 1]));
    }
    public function testGetLandslideByIdFound() {
        $this->stmtMock->method('fetch')->willReturn(['id'=>1]);
        $this->assertEquals(['id'=>1], $this->landslideModel->getLandslideById(1));
    }
    public function testGetLandslideByIdNotFound() {
        $this->stmtMock->method('fetch')->willReturn(false);
        $this->assertFalse($this->landslideModel->getLandslideById(99));
    }
    public function testGetAllLandslides() {
        $this->stmtMock->method('fetchAll')->willReturn([]);
        $this->assertEquals([], $this->landslideModel->getAllLandslides());
    }
    public function testUpdateLandslideSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->landslideModel->updateLandslide(1, []));
    }
    public function testUpdateLandslideException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->landslideModel->updateLandslide(1, []));
    }
    public function testDeleteLandslideSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->landslideModel->deleteLandslide(1));
    }
    public function testDeleteLandslideException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->landslideModel->deleteLandslide(1));
    }

    // --- FTP TESTS ---

    public function testGetLandslideImagesListSuccess() {
        $list = $this->landslideModel->getLandslideImagesList('folder');
        $this->assertContains('image1.jpg', $list);
        $this->assertNotContains('doc.txt', $list);
    }

    public function testGetLandslideImagesListConnectFail() {
        FtpState::$connect = false;
        $this->expectException(\Exception::class);
        $this->landslideModel->getLandslideImagesList('folder');
    }

    public function testGetLandslideImageContentSuccess() {
        $content = $this->landslideModel->getLandslideImageContent('folder', 'image1.jpg');
        $this->assertEquals('fake_content_bytes', $content);
    }
}