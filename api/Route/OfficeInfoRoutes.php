<?php

use Slim\App;
use DerrumbeNet\Controller\OfficeInfoController;
use DerrumbeNet\Model\OfficeInfo;
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    $model      = new OfficeInfo($db);
    $controller = new OfficeInfoController($model);

    $jwtMiddleware = new JwtMiddleware($_ENV['JWT_SECRET']);

    // Public — any page can fetch the contact info
    $app->get('/office-info', [$controller, 'get']);

    // Protected — only logged-in CMS users can edit
    $app->put('/office-info', [$controller, 'update'])->add($jwtMiddleware);
};
