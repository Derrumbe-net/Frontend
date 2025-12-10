<?php

namespace DerrumbeNet\Controller;

use DerrumbeNet\Model\Admin;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use DerrumbeNet\Helpers\EmailService;

class AdminController {
    private Admin $adminModel;
    private EmailService $emailService;

    public function __construct($db) {
        $this->adminModel = new Admin($db);
        $this->emailService = new EmailService();
    }

    private function jsonResponse($response, $data, $status = 200) {
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload);
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    // Create a new admin
    public function createAdmin($request, $response) {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            return $this->jsonResponse($response, ['error' => 'Email and Password are required'], 400);
        }

        $newId = $this->adminModel->createAdmin($email, $password);
        if ($newId) {

            return $this->jsonResponse($response, ['message' => 'Admin created', 'id' => $newId], 201);
        }

        return $this->jsonResponse($response, ['error' => 'Failed to create admin'], 500);
    }

    // Get admin by ID
    public function getAdmin($request, $response, $args) {
        $id = $args['id'];
        $admin = $this->adminModel->getAdminById($id);

        if ($admin) {
            return $this->jsonResponse($response, $admin);
        }

        return $this->jsonResponse($response, ['error' => 'Admin not found'], 404);
    }

    // Get all admins
    public function getAllAdmins($request, $response) {
        $admins = $this->adminModel->getAllAdmins();
        return $this->jsonResponse($response, $admins);
    }

        // Helper to decode token manually 
        private function getRequestorEmail($request) {
            $authHeader = $request->getHeaderLine('Authorization');
            if (!$authHeader) return null;
    
            $token = str_replace('Bearer ', '', $authHeader);
            
            try {
                // Use your stored secret key
                $key = new Key($_ENV['JWT_SECRET'], 'HS256');
                $decoded = JWT::decode($token, $key);
                return $decoded->email ?? null;
            } catch (\Exception $e) {
                return null;
            }
        }
    
        // Update admin authorization
        public function updateAuthorization($request, $response, $args) {
            $targetAdminId = $args['id'];
            $data = $request->getParsedBody();
    
            if (!isset($data['isAuthorized'])) {
                return $this->jsonResponse($response, ['error' => 'isAuthorized field is required'], 400);
            }
    
            $requesterEmail = $this->getRequestorEmail($request);
    
            if (!$requesterEmail || strtolower($requesterEmail) !== "slidespr@gmail.com") {
                return $this->jsonResponse($response, [
                    'error' => 'Forbidden: Only the Super Admin can change authorization status.'
                ], 403);
            }
            
            $isAuthorized = $data['isAuthorized'];
            $updated = $this->adminModel->updateAuthorization($targetAdminId, $isAuthorized);
    
            if ($updated) {
                $statusMsg = $isAuthorized ? 'authorized' : 'deauthorized';
                return $this->jsonResponse($response, ['message' => "Admin Auth successfully $statusMsg"]);
            }
    
            return $this->jsonResponse($response, ['error' => 'Failed to update authorization'], 500);
        }

    // Update admin email
    public function updateEmail($request, $response, $args) {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $email = $data['email'] ?? null;

        if (!$email) {
            return $this->jsonResponse($response, ['error' => 'Email is required'], 400);
        }

        $updated = $this->adminModel->updateEmail($id, $email);
        if ($updated) {
            return $this->jsonResponse($response, ['message' => 'Email updated']);
        }

        return $this->jsonResponse($response, ['error' => 'Failed to update email'], 500);
    }

    // Update admin password
    public function updatePassword($request, $response, $args) {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $password = $data['password'] ?? null;

        if (!$password) {
            return $this->jsonResponse($response, ['error' => 'Password is required'], 400);
        }

        $updated = $this->adminModel->updatePassword($id, $password);
        if ($updated) {
            return $this->jsonResponse($response, ['message' => 'Password updated']);
        }

        return $this->jsonResponse($response, ['error' => 'Failed to update password'], 500);
    }

    // Delete admin
    public function deleteAdmin($request, $response, $args) {
        $id = $args['id'];
        $deleted = $this->adminModel->deleteAdminById($id);

        if ($deleted) {
            return $this->jsonResponse($response, ['message' => 'Admin deleted']);
        }

        return $this->jsonResponse($response, ['error' => 'Failed to delete admin'], 500);
    }

    // Sign up a new admin
    public function signUpAdmin($request, $response) {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            return $this->jsonResponse($response, ['error' => 'Email and Password are required'], 400);
        }

        $newId = $this->adminModel->createAdmin($email, $password);
        if ($newId) {
            try {
                // Load and send email
                $body = $this->emailService->renderTemplate('new_admin', [
                    'email' => $email
                ]);

                $this->emailService->sendEmail(
                    $_ENV['SUPERADMIN_EMAIL'],
                    "New Admin Signup Request",
                    $body
                );
            } catch (\Exception $e) {
                error_log("Email error: " . $e->getMessage());
            }

            return $this->jsonResponse($response, ['message' => 'Admin created', 'id' => $newId], 201);
        }

        return $this->jsonResponse($response, ['error' => 'Failed to create admin'], 500);
    }

    // Log in an admin and return JWT
    public function loginAdmin($request, $response) {
        $data = $request->getParsedBody();
        $email = $data['email'];
        $password = $data['password'];

        if (!$email || !$password) {
            return $this->jsonResponse($response, ['error' => 'Email and password are required'], 400);
        }

        $admin = $this->adminModel->verifyCredentials($email, $password);
        if (!$admin) {
            return $this->jsonResponse($response, ['error' => 'Invalid email or password'], 401);
        }

        // JWT secret key (store in env or config file)
        $secretKey = $_ENV['JWT_SECRET'];

        $payload = [
            'iss' => 'derrumbenet', // issuer
            'sub' => $admin['admin_id'], // subject (admin id)
            'email' => $admin['email'],
            'iat' => time(), // issued at
            'exp' => time() + 3600 // expires in 1 hour
        ];

        $jwt = JWT::encode($payload, $secretKey, 'HS256');

        return $this->jsonResponse($response, [
            'message' => 'Login successful',
            'token' => $jwt
        ]);
    }
}
