<?php
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use DerrumbeNet\Controller\AdminController;
use DerrumbeNet\Middleware\JwtMiddleware;
use DerrumbeNet\Middleware\SuperAdminMiddleware;

return function (App $app, $db) {
    $adminController = new AdminController($db);

    // Load JWT secret and create middleware
    $jwtSecret = $_ENV['JWT_SECRET'] ?? 'CHANGE_THIS_SECRET_KEY';
    $jwtMiddleware = new JwtMiddleware($jwtSecret);
    $superAdminMiddleware = new SuperAdminMiddleware();

    // ---- Public routes (no authentication required) ----
    $app->post('/admins/login', [$adminController, 'loginAdmin']);
    $app->post('/admins/signup', [$adminController, 'signUpAdmin']);

    // ---- Protected routes (require valid JWT) ----
    $app->group('/admins', function (RouteCollectorProxy $group) use ($adminController, $superAdminMiddleware) {
        $group->post('', [$adminController, 'createAdmin']);
        $group->get('', [$adminController, 'getAllAdmins']);
        $group->get('/{id}', [$adminController, 'getAdmin']);
        $group->put('/{id}/email', [$adminController, 'updateEmail']);
        $group->put('/{id}/password', [$adminController, 'updatePassword']);
        $group->put('/{id}/isAuthorized', [$adminController, 'updateAuthorization'])
            ->add($superAdminMiddleware);
        $group->delete('/{id}', [$adminController, 'deleteAdmin'])
            ->add($superAdminMiddleware);
    })->add($jwtMiddleware);
};
