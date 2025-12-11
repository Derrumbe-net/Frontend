<?php

namespace Controller;

use DerrumbeNet\Controller\AdminController;
use DerrumbeNet\Helpers\EmailService;
use Firebase\JWT\JWT;
use PDO;
use PDOStatement;
use PHPUnit\Framework\TestCase;
use Slim\Psr7\Request;
use Slim\Psr7\Response;
use Slim\Psr7\Stream;

class AdminControllerTest extends TestCase
{
    private $pdoMock;
    private $stmtMock;
    private $emailServiceMock;
    private AdminController $controller;
    private Response $response;

    protected function setUp(): void
    {
        $_ENV['JWT_SECRET'] = 'test_secret_key';
        $_ENV['SUPERADMIN_EMAIL'] = 'super@derrumbenet.com';

        $this->stmtMock = $this->createMock(PDOStatement::class);

        $this->pdoMock = $this->createMock(PDO::class);

        $this->pdoMock->method('prepare')->willReturn($this->stmtMock);
        $this->pdoMock->method('query')->willReturn($this->stmtMock); // <--- Add this line

        $this->pdoMock->method('lastInsertId')->willReturn('42');

        $this->emailServiceMock = $this->createMock(EmailService::class);

        $this->controller = new AdminController($this->pdoMock, $this->emailServiceMock);
        $this->response = new Response();
    }

    private function createMockRequest($body, $headers = [])
    {
        $request = $this->createMock(Request::class);
        $request->method('getParsedBody')->willReturn($body);

        $request->method('getHeaderLine')->will($this->returnCallback(function($arg) use ($headers) {
            return $headers[$arg] ?? '';
        }));

        return $request;
    }

    // --- CREATE ---
    public function testCreateAdminSuccess()
    {
        $this->stmtMock->method('execute')->willReturn(true);
        $request = $this->createMockRequest(['email' => 'admin@test.com', 'password' => '1234']);

        $response = $this->controller->createAdmin($request, $this->response);
        $this->assertEquals(201, $response->getStatusCode());
    }

    public function testCreateAdminFailMissingParams()
    {
        $request = $this->createMockRequest(['email' => 'admin@test.com']); // Missing password
        $response = $this->controller->createAdmin($request, $this->response);
        $this->assertEquals(400, $response->getStatusCode());
    }

    // --- GET ---
    public function testGetAllAdmins()
    {
        $this->stmtMock->method('fetchAll')->willReturn([
            ['id' => 1, 'email' => 'a@b.com'],
            ['id' => 2, 'email' => 'c@d.com']
        ]);

        $request = $this->createMock(Request::class);
        $response = $this->controller->getAllAdmins($request, $this->response);

        $body = json_decode((string)$response->getBody(), true);
        $this->assertCount(2, $body);
        $this->assertEquals(200, $response->getStatusCode());
    }

    // --- UPDATES ---
    public function testUpdateEmailSuccess()
    {
        $this->stmtMock->method('execute')->willReturn(true);

        $request = $this->createMockRequest(['email' => 'new@test.com']);
        $response = $this->controller->updateEmail($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testUpdateEmailMissingParam()
    {
        $request = $this->createMockRequest([]);
        $response = $this->controller->updateEmail($request, $this->response, ['id' => 1]);
        $this->assertEquals(400, $response->getStatusCode());
    }

    public function testUpdatePasswordSuccess()
    {
        $this->stmtMock->method('execute')->willReturn(true);
        $request = $this->createMockRequest(['password' => 'newpass']);
        $response = $this->controller->updatePassword($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    // --- DELETE ---
    public function testDeleteAdmin()
    {
        $this->stmtMock->method('execute')->willReturn(true);

        $this->stmtMock->method('rowCount')->willReturn(1);

        $request = $this->createMock(Request::class);
        $response = $this->controller->deleteAdmin($request, $this->response, ['id' => 1]);

        $this->assertEquals(200, $response->getStatusCode());
    }

    // --- LOGIN (JWT) ---
    public function testLoginSuccess()
    {
        $password = 'secret123';
        $hash = password_hash($password, PASSWORD_DEFAULT);

        $this->stmtMock->method('fetch')->willReturn([
            'admin_id' => 1,
            'email' => 'login@test.com',
            'password' => $hash
        ]);

        $request = $this->createMockRequest(['email' => 'login@test.com', 'password' => $password]);
        $response = $this->controller->loginAdmin($request, $this->response);

        $body = json_decode((string)$response->getBody(), true);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertArrayHasKey('token', $body);

        $decoded = JWT::decode($body['token'], new \Firebase\JWT\Key($_ENV['JWT_SECRET'], 'HS256'));
        $this->assertEquals('login@test.com', $decoded->email);
    }

    public function testLoginFailInvalidCredentials()
    {
        $this->stmtMock->method('fetch')->willReturn(false);

        $request = $this->createMockRequest(['email' => 'wrong@test.com', 'password' => '123']);
        $response = $this->controller->loginAdmin($request, $this->response);

        $this->assertEquals(401, $response->getStatusCode());
    }

    // --- SIGN UP (With Email Mock) ---
    public function testSignUpAdminSendsEmail()
    {
        $this->stmtMock->method('execute')->willReturn(true);
        $this->pdoMock->method('lastInsertId')->willReturn('55');

        $this->emailServiceMock->expects($this->once())
            ->method('renderTemplate')
            ->willReturn('Email Body HTML');

        $this->emailServiceMock->expects($this->once())
            ->method('sendEmail')
            ->with($_ENV['SUPERADMIN_EMAIL'], "New Admin Signup Request", 'Email Body HTML');

        $request = $this->createMockRequest(['email' => 'newadmin@test.com', 'password' => '123']);
        $response = $this->controller->signUpAdmin($request, $this->response);

        $this->assertEquals(201, $response->getStatusCode());
    }

    // --- AUTHORIZATION (Complex Logic) ---
    public function testUpdateAuthorizationSuccess()
    {
        $payload = ['email' => $_ENV['SUPERADMIN_EMAIL'], 'iat' => time()];
        $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

        $request = $this->createMockRequest(
            ['isAuthorized' => true],
            ['Authorization' => 'Bearer ' . $token]
        );

        $this->stmtMock->method('fetch')->willReturn([
            'admin_id' => 99,
            'email' => 'target@user.com'
        ]);
        $this->stmtMock->method('execute')->willReturn(true); // For the update query

        $this->emailServiceMock->expects($this->once())->method('sendEmail');

        $response = $this->controller->updateAuthorization($request, $this->response, ['id' => 99]);

        $this->assertEquals(200, $response->getStatusCode());
        $this->assertStringContainsString('Admin Auth successfully authorized', (string)$response->getBody());
    }

    public function testUpdateAuthorizationForbidden()
    {
        $payload = ['email' => 'regular@user.com', 'iat' => time()];
        $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');

        $request = $this->createMockRequest(
            ['isAuthorized' => true],
            ['Authorization' => 'Bearer ' . $token]
        );

        $response = $this->controller->updateAuthorization($request, $this->response, ['id' => 99]);

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function testUpdateAuthorizationNoToken()
    {
        $request = $this->createMockRequest(['isAuthorized' => true]);

        $response = $this->controller->updateAuthorization($request, $this->response, ['id' => 99]);

        $this->assertEquals(403, $response->getStatusCode());
    }
}