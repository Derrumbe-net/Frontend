<?php

namespace DerrumbeNet\Model;
use PDOException; // Added for explicit error handling
use PDO;
use PDOStatement;

use DerrumbeNet\Config\Database;

class Admin {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn; // PDO connection
    }

    // --- NEW HELPER: Generate a secure, unique token ---
    private function generateToken($length = 64) {
        return bin2hex(random_bytes($length / 2));
    }

    // --- MODIFIED: CREATE ADMIN (Sign Up) ---
    // Now creates the user with a verification token and sets is_email_verified to 0
    public function createAdmin($email, $password) {
        try {
            // Check if admin already exists
            $stmt = $this->conn->prepare("SELECT admin_id FROM admin WHERE email = :email");
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->execute();
            if ($stmt->fetch()) {
                // Email already exists
                return -1; 
            }

            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $token = $this->generateToken();
            // Token valid for 24 hours
            $expires = date('Y-m-d H:i:s', time() + (24 * 3600)); 

            // INSERT statement updated to include new columns: is_email_verified, verification_token, token_expires_at
            $sql = "INSERT INTO admin (email, password, is_email_verified, verification_token, token_expires_at) 
                    VALUES (:email, :password, 0, :token, :expires)";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
            $stmt->bindParam(':token', $token, PDO::PARAM_STR);
            $stmt->bindParam(':expires', $expires, PDO::PARAM_STR);

            if ($stmt->execute()) {
                return ['id' => $this->conn->lastInsertId(), 'token' => $token]; // Return ID AND token
            }
            return false;
        } catch (PDOException $e) {
            error_log("Create Admin Error: " . $e->getMessage());
            return false;
        }
    }

    // --- NEW: Find admin by Verification Token ---
    public function getAdminByToken($token) {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM admin WHERE verification_token = :token");
            $stmt->bindParam(':token', $token, PDO::PARAM_STR);
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get Admin by Token Error: " . $e->getMessage());
            return false;
        }
    }

    public function getAdminByEmail($email) {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM admin WHERE email = :email");
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get Admin by Email Error: " . $e->getMessage());
            return false;
        }
    }

    // --- NEW: Mark email as verified and invalidate token ---
    public function verifyEmail($id) {
        try {
            // Set verified flag, and clear the token/expiry to enforce one-time use
            $sql = "UPDATE admin 
                    SET is_email_verified = 1, verification_token = NULL, token_expires_at = NULL 
                    WHERE admin_id = :id";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Verify Email Error: " . $e->getMessage());
            return false;
        }
    }

    // READ BY ID
    public function getAdminById($id) {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM admin WHERE admin_id = :admin_id");
            $stmt->bindParam(':admin_id', $id, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get Admin by ID Error: " . $e->getMessage());
            return false;
        }
    }

    // READ ALL
    public function getAllAdmins() {
        try {
            $stmt = $this->conn->query("SELECT * FROM admin");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get All Admins Error: " . $e->getMessage());
            return [];
        }
    }

    // GET EMAIL BY ID
    public function getEmailById($id) {
        try {
            $stmt = $this->conn->prepare("SELECT email FROM admin WHERE admin_id = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get Email by ID Error: " . $e->getMessage());
            return false;
        }
    }

    // GET PASSWORD BY ID
    public function getPasswordById($id) {
        try {
            $stmt = $this->conn->prepare("SELECT password FROM admin WHERE admin_id = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get Password by ID Error: " . $e->getMessage());
            return false;
        }
    }

    // UPDATE ADMIN AUTHORIZATION
    public function updateAuthorization($id, $isAuthorized) {
        try {
            $stmt = $this->conn->prepare("UPDATE admin SET isAuthorized = :isAuthorized WHERE admin_id = :id");
            $stmt->bindParam(':isAuthorized', $isAuthorized, PDO::PARAM_BOOL);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Update Authorization Error: " . $e->getMessage());
            return false;
        }
    }
    
    // UPDATE EMAIL
    public function updateEmail($id, $email) {
        try {
            $stmt = $this->conn->prepare("UPDATE admin SET email = :email WHERE admin_id = :id");
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Update Email Error: " . $e->getMessage());
            return false;
        }
    }

    // UPDATE PASSWORD
    public function updatePassword($id, $password) {
        try {
            // Hash password before storing for security
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            $stmt = $this->conn->prepare("UPDATE admin SET password = :password WHERE admin_id = :id");
            $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Update Password Error: " . $e->getMessage());
            return false;
        }
    }

    // DELETE BY ID
    public function deleteAdminById($id) {
        try {
            $stmt = $this->conn->prepare("DELETE FROM admin WHERE admin_id = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Delete Admin by ID Error: " . $e->getMessage());
            return false;
        }
    }

    // CREATE
    public function signUpAdmin($email, $password) {
        try {
            // Hash password before storing for security
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            $stmt = $this->conn->prepare("INSERT INTO admin (email, password) VALUES (:email, :password)");
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);

            if ($stmt->execute()) {
                return $this->conn->lastInsertId(); // Return new admin ID
            }
            return false;
        } catch (PDOException $e) {
            error_log("Create Admin Error: " . $e->getMessage());
            return false;
        }
    }

    // LOGIN: Verify admin credentials
    public function verifyCredentials($email, $password) {
        try {
            // Updated to check for both is_email_verified AND isAuthorized
            $stmt = $this->conn->prepare("SELECT * FROM admin WHERE email = :email AND is_email_verified = 1 AND isAuthorized = 1");
            $stmt->bindParam(':email', $email, PDO::PARAM_STR);
            $stmt->execute();
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($admin && password_verify($password, $admin['password'])) {
                // Password matches
                return $admin;
            }
            return false;
        } catch (PDOException $e) {
            error_log("Verify Credentials Error: " . $e->getMessage());
            return false;
        }
    }
}
