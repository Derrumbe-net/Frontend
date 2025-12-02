<?php

namespace DerrumbeNet\Test;
use PHPUnit\Framework\TestCase;
use PDO;
use PDOStatement;
use DerrumbeNet\Model\Admin;

class AdminModelTest extends TestCase
{
    private $mockPDO;
    private Admin $admin;

    protected function setUp(): void
    {
        $this->mockPDO = $this->createMock(PDO::class);
        $this->admin = new Admin($this->mockPDO);
    }

    public function testCreateAdminSuccess()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);

        $pdoMock = $this->createMock(PDO::class);
        $pdoMock->method('prepare')->willReturn($stmtMock);
        $pdoMock->method('lastInsertId')->willReturn('1');

        $admin = new Admin($pdoMock);
        $result = $admin->createAdmin('test@example.com', 'password');

        $this->assertEquals('1', $result);
    }


    public function testGetAdminByIdReturnsData()
    {
        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())->method('execute');
        $mockStmt->expects($this->once())->method('fetch')->willReturn(['admin_id' => 1, 'email' => 'admin@test.com']);

        $this->mockPDO->expects($this->once())->method('prepare')->willReturn($mockStmt);

        $result = $this->admin->getAdminById(1);

        $this->assertEquals('admin@test.com', $result['email']);
    }

    public function testUpdateEmailReturnsTrue()
    {
        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())->method('execute')->willReturn(true);

        $this->mockPDO->expects($this->once())->method('prepare')->willReturn($mockStmt);

        $result = $this->admin->updateEmail(1, 'new@example.com');

        $this->assertTrue($result);
    }

    public function testUpdateAuthorizationToTrue()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        
        $stmtMock->expects($this->once())->method('execute')->willReturn(true);
        
        $stmtMock->method('rowCount')->willReturn(1);

        $this->mockPDO->expects($this->once())->method('prepare')->willReturn($stmtMock);

        $result = $this->admin->updateAuthorization(1, true);

        $this->assertTrue($result, "Failed to authorize admin (set to true)");
    }

    public function testUpdateAuthorizationToFalse()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        
        $stmtMock->expects($this->once())->method('execute')->willReturn(true);
        $stmtMock->method('rowCount')->willReturn(1);

        $this->mockPDO->expects($this->once())->method('prepare')->willReturn($stmtMock);
        
        $result = $this->admin->updateAuthorization(1, false);

        $this->assertTrue($result, "Failed to deauthorize admin (set to false)");
    }
}
