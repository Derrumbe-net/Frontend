<?php

namespace DerrumbeNet\Test\Model;

use DerrumbeNet\Model\Admin;
use PDO;
use PDOException;
use PDOStatement;
use PHPUnit\Framework\TestCase;

class AdminModelTest extends TestCase
{
    private $mockPDO;
    private Admin $admin;

    protected function setUp(): void
    {
        $this->mockPDO = $this->createMock(PDO::class);
        $this->admin = new Admin($this->mockPDO);
    }

    // --- SUCCESS SCENARIOS ---

    public function testCreateAdminSuccess()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);

        $this->mockPDO->method('prepare')->willReturn($stmtMock);
        $this->mockPDO->method('lastInsertId')->willReturn('1');

        $result = $this->admin->createAdmin('test@example.com', 'password');
        $this->assertEquals('1', $result);
    }

    public function testGetAllAdmins()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $expectedData = [['id' => 1, 'email' => 'a@b.com'], ['id' => 2, 'email' => 'c@d.com']];

        $stmtMock->method('fetchAll')->willReturn($expectedData);

        // getAllAdmins uses query(), not prepare()
        $this->mockPDO->expects($this->once())->method('query')->willReturn($stmtMock);

        $result = $this->admin->getAllAdmins();
        $this->assertEquals($expectedData, $result);
    }

    public function testGetAdminById()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);
        $stmtMock->method('fetch')->willReturn(['admin_id' => 1, 'email' => 'admin@test.com']);

        $this->mockPDO->method('prepare')->willReturn($stmtMock);

        $result = $this->admin->getAdminById(1);
        $this->assertEquals('admin@test.com', $result['email']);
    }

    public function testGetEmailById()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('fetch')->willReturn(['email' => 'found@test.com']);

        $this->mockPDO->method('prepare')->willReturn($stmtMock);

        $result = $this->admin->getEmailById(1);
        $this->assertEquals('found@test.com', $result['email']);
    }

    public function testGetPasswordById()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('fetch')->willReturn(['password' => 'hashed_secret']);

        $this->mockPDO->method('prepare')->willReturn($stmtMock);

        $result = $this->admin->getPasswordById(1);
        $this->assertEquals('hashed_secret', $result['password']);
    }

    public function testUpdateEmail()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);
        $this->mockPDO->method('prepare')->willReturn($stmtMock);

        $this->assertTrue($this->admin->updateEmail(1, 'new@test.com'));
    }

    public function testUpdatePassword()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);
        $this->mockPDO->method('prepare')->willReturn($stmtMock);

        $this->assertTrue($this->admin->updatePassword(1, 'newPass123'));
    }

    public function testUpdateAuthorization()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);
        $this->mockPDO->method('prepare')->willReturn($stmtMock);

        $this->assertTrue($this->admin->updateAuthorization(1, true));
    }

    public function testDeleteAdminById()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);
        $this->mockPDO->method('prepare')->willReturn($stmtMock);

        $this->assertTrue($this->admin->deleteAdminById(1));
    }

    public function testSignUpAdmin()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);

        $this->mockPDO->method('prepare')->willReturn($stmtMock);
        $this->mockPDO->method('lastInsertId')->willReturn('55');

        $result = $this->admin->signUpAdmin('new@user.com', 'pass');
        $this->assertEquals('55', $result);
    }

    // --- CREDENTIALS VERIFICATION ---

    public function testVerifyCredentialsSuccess()
    {
        $password = 'secret123';
        $hash = password_hash($password, PASSWORD_DEFAULT);

        $stmtMock = $this->createMock(PDOStatement::class);
        // Mock returning the user with the correct hash
        $stmtMock->method('fetch')->willReturn(['admin_id' => 1, 'password' => $hash]);

        $this->mockPDO->method('prepare')->willReturn($stmtMock);

        $result = $this->admin->verifyCredentials('test@test.com', $password);

        $this->assertIsArray($result); // Should return user array
        $this->assertEquals(1, $result['admin_id']);
    }

    public function testVerifyCredentialsWrongPassword()
    {
        $hash = password_hash('correct_pass', PASSWORD_DEFAULT);

        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('fetch')->willReturn(['admin_id' => 1, 'password' => $hash]);

        $this->mockPDO->method('prepare')->willReturn($stmtMock);

        $result = $this->admin->verifyCredentials('test@test.com', 'wrong_pass');

        $this->assertFalse($result); // Should fail
    }

    public function testVerifyCredentialsUserNotFound()
    {
        $stmtMock = $this->createMock(PDOStatement::class);
        $stmtMock->method('fetch')->willReturn(false); // No user found

        $this->mockPDO->method('prepare')->willReturn($stmtMock);

        $result = $this->admin->verifyCredentials('missing@test.com', 'pass');

        $this->assertFalse($result);
    }

    // --- EXCEPTION HANDLING (COVERAGE FOR CATCH BLOCKS) ---

    public function testCreateAdminThrowsException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException("DB Error"));
        $this->assertFalse($this->admin->createAdmin('a', 'b'));
    }

    public function testGetAllAdminsThrowsException()
    {
        $this->mockPDO->method('query')->willThrowException(new PDOException("DB Error"));
        $this->assertEquals([], $this->admin->getAllAdmins()); // Returns empty array on error
    }

    public function testGetAdminByIdThrowsException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException("DB Error"));
        $this->assertFalse($this->admin->getAdminById(1));
    }

    public function testUpdateEmailThrowsException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException("DB Error"));
        $this->assertFalse($this->admin->updateEmail(1, 'e'));
    }

    public function testUpdatePasswordThrowsException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException("DB Error"));
        $this->assertFalse($this->admin->updatePassword(1, 'p'));
    }

    public function testDeleteAdminThrowsException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException("DB Error"));
        $this->assertFalse($this->admin->deleteAdminById(1));
    }

    public function testVerifyCredentialsThrowsException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException("DB Error"));
        $this->assertFalse($this->admin->verifyCredentials('a', 'b'));
    }
}