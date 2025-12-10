<?php
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\ReportController;
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    $controller = new ReportController($db);
    $jwtSecret = $_ENV['JWT_SECRET'];
    $jwtMiddleware = new JwtMiddleware($jwtSecret);

    // Main Group for ALL report routes
    $app->group('/reports', function (RouteCollectorProxy $group) use ($controller, $jwtMiddleware) {

        // ==== PUBLIC ROUTES ====
        $group->get('', [$controller, 'getAllReports']);
        $group->post('', [$controller, 'createReport']);
        $group->get('/{id}', [$controller, 'getReport']);

        // Image Routes (Updated to match Landslide Structure)
        $group->post('/{id}/upload', [$controller, 'uploadReportImage']);
        $group->get('/{id}/images', [$controller, 'getReportImages']); // Returns list
        $group->get('/{id}/images/{filename}', [$controller, 'serveReportImage']); // Returns binary

        // ==== PROTECTED ROUTES (Sub-group) ====
        $group->group('', function (RouteCollectorProxy $protected) use ($controller) {
            $protected->put('/{id}', [$controller, 'updateReport']);
            $protected->delete('/{id}', [$controller, 'deleteReport']);
        })->add($jwtMiddleware);

    });
};