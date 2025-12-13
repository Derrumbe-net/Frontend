<?php

namespace Middleware;

use DerrumbeNet\Middleware\JwtMiddleware;
use Firebase\JWT\JWT;
use PHPUnit\Framework\TestCase;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

class JwtMiddlewareTest extends TestCase
{
    private string $secret = 'test_secret_key_12345';
    private JwtMiddleware $middleware;

    protected function setUp(): void
    {
        $this->middleware = new JwtMiddleware($this->secret);
    }

    private function createRequestWithHeader($headerValue)
    {
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/');
        if ($headerValue) {
            $request = $request->withHeader('Authorization', $headerValue);
        }
        return $request;
    }

    private function createMockHandler()
    {
        // Creates a "fake" next step in the app that returns 200 OK
        $handler = $this->createMock(RequestHandlerInterface::class);
        $handler->method('handle')->willReturn(new Response(200));
        return $handler;
    }

    public function testMissingHeader()
    {
        $request = $this->createRequestWithHeader(null); // No header
        $handler = $this->createMock(RequestHandlerInterface::class);

        // Ensure handler is NEVER called because middleware stops it
        $handler->expects($this->never())->method('handle');

        $response = $this->middleware->process($request, $handler);

        $this->assertEquals(401, $response->getStatusCode());
        $this->assertStringContainsString('Missing or invalid Authorization header', (string)$response->getBody());
    }

    public function testInvalidHeaderFormat()
    {
        $request = $this->createRequestWithHeader('Basic 12345'); // Wrong scheme
        $handler = $this->createMock(RequestHandlerInterface::class);

        $response = $this->middleware->process($request, $handler);

        $this->assertEquals(401, $response->getStatusCode());
    }

    public function testInvalidTokenSignature()
    {
        // Token signed with WRONG key
        $token = JWT::encode(['sub' => 1], 'wrong_key', 'HS256');
        $request = $this->createRequestWithHeader('Bearer ' . $token);

        $handler = $this->createMock(RequestHandlerInterface::class);
        $handler->expects($this->never())->method('handle');

        $response = $this->middleware->process($request, $handler);

        $this->assertEquals(401, $response->getStatusCode());
        $this->assertStringContainsString('Signature verification failed', (string)$response->getBody());
    }

    public function testExpiredToken()
    {
        // Token expired 1 hour ago
        $payload = ['sub' => 1, 'exp' => time() - 3600];
        $token = JWT::encode($payload, $this->secret, 'HS256');

        $request = $this->createRequestWithHeader('Bearer ' . $token);
        $handler = $this->createMock(RequestHandlerInterface::class);

        $response = $this->middleware->process($request, $handler);

        $this->assertEquals(401, $response->getStatusCode());
        $this->assertStringContainsString('Expired token', (string)$response->getBody());
    }

    public function testValidToken()
    {
        $payload = ['sub' => 1, 'email' => 'test@test.com', 'exp' => time() + 3600];
        $token = JWT::encode($payload, $this->secret, 'HS256');

        $request = $this->createRequestWithHeader('Bearer ' . $token);

        // We expect the handler to be called ONCE
        $handler = $this->createMock(RequestHandlerInterface::class);
        $handler->expects($this->once())
            ->method('handle')
            ->willReturnCallback(function ($req) {
                // Verify the middleware added the 'jwt' attribute
                $jwtAttr = $req->getAttribute('jwt');
                $this->assertIsArray($jwtAttr);
                $this->assertEquals('test@test.com', $jwtAttr['email']);
                return new Response(200);
            });

        $response = $this->middleware->process($request, $handler);

        $this->assertEquals(200, $response->getStatusCode());
    }
}