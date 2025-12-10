<?php
namespace DerrumbeNet\Test;

use PHPUnit\Framework\TestCase;
use DerrumbeNet\Model\Report;
use PDO;
use PDOStatement;
use PDOException;

class ReportModelTest extends TestCase
{
    private $stmtMock;
    private $pdoMock;
    private $reportModel;

    protected function setUp(): void
    {
        $this->stmtMock = $this->createMock(PDOStatement::class);
        $this->pdoMock = $this->createMock(PDO::class);
        $this->pdoMock->method('prepare')->willReturn($this->stmtMock);
        $this->pdoMock->method('query')->willReturn($this->stmtMock);
        $this->pdoMock->method('lastInsertId')->willReturn('123');

        $this->reportModel = new Report($this->pdoMock);
    }

    public function testCreateReportSuccess()
    {
        // Provide all keys expected by the Model to avoid PHP Notices
        $data = [
            'landslide_id' => 1,
            'reported_at' => '2023-01-01',
            'description' => 'Test',
            'city' => 'Test City',
            'image_url' => '',
            'latitude' => 10.0,
            'longitude' => 10.0,
            'reporter_name' => 'John',
            'reporter_phone' => '555',
            'reporter_email' => 'a@b.com',
            'physical_address' => 'Addr'
        ];

        $this->stmtMock->method('execute')->willReturn(true);

        $result = $this->reportModel->createReport($data);
        $this->assertEquals('123', $result);
    }

    public function testUpdateReportSuccess()
    {
        // Provide keys for update
        $data = ['landslide_id' => 1, 'city' => 'Updated'];
        $this->stmtMock->method('execute')->willReturn(true);

        $result = $this->reportModel->updateReport(1, $data);
        $this->assertTrue($result);
    }

    public function testCreateReportFailure()
    {
        $data = []; // Empty or dummy data

        $this->stmtMock->method('execute')->willReturn(false);

        $result = $this->reportModel->createReport($data);
        $this->assertFalse($result);
    }

    public function testCreateReportThrowsException()
    {
        $data = [/* ... */];
        $this->stmtMock->method('execute')->will($this->throwException(new PDOException()));

        $result = $this->reportModel->createReport($data);
        $this->assertFalse($result);
    }

    public function testGetReportByIdFound()
    {
        $expectedData = ['report_id' => 42, 'city' => 'Test'];

        $this->stmtMock->method('fetch')->willReturn($expectedData);

        $result = $this->reportModel->getReportById(42);
        $this->assertEquals($expectedData, $result);
    }

    public function testGetReportByIdNotFound()
    {
        $this->stmtMock->method('fetch')->willReturn(false);

        $result = $this->reportModel->getReportById(99);
        $this->assertFalse($result);
    }

    public function testGetAllReports()
    {
        $expectedData = [/* ... */];
        $this->stmtMock->method('fetchAll')->willReturn($expectedData);
        $result = $this->reportModel->getAllReports();
        $this->assertEquals($expectedData, $result);
    }

    public function testDeleteReportSuccess()
    {
        $this->stmtMock->method('execute')->willReturn(true);
        $result = $this->reportModel->deleteReport(1);
        $this->assertTrue($result);
    }
}