<?php
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\PublicationController;
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    $publicationController = new PublicationController($db);

    // Load JWT secret and create middleware
    $jwtSecret = $_ENV['JWT_SECRET'];
    $jwtMiddleware = new JwtMiddleware($jwtSecret);

    // ---- Public routes ----
    $app->get('/publications', [$publicationController, 'getAllPublications']);
    $app->get('/publications/{id}', [$publicationController, 'getPublication']);

    // ---- Protected routes ----
    $app->group('/publications', function (RouteCollectorProxy $group) use ($publicationController) {
        $group->post('', [$publicationController, 'createPublication']);
        $group->put('/{id}', [$publicationController, 'updatePublication']);
        $group->delete('/{id}', [$publicationController, 'deletePublication']);
    })->add($jwtMiddleware);
};
