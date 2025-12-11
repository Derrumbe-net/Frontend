<?php

namespace Middleware;

use DerrumbeNet\Middleware\SuperAdminMiddleware;
use PHPUnit\Framework\TestCase;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

class SuperAdminMiddlewareTest extends TestCase
{
    private SuperAdminMiddleware $middleware;
    private string $superEmail = 'super@admin.com';

    protected function setUp(): void
    {
        // 1. Set the Environment Variable needed by the constructor
        $_ENV['SUPERADMIN_EMAIL'] = $this->superEmail;

        $this->middleware = new SuperAdminMiddleware();
    }

    public function testAccessDeniedNoJwt()
    {
        // Request WITHOUT 'jwt' attribute
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/');
        $handler = $this->createMock(RequestHandlerInterface::class);

        $response = $this->middleware->process($request, $handler);

        $this->assertEquals(403, $response->getStatusCode());
        $this->assertStringContainsString('Permission denied', (string)$response->getBody());
    }

    public function testAccessDeniedWrongEmail()
    {
        // Request with JWT of a REGULAR user
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/')
            ->withAttribute('jwt', ['email' => 'regular@user.com']);

        $handler = $this->createMock(RequestHandlerInterface::class);

        $response = $this->middleware->process($request, $handler);

        $this->assertEquals(403, $response->getStatusCode());
    }

    public function testAccessGranted()
    {
        // Request with JWT of SUPER ADMIN
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/')
            ->withAttribute('jwt', ['email' => $this->superEmail]);

        $handler = $this->createMock(RequestHandlerInterface::class);

        // Expect handler to be called
        $handler->expects($this->once())
            ->method('handle')
            ->willReturn(new Response(200));

        $response = $this->middleware->process($request, $handler);

        $this->assertEquals(200, $response->getStatusCode());
    }
}