<?php
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\ProjectController;
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    $controller = new ProjectController($db);

    // Load JWT secret and create middleware
    $jwtSecret = $_ENV['JWT_SECRET'];
    $jwtMiddleware = new JwtMiddleware($jwtSecret);

    // ---- Public routes ----
    $app->get('/projects', [$controller, 'getAllProjects']);
    $app->get('/projects/{id}', [$controller, 'getProject']);

    // ---- Protected routes ----
    $app->group('/projects', function (RouteCollectorProxy $group) use ($controller) {
        $group->post('', [$controller, 'createProject']);
        $group->put('/{id}', [$controller, 'updateProject']);
        $group->delete('/{id}', [$controller, 'deleteProject']);
    })->add($jwtMiddleware);
};
