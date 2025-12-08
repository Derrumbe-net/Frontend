<?php
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\ReportController;
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    $controller = new ReportController($db);

    // Load JWT secret and create middleware
    $jwtSecret = $_ENV['JWT_SECRET'];
    $jwtMiddleware = new JwtMiddleware($jwtSecret);

    // ---- Public routes ----
    $app->get('/reports', [$controller, 'getAllReports']);
    $app->get('/reports/{id}', [$controller, 'getReport']);
    $app->post('/reports', [$controller, 'createReport']);
    $app->post('/reports/{id}/upload',[$controller, 'uploadReportImage']);

    // ---- Protected routes ----
    $app->group('/reports', function (RouteCollectorProxy $group) use ($controller) {
        $group->put('/{id}', [$controller, 'updateReport']);
        $group->delete('/{id}', [$controller, 'deleteReport']);
    })->add($jwtMiddleware);
};
