<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOStatement;

use DerrumbeNet\Config\Database;

class Admin {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn; // PDO connection
    }

    // CREATE
    public function createAdmin($email, $password) {
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
            $stmt = $this->conn->prepare("SELECT * FROM admin WHERE email = :email");
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
