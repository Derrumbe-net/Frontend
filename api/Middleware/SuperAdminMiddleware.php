<?php
namespace DerrumbeNet\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Http\Server\MiddlewareInterface;
use Slim\Psr7\Response as SlimResponse;

class SuperAdminMiddleware implements MiddlewareInterface {
    private string $superAdminEmail;

    public function __construct(string $email = 'slidespr@gmail.com') {
        $this->superAdminEmail = $email;
    }

    public function process(Request $request, RequestHandler $handler): Response {
        $user = $request->getAttribute('jwt');

        if (!$user || !isset($user['email']) || $user['email'] !== $this->superAdminEmail) {
            $response = new SlimResponse();
            $response->getBody()->write(json_encode([
                'error' => 'Permission denied: Only Super Admin can do this action'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
        }

        return $handler->handle($request);
    }
}