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
    private $admin;

    protected function setUp(): void
    {
        $this->mockPDO = $this->createMock(PDO::class);
        $this->admin = new Admin($this->mockPDO);
    }

    // --- CREATE ADMIN TESTS ---

    public function testCreateAdminSuccess()
    {
        // 1. Mock Check Email Existence (Return False -> Email is new)
        $stmtCheck = $this->createMock(PDOStatement::class);
        $stmtCheck->method('execute')->willReturn(true);
        $stmtCheck->method('fetch')->willReturn(false);

        // 2. Mock Insert (Return True -> Success)
        $stmtInsert = $this->createMock(PDOStatement::class);
        $stmtInsert->method('execute')->willReturn(true);

        // 3. Configure PDO to return statements in sequence
        $this->mockPDO->expects($this->exactly(2))
            ->method('prepare')
            ->willReturnOnConsecutiveCalls($stmtCheck, $stmtInsert);

        $this->mockPDO->method('lastInsertId')->willReturn('55');

        $result = $this->admin->createAdmin('new@test.com', 'password');

        // Assertions for the new Array return format
        $this->assertIsArray($result);
        $this->assertEquals('55', $result['id']);
        $this->assertArrayHasKey('token', $result);
        $this->assertEquals(64, strlen($result['token'])); // Verify token length
    }

    public function testCreateAdminEmailExists()
    {
        // Mock Check Email Existence (Return Data -> Email exists)
        $stmtCheck = $this->createMock(PDOStatement::class);
        $stmtCheck->method('execute')->willReturn(true);
        $stmtCheck->method('fetch')->willReturn(['admin_id' => 1]);

        $this->mockPDO->expects($this->once())->method('prepare')->willReturn($stmtCheck);

        $result = $this->admin->createAdmin('existing@test.com', 'password');

        $this->assertEquals(-1, $result);
    }

    public function testCreateAdminFailure()
    {
        // Email check passes, but Insert fails
        $stmtCheck = $this->createMock(PDOStatement::class);
        $stmtCheck->method('fetch')->willReturn(false);

        $stmtInsert = $this->createMock(PDOStatement::class);
        $stmtInsert->method('execute')->willReturn(false);

        $this->mockPDO->method('prepare')->willReturnOnConsecutiveCalls($stmtCheck, $stmtInsert);

        $this->assertFalse($this->admin->createAdmin('fail@test.com', 'password'));
    }

    public function testCreateAdminThrowsException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->createAdmin('a', 'b'));
    }

    // --- NEW VERIFICATION TESTS ---

    public function testGetAdminByTokenFound()
    {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('fetch')->willReturn(['admin_id' => 1]);
        $this->mockPDO->method('prepare')->willReturn($stmt);

        $this->assertEquals(['admin_id' => 1], $this->admin->getAdminByToken('token_123'));
    }

    public function testGetAdminByTokenException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->getAdminByToken('token_123'));
    }

    public function testGetAdminByEmailFound()
    {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('fetch')->willReturn(['admin_id' => 1]);
        $this->mockPDO->method('prepare')->willReturn($stmt);

        $this->assertEquals(['admin_id' => 1], $this->admin->getAdminByEmail('a@b.com'));
    }

    public function testGetAdminByEmailException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->getAdminByEmail('a@b.com'));
    }

    public function testVerifyEmailSuccess()
    {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('execute')->willReturn(true);
        $this->mockPDO->method('prepare')->willReturn($stmt);

        $this->assertTrue($this->admin->verifyEmail(1));
    }

    public function testVerifyEmailException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->verifyEmail(1));
    }

    // --- CREDENTIALS (UPDATED LOGIC) ---

    public function testVerifyCredentialsSuccess()
    {
        $hash = password_hash('password', PASSWORD_DEFAULT);
        $stmt = $this->createMock(PDOStatement::class);
        // Ensure it returns a user (implying verified=1 and authorized=1 checks passed in SQL)
        $stmt->method('fetch')->willReturn(['admin_id' => 1, 'password' => $hash]);

        $this->mockPDO->method('prepare')->willReturn($stmt);

        $result = $this->admin->verifyCredentials('test@test.com', 'password');
        $this->assertEquals(1, $result['admin_id']);
    }

    public function testVerifyCredentialsException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->verifyCredentials('a', 'b'));
    }

    // --- SIGN UP (LEGACY METHOD) ---

    public function testSignUpAdminSuccess()
    {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('execute')->willReturn(true);
        $this->mockPDO->method('prepare')->willReturn($stmt);
        $this->mockPDO->method('lastInsertId')->willReturn('99');

        $this->assertEquals('99', $this->admin->signUpAdmin('u', 'p'));
    }

    public function testSignUpAdminException()
    {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->signUpAdmin('a', 'b'));
    }

    // --- STANDARD GETTERS/SETTERS (COVERAGE) ---

    public function testGetAdminById() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('fetch')->willReturn(['id'=>1]);
        $this->mockPDO->method('prepare')->willReturn($stmt);
        $this->assertEquals(['id'=>1], $this->admin->getAdminById(1));
    }

    public function testGetAdminByIdException() {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->getAdminById(1));
    }

    public function testGetAllAdmins() {
        $stmt = $this->createMock(PDOStatement::class);
        $this->mockPDO->method('query')->willReturn($stmt);
        $this->admin->getAllAdmins();
        $this->addToAssertionCount(1); // Just verify it runs
    }

    public function testGetAllAdminsException() {
        $this->mockPDO->method('query')->willThrowException(new PDOException());
        $this->assertEquals([], $this->admin->getAllAdmins());
    }

    public function testGetEmailById() {
        $stmt = $this->createMock(PDOStatement::class);
        $this->mockPDO->method('prepare')->willReturn($stmt);
        $this->admin->getEmailById(1);
        $this->addToAssertionCount(1);
    }

    public function testGetEmailByIdException() {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->getEmailById(1));
    }

    public function testGetPasswordById() {
        $stmt = $this->createMock(PDOStatement::class);
        $this->mockPDO->method('prepare')->willReturn($stmt);
        $this->admin->getPasswordById(1);
        $this->addToAssertionCount(1);
    }

    public function testGetPasswordByIdException() {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->getPasswordById(1));
    }

    public function testUpdateAuthorization() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('execute')->willReturn(true);
        $this->mockPDO->method('prepare')->willReturn($stmt);
        $this->assertTrue($this->admin->updateAuthorization(1, true));
    }

    public function testUpdateAuthorizationException() {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->updateAuthorization(1, true));
    }

    public function testUpdateEmail() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('execute')->willReturn(true);
        $this->mockPDO->method('prepare')->willReturn($stmt);
        $this->assertTrue($this->admin->updateEmail(1, 'a'));
    }

    public function testUpdateEmailException() {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->updateEmail(1, 'a'));
    }

    public function testUpdatePassword() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('execute')->willReturn(true);
        $this->mockPDO->method('prepare')->willReturn($stmt);
        $this->assertTrue($this->admin->updatePassword(1, 'p'));
    }

    public function testUpdatePasswordException() {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->updatePassword(1, 'p'));
    }

    public function testDeleteAdminById() {
        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('execute')->willReturn(true);
        $this->mockPDO->method('prepare')->willReturn($stmt);
        $this->assertTrue($this->admin->deleteAdminById(1));
    }

    public function testDeleteAdminByIdException() {
        $this->mockPDO->method('prepare')->willThrowException(new PDOException());
        $this->assertFalse($this->admin->deleteAdminById(1));
    }
}