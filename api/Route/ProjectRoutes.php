<?php

use Slim\App;
use DerrumbeNet\Controller\ProjectController;
use DerrumbeNet\Model\Project;
use Slim\Routing\RouteCollectorProxy;

return function (App $app, $db) {

    // 1. Create the Model (injecting DB)
    $projectModel = new Project($db);

    // 2. Create the Controller (injecting Model)
    $projectController = new ProjectController($projectModel);

    // 3. Define Routes using the instantiated Controller
    $app->group('/projects', function (RouteCollectorProxy $group) use ($projectController) {

        // Note: We use the array syntax [$object, 'methodName']
        $group->post('', [$projectController, 'createProject']);
        $group->get('', [$projectController, 'getAllProjects']);

        $group->get('/{id}', [$projectController, 'getProject']);
        $group->put('/{id}', [$projectController, 'updateProject']);
        $group->delete('/{id}', [$projectController, 'deleteProject']);

        // Image handling
        $group->post('/{id}/image', [$projectController, 'uploadProjectImage']);
        $group->get('/{id}/image', [$projectController, 'serveProjectImage']);
    });
};