<?php

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\TeamMemberController;
use DerrumbeNet\Model\TeamMember;
use DerrumbeNet\Middleware\JwtMiddleware;

return function (App $app, $db) {
    $model      = new TeamMember($db);
    $controller = new TeamMemberController($model);

    $jwtSecret     = $_ENV['JWT_SECRET'];
    $jwtMiddleware  = new JwtMiddleware($jwtSecret);

    // ---- Public routes ----
    $app->get('/team-members',            [$controller, 'getAllMembers']);
    $app->get('/team-members/{id}',       [$controller, 'getMember']);
    $app->get('/team-members/{id}/image', [$controller, 'serveMemberImage']);

    // ---- Protected routes ----
    $app->group('/team-members', function (RouteCollectorProxy $group) use ($controller) {
        $group->post('',              [$controller, 'createMember']);
        $group->put('/{id}',          [$controller, 'updateMember']);
        $group->delete('/{id}',       [$controller, 'deleteMember']);
        $group->post('/{id}/image',   [$controller, 'uploadMemberImage']);
    })->add($jwtMiddleware);
};
