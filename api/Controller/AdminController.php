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

    public function __construct($db, EmailService $emailService = null) {
        $this->adminModel = new Admin($db);
        $this->emailService = $emailService ?? new EmailService();
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
    
        // Only Super Admin can do this
        $requesterEmail = $this->getRequestorEmail($request);
    
        if (!$requesterEmail || strtolower($requesterEmail) !== strtolower($_ENV['SUPERADMIN_EMAIL'])) {
            return $this->jsonResponse($response, [
                'error' => 'Forbidden: Only the Super Admin can change authorization status.'
            ], 403);
        }
    
        $isAuthorized = (bool) $data['isAuthorized'];
        $updated = $this->adminModel->updateAuthorization($targetAdminId, $isAuthorized);
    
        if ($updated) {
            // Fetch the admin's info
            $targetAdmin = $this->adminModel->getAdminById($targetAdminId);
    
            // ✔ Only send an email when they are approved
            if ($isAuthorized && $targetAdmin && !empty($targetAdmin['email'])) {
                try {
                    // Render email template
                    $body = $this->emailService->renderTemplate('admin_welcome', [
                        'email' => $targetAdmin['email'],
                        'cms_link' => $_ENV['FRONTEND_URL'] . "/cms"
                    ]);
    
                    // Send the approval email
                    $this->emailService->sendEmail(
                        $targetAdmin['email'],
                        "Your Admin Access Has Been Approved",
                        $body
                    );
    
                } catch (\Exception $e) {
                    error_log("Authorization Email Error: " . $e->getMessage());
                }
            }
    
            $statusMsg = $isAuthorized ? 'authorized' : 'deauthorized';
            return $this->jsonResponse($response, [
                'message' => "Admin Auth successfully $statusMsg"
            ]);
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

    // --- MODIFIED: Sign up a new admin ---
    public function signUpAdmin($request, $response) {
        $data = $request->getParsedBody();
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            return $this->jsonResponse($response, ['error' => 'Email and Password are required'], 400);
        }

        // The model now returns an array with the new ID and the token
        $result = $this->adminModel->createAdmin($email, $password); 
        
        if ($result === -1) {
             return $this->jsonResponse($response, ['error' => 'Email already registered.'], 409);
        }

        if ($result && isset($result['id']) && isset($result['token'])) {
            $newId = $result['id'];
            $token = $result['token'];
            
            // ❌ REMOVED: Immediate email to SUPERADMIN
            // ✔ ADDED: Send verification email to the new user
            try {
                // Render email template with the verification link
                // Assumes a template named 'email_verification' exists
                $verificationLink = $_ENV['FRONTEND_URL'] . "/api/admins/verify?token=" . $token;
                
                $body = $this->emailService->renderTemplate('email_verification', [
                    'verification_link' => $verificationLink,
                    'email' => $email,
                ]);

                $this->emailService->sendEmail(
                    $email, // Send to the new user
                    "Verify your DerrumbeNet email address",
                    $body
                );
            } catch (\Exception $e) {
                error_log("Verification Email Error: " . $e->getMessage());
                // We proceed, but logging the failure
            }

            // Return success message instructing user to check email
            return $this->jsonResponse($response, [
                'message' => 'Account created. Please check your email to verify your address.', 
                'id' => $newId
            ], 201);
        }

        return $this->jsonResponse($response, ['error' => 'Failed to create admin'], 500);
    }

    private function renderHtmlResponse($response, $title, $message, $isSuccess = true, $status = 200) {
        $color = $isSuccess ? '#28a745' : '#dc3545'; // Green or Red
        $icon = $isSuccess ? '&#10004;' : '&#10060;'; // Checkmark or X
        $homeLink = $_ENV['FRONTEND_URL'] . '/cms' ?? '#';

        $html = "
        <!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>{$title}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 450px; text-align: center; width: 90%; }
                .icon { font-size: 48px; color: {$color}; margin-bottom: 20px; }
                h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
                p { color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px; }
                .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; transition: background 0.2s; }
                .btn:hover { background-color: #0056b3; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='icon'>{$icon}</div>
                <h1>{$title}</h1>
                <p>{$message}</p>
                <a href='{$homeLink}' class='btn'>Go to Login</a>
            </div>
        </body>
        </html>";

        $response->getBody()->write($html);
        return $response
            ->withHeader('Content-Type', 'text/html')
            ->withStatus($status);
    }
    // --- NEW: Email Verification Route ---
    public function verifyEmail($request, $response) {
        $data = $request->getQueryParams();
        $token = $data['token'] ?? null;

        if (!$token) {
            return $this->renderHtmlResponse($response, 'Verification Failed', 'Missing verification token.', false, 400);
        }

        // 1. Look up admin by token
        $admin = $this->adminModel->getAdminByToken($token);

        if (!$admin) {
            return $this->renderHtmlResponse($response, 'Invalid Token', 'The verification link is invalid or has already been used.', false, 404);
        }

        // 2. Check Expiration
        $expiresAt = strtotime($admin['token_expires_at']);
        if (time() > $expiresAt) {
            return $this->renderHtmlResponse($response, 'Link Expired', 'This verification link has expired. Please request a new one.', false, 403);
        }

        // 3. Mark as verified and invalidate token (One-Time Use)
        $verified = $this->adminModel->verifyEmail($admin['admin_id']);

        if ($verified) {
            // 4. Send approval request email to Super Admin
            try {
                $body = $this->emailService->renderTemplate('new_admin', [
                    'email' => $admin['email'],
                    'cms_link' => $_ENV['FRONTEND_URL'] . "/cms"
                ]);

                $this->emailService->sendEmail(
                    $_ENV['SUPERADMIN_EMAIL'],
                    "New Admin Signup Request",
                    $body
                );
            } catch (\Exception $e) {
                error_log("Admin Approval Notification Error: " . $e->getMessage());
            }

            // SUCCESS RESPONSE IN HTML
            return $this->renderHtmlResponse(
                $response,
                'Email Verified!',
                'Your email has been successfully verified. Your account is now pending administrator approval. You will be notified once access is granted.',
                true,
                200
            );
        }

        return $this->renderHtmlResponse($response, 'Server Error', 'Verification failed due to an internal server error. Please try again later.', false, 500);
    }

    // --- MODIFIED: Log in an admin and return JWT ---
    public function loginAdmin($request, $response) {
        $data = $request->getParsedBody();
        $email = $data['email'];
        $password = $data['password'];

        if (!$email || !$password) {
            return $this->jsonResponse($response, ['error' => 'Email and password are required'], 400);
        }

        // The verifyCredentials method in the model is updated to check is_email_verified = 1 and isAuthorized = 1
        $admin = $this->adminModel->verifyCredentials($email, $password); 
        
        if (!$admin) {
            // Get the user by email to check specific status for a helpful error message
            $unauthorizedAdmin = $this->adminModel->getAdminByEmail($email); // Assume this method exists or create it
            
            if ($unauthorizedAdmin) {
                if ($unauthorizedAdmin['is_email_verified'] == 0) {
                     return $this->jsonResponse($response, ['error' => 'Please verify your email address first.'], 401);
                }
                if ($unauthorizedAdmin['isAuthorized'] == 0) {
                     return $this->jsonResponse($response, ['error' => 'Account created and verified. Waiting for admin approval.'], 401);
                }
            }
            
            return $this->jsonResponse($response, ['error' => 'Invalid email or password'], 401);
        }

        // JWT logic remains the same
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
