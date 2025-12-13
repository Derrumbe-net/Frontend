<?php

namespace DerrumbeNet\Test\Model;

// Load the upgraded mocks
require_once __DIR__ . '/SharedFtpMocks.php';

use DerrumbeNet\Model\StationInfo;
use PDO;
use PDOException;
use PDOStatement;
use PHPUnit\Framework\TestCase;

class StationInfoModelTest extends TestCase
{
    private $stmtMock;
    private $pdoMock;
    private $stationModel;

    protected function setUp(): void
    {
        FtpState::reset(); // Reset mocks

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

        $this->stationModel = new StationInfo($this->pdoMock);
    }

    // --- CRUD TESTS ---

    public function testCreateStationInfoSuccess() {
        $data = [
            'admin_id'=>1, 'soil_saturation'=>'0.5', 'precipitation'=>'10', 'sensor_image_url'=>'s.jpg',
            'data_image_url'=>'d.jpg', 'city'=>'Test', 'is_available'=>1, 'last_updated'=>'2023-01-01',
            'latitude'=>'10', 'longitude'=>'20', 'wc1'=>'1', 'wc2'=>'1', 'wc3'=>'1', 'wc4'=>'1',
            'geological_unit'=>'A', 'land_unit'=>'B', 'elevation'=>'100', 'slope'=>'10',
            'susceptibility'=>'High', 'depth'=>'5', 'station_installation_date'=>'2020-01-01', 'collaborator'=>'Collab'
        ];
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertEquals('123', $this->stationModel->createStationInfo($data));
    }

    public function testCreateStationInfoFailure() {
        $this->stmtMock->method('execute')->willReturn(false);
        $this->assertFalse($this->stationModel->createStationInfo([]));
    }

    public function testCreateStationInfoException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->stationModel->createStationInfo([]));
    }

    public function testGetStationInfoById() {
        $this->stmtMock->method('fetch')->willReturn(['id'=>1]);
        $this->assertEquals(['id'=>1], $this->stationModel->getStationInfoById(1));
    }

    public function testGetAllStationInfos() {
        $this->stmtMock->method('fetchAll')->willReturn([]);
        $this->assertEquals([], $this->stationModel->getAllStationInfos());
    }

    public function testUpdateStationInfoSuccess() {
        $data = ['city' => 'Updated', 'elevation' => '']; // Empty string should become NULL
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->stationModel->updateStationInfo(1, $data));
    }

    public function testUpdateStationInfoNoFields() {
        $this->assertFalse($this->stationModel->updateStationInfo(1, ['bad_field' => 'val']));
    }

    public function testUpdateStationInfoException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->stationModel->updateStationInfo(1, ['city'=>'A']));
    }

    public function testDeleteStationInfoSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->stationModel->deleteStationInfo(1));
    }

    // --- BATCH UPDATE TESTS ---

    public function testUpdateStationsBatchSuccess() {
        $data = [
            ['station_id' => 1, 'precipitation' => 5, 'soil_saturation' => 0.2],
            ['station_id' => 2] // Missing fields, defaults used
        ];

        // Expect transaction methods
        $this->pdoMock->expects($this->once())->method('beginTransaction');
        $this->pdoMock->expects($this->once())->method('commit');

        $this->stmtMock->method('execute')->willReturn(true); // Success for both

        $count = $this->stationModel->updateStationsBatch($data);
        $this->assertEquals(2, $count);
    }

    public function testUpdateStationsBatchException() {
        $this->pdoMock->method('beginTransaction');
        $this->pdoMock->method('inTransaction')->willReturn(true);
        $this->pdoMock->expects($this->once())->method('rollBack');

        // Force exception
        $this->pdoMock->method('prepare')->willThrowException(new PDOException());

        $this->expectException(\Exception::class);
        $this->stationModel->updateStationsBatch([['station_id'=>1]]);
    }

    // --- FTP IMAGE TESTS ---

    public function testUploadSensorImageToFtpSuccess() {
        $res = $this->stationModel->uploadSensorImageToFtp('local.jpg', 'remote.jpg');
        $this->assertEquals('stations/remote.jpg', $res);
    }

    public function testUploadSensorImageToFtpConnectFail() {
        FtpState::$connect = false;
        $this->expectException(\Exception::class);
        $this->stationModel->uploadSensorImageToFtp('a','b');
    }

    public function testUploadSensorImageToFtpLoginFail() {
        FtpState::$login = false;
        $this->expectException(\Exception::class);
        $this->stationModel->uploadSensorImageToFtp('a','b');
    }

    public function testUploadSensorImageToFtpPutFail() {
        FtpState::$put = false;
        $this->expectException(\Exception::class);
        $this->stationModel->uploadSensorImageToFtp('a','b');
    }

    public function testUpdateStationSensorImageSuccess() {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->assertTrue($this->stationModel->updateStationSensorImage(1, 'path'));
    }

    public function testUpdateStationSensorImageException() {
        $this->stmtMock->method('execute')->willThrowException(new PDOException());
        $this->assertFalse($this->stationModel->updateStationSensorImage(1, 'path'));
    }

    public function testGetStationImageContentSuccess() {
        $content = $this->stationModel->getStationImageContent('pic.jpg');
        $this->assertEquals('fake_content_bytes', $content);
    }

    public function testGetStationImageContentFail() {
        FtpState::$get = false;
        $this->expectException(\Exception::class);
        $this->stationModel->getStationImageContent('pic.jpg');
    }

    // --- CSV / HISTORY DATA TESTS ---

    public function testGetStationFileDataSuccess() {
        // Prepare CSV Content that matches what getStationFileData expects
        // It skips first line, reads header, skips 2 lines, then reads data
        $csv  = "Meta,Info\n"; // 1. Skip
        $csv .= "TIMESTAMP,Rain(mm),SoilMoisture\n"; // 2. Header
        $csv .= "Unit,mm,%\n"; // 3. Skip
        $csv .= "Type,Avg,Avg\n"; // 4. Skip
        $csv .= "2023-01-01 12:00:00,5,30\n"; // Data
        $csv .= "2023-01-01 13:00:00,0,29\n"; // Data

        FtpState::$fgetContent = $csv;

        $result = $this->stationModel->getStationFileData('file.dat');

        $this->assertCount(2, $result);
        $this->assertEquals('5', $result[0]['Rain(mm)']);
    }

    public function testGetStationFileDataInvalidHeader() {
        FtpState::$fgetContent = ""; // Empty file
        $this->expectException(\Exception::class);
        $this->stationModel->getStationFileData('file.dat');
    }

    public function testGetStationWcHistoryDataSuccess() {
        // Mock DB returning a file path
        $this->stmtMock->method('fetch')->willReturn(['station_id'=>1, 'history_data_url'=>'hist.csv']);

        // Prepare History CSV
        // Header needs Timestamp + WC1_Avg..WC4_Avg
        $csv  = "TIMESTAMP,WC1_Avg,WC2_Avg,WC3_Avg,WC4_Avg\n";
        $csv .= "2023-01-01 10:00:00, 10, 20, 30, 40\n"; // Row 1
        $csv .= "2023-01-01 11:00:00, 12, 22, 32, 42\n"; // Row 2 (Same day, so it averages)

        FtpState::$fgetContent = $csv;

        $result = $this->stationModel->getStationWcHistoryData(1);

        $this->assertCount(1, $result); // 1 Day
        $this->assertEquals('2023-01-01', $result[0]['timestamp']);
        // Avg of WC1: (10+12)/2 = 11
        $this->assertEquals(11, $result[0]['wc1']);
    }

    public function testGetStationWcHistoryDataMissingColumns() {
        $this->stmtMock->method('fetch')->willReturn(['station_id'=>1, 'history_data_url'=>'hist.csv']);

        // Missing WC columns
        $csv = "TIMESTAMP,Rain\n2023-01-01,5";
        FtpState::$fgetContent = $csv;

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Required columns not found');

        $this->stationModel->getStationWcHistoryData(1);
    }

    public function testProcessStationFileAndUpdateSuccess() {
        // 1. Mock finding station
        $this->stmtMock->method('fetch')->willReturn(['station_id'=>1, 'ftp_file_path'=>'data.dat']);

        // 2. Prepare Valid CSV for getStationFileData
        $csv  = "Skip\nTIMESTAMP,Rain(mm),SoilMoisture\nSkip\nSkip\n";
        $csv .= "2023-01-01 12:00:00,15,45\n"; // Latest row
        FtpState::$fgetContent = $csv;

        // 3. Mock Update Execution
        $this->stmtMock->method('execute')->willReturn(true);

        $result = $this->stationModel->processStationFileAndUpdate(1);
        $this->assertTrue($result);
    }
}