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
        $group->get('', [$controller, 'getAllReports']);      // GET /reports
        $group->post('', [$controller, 'createReport']);     // POST /reports
        $group->get('/{id}', [$controller, 'getReport']);    // GET /reports/{id}
        $group->post('/{id}/upload', [$controller, 'uploadReportImage']); // POST /reports/{id}/upload

        // ==== PROTECTED ROUTES (Sub-group) ====
        $group->group('', function (RouteCollectorProxy $protected) use ($controller) {
            $protected->put('/{id}', [$controller, 'updateReport']);    // PUT /reports/{id}
            $protected->delete('/{id}', [$controller, 'deleteReport']); // DELETE /reports/{id}
        })->add($jwtMiddleware); // Middleware only applies to this sub-group

    });
};