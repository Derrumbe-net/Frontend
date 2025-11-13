<?php
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\StationInfoController;
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    $stationInfoController = new StationInfoController($db);

    // Load JWT secret and create middleware
    $jwtSecret = $_ENV['JWT_SECRET'];
    $jwtMiddleware = new JwtMiddleware($jwtSecret);

    // ---- Public routes ----
    $app->get('/stations', [$stationInfoController, 'getAllStations']);
    $app->get('/stations/{id}', [$stationInfoController, 'getStation']);
    $app->get('/stations/files/data', [$stationInfoController, 'getAllStationFilesData']);
    $app->get('/stations/files/data/{id}', [$stationInfoController, 'getStationFileData']);
    $app->put('/stations/files/data/{id}/update', [$stationInfoController, 'processStationFileAndUpdate']);

    // ---- Protected routes ----
    $app->group('/stations', function (RouteCollectorProxy $group) use ($stationInfoController) {
        $group->post('', [$stationInfoController, 'createStation']);
        $group->put('/{id}', [$stationInfoController, 'updateStation']);
        $group->delete('/{id}', [$stationInfoController, 'deleteStation']);
    })->add($jwtMiddleware);
};
