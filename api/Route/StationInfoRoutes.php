<?php
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\StationInfoController;
use DerrumbeNet\Model\StationInfo; // Import Model
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    // 1. Instantiate Model
    $stationModel = new StationInfo($db);
    // 2. Inject Model into Controller
    $stationInfoController = new StationInfoController($stationModel);

    // Load JWT secret and create middleware
    $jwtSecret = $_ENV['JWT_SECRET'];
    $jwtMiddleware = new JwtMiddleware($jwtSecret);

    // ---- Public routes ----
    $app->get('/stations', [$stationInfoController, 'getAllStations']);
    $app->get('/stations/{id}', [$stationInfoController, 'getStation']);

    // Serve images
    $app->get('/stations/{id}/image/{type}', [$stationInfoController, 'serveStationImage']);

    $app->get('/stations/files/data', [$stationInfoController, 'getAllStationFilesData']);
    $app->get('/stations/files/data/{id}', [$stationInfoController, 'getStationFileData']);
    $app->put('/stations/files/data/{id}/update', [$stationInfoController, 'processStationFileAndUpdate']);
    $app->post('/stations/batch-update', [$stationInfoController, 'batchUpdateStations']);

    $app->get('/stations/history/{id}/wc', [$stationInfoController, 'getStationWcHistory']);

    // ---- Protected routes ----
    $app->group('/stations', function (RouteCollectorProxy $group) use ($stationInfoController) {
        $group->post('', [$stationInfoController, 'createStation']);
        $group->put('/{id}', [$stationInfoController, 'updateStation']);
        $group->delete('/{id}', [$stationInfoController, 'deleteStation']);

        // Upload Sensor Image - Multipart/form-data
        $group->post('/{id}/image/sensor', [$stationInfoController, 'uploadStationSensorImage']);

    })->add($jwtMiddleware);
};