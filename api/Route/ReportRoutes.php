<?php
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\ReportController;
use DerrumbeNet\Model\Report; // Import Model
use DerrumbeNet\Helpers\EmailService; // Import EmailService
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    // 1. Instantiate Dependencies
    $reportModel = new Report($db);
    $emailService = new EmailService();

    // 2. Inject Dependencies into Controller
    $controller = new ReportController($reportModel, $emailService);

    $jwtSecret = $_ENV['JWT_SECRET'];
    $jwtMiddleware = new JwtMiddleware($jwtSecret);

    // Main Group for ALL report routes
    $app->group('/reports', function (RouteCollectorProxy $group) use ($controller, $jwtMiddleware) {

        // ==== PUBLIC ROUTES ====
        $group->get('', [$controller, 'getAllReports']);
        $group->post('', [$controller, 'createReport']);
        $group->get('/{id}', [$controller, 'getReport']);

        // Image Routes
        $group->post('/{id}/upload', [$controller, 'uploadReportImage']);
        $group->get('/{id}/images', [$controller, 'getReportImages']);
        $group->get('/{id}/images/{filename}', [$controller, 'serveReportImage']);

        // ==== PROTECTED ROUTES (Sub-group) ====
        $group->group('', function (RouteCollectorProxy $protected) use ($controller) {
            $protected->put('/{id}', [$controller, 'updateReport']);
            $protected->delete('/{id}', [$controller, 'deleteReport']);
            $protected->delete('/{id}/images/{filename}', [$controller, 'deleteReportImage']);

        })->add($jwtMiddleware);
    });
};