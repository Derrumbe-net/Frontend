<?php
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\LandslideController;
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    $landslideController = new LandslideController($db);

    // Load JWT secret and create middleware
    $jwtSecret = $_ENV['JWT_SECRET'];
    $jwtMiddleware = new JwtMiddleware($jwtSecret);

    // ---- Public routes ----
    $app->get('/landslides', [$landslideController, 'getAllLandslides']);
    $app->get('/landslides/{id}', [$landslideController, 'getLandslide']);

    // ---- Protected routes ----
    $app->group('/landslides', function (RouteCollectorProxy $group) use ($landslideController) {
        $group->post('', [$landslideController, 'createLandslide']);
        $group->put('/{id}', [$landslideController, 'updateLandslide']);
        $group->delete('/{id}', [$landslideController, 'deleteLandslide']);
    })->add($jwtMiddleware);
};
