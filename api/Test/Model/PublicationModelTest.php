<?php

namespace DerrumbeNet\Test\Model;

// FIX: Load Shared Mocks
require_once __DIR__ . '/SharedFtpMocks.php';

use DerrumbeNet\Model\Publication;
use PDO;
use PDOException;
use PDOStatement;
use PHPUnit\Framework\TestCase;

class PublicationModelTest extends TestCase
{
    private $stmtMock;
    private $pdoMock;
    private $publicationModel;

    protected function setUp(): void
    {
        // RESET SHARED FTP STATE
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

        $this->publicationModel = new Publication($this->pdoMock);
    }

    // --- DB TESTS ---

    public function testCreatePublicationSuccess()
    {
        $data = [
            'admin_id' => 1,
            'title' => 'Test',
            'publication_url' => 'url',
            'image_url' => 'img',
            'description' => 'desc'
        ];
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertEquals('123', $this->publicationModel->createPublication($data));
    }

    public function testCreatePublicationFailure()
    {
        $this->stmtMock->method('execute')->willReturn(false);
        $this->assertFalse($this->publicationModel->createPublication(['title' => 'Fail']));
    }

    public function testCreatePublicationException()
    {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->publicationModel->createPublication([]));
    }

    public function testGetPublicationByIdFound()
    {
        $this->stmtMock->method('fetch')->willReturn(['id'=>1]);
        $this->assertEquals(['id'=>1], $this->publicationModel->getPublicationById(1));
    }

    public function testGetPublicationByIdNotFound()
    {
        $this->stmtMock->method('fetch')->willReturn(false);
        $this->assertFalse($this->publicationModel->getPublicationById(99));
    }

    public function testGetAllPublications()
    {
        $this->stmtMock->method('fetchAll')->willReturn([]);
        $this->assertEquals([], $this->publicationModel->getAllPublications());
    }

    public function testGetAllPublicationsByOldest()
    {
        $this->stmtMock->method('fetchAll')->willReturn([]);
        $this->assertEquals([], $this->publicationModel->getAllPublicationsByOldest());
    }

    public function testGetAllPublicationsByLatest()
    {
        $this->stmtMock->method('fetchAll')->willReturn([]);
        $this->assertEquals([], $this->publicationModel->getAllPublicationsByLatest());
    }

    public function testUpdatePublicationSuccess()
    {
        $data = ['title' => 'Updated', 'description' => 'New Desc'];
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->publicationModel->updatePublication(1, $data));
    }

    public function testUpdatePublicationNoChanges()
    {
        // No valid keys provided, returns true immediately
        $this->assertTrue($this->publicationModel->updatePublication(1, []));
    }

    public function testUpdatePublicationException()
    {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->publicationModel->updatePublication(1, ['title'=>'A']));
    }

    public function testUpdatePublicationImageColumnSuccess()
    {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->publicationModel->updatePublicationImageColumn(1, 'img.jpg'));
    }

    public function testUpdatePublicationImageColumnException()
    {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->publicationModel->updatePublicationImageColumn(1, 'img.jpg'));
    }

    public function testDeletePublicationSuccess()
    {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->publicationModel->deletePublication(1));
    }

    // --- FTP TESTS ---

    public function testUploadImageToFtpSuccess()
    {
        $res = $this->publicationModel->uploadImageToFtp('local.jpg', 'remote.jpg');
        $this->assertEquals('remote.jpg', $res);
    }

    public function testUploadImageToFtpConnectFail()
    {
        FtpState::$connect = false;
        $this->expectException(\Exception::class);
        $this->publicationModel->uploadImageToFtp('a', 'b');
    }

    public function testUploadImageToFtpLoginFail()
    {
        FtpState::$login = false;
        $this->expectException(\Exception::class);
        $this->publicationModel->uploadImageToFtp('a', 'b');
    }

    public function testUploadImageToFtpPutFail()
    {
        FtpState::$put = false;
        $this->expectException(\Exception::class);
        $this->publicationModel->uploadImageToFtp('a', 'b');
    }

    public function testGetPublicationImageContentSuccess()
    {
        $content = $this->publicationModel->getPublicationImageContent('pic.jpg');
        $this->assertEquals('fake_content_bytes', $content);
    }

    public function testGetPublicationImageContentDownloadFail()
    {
        FtpState::$get = false;
        $this->expectException(\Exception::class);
        $this->publicationModel->getPublicationImageContent('pic.jpg');
    }
}