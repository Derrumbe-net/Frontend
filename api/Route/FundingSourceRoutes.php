<?php

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\FundingSourceController;
use DerrumbeNet\Model\FundingSource;
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    $model      = new FundingSource($db);
    $controller = new FundingSourceController($model);

    $jwtSecret    = $_ENV['JWT_SECRET'];
    $jwtMiddleware = new JwtMiddleware($jwtSecret);

    // ---- Public routes ----
    $app->get('/funding-sources',            [$controller, 'getAllFundingSources']);
    $app->get('/funding-sources/{id}',       [$controller, 'getFundingSource']);
    $app->get('/funding-sources/{id}/image', [$controller, 'serveFundingSourceImage']);

    // ---- Protected routes ----
    $app->group('/funding-sources', function (RouteCollectorProxy $group) use ($controller) {
        $group->post('',            [$controller, 'createFundingSource']);
        $group->put('/{id}',        [$controller, 'updateFundingSource']);
        $group->delete('/{id}',     [$controller, 'deleteFundingSource']);
        $group->post('/{id}/image', [$controller, 'uploadFundingSourceImage']);
    })->add($jwtMiddleware);
};
