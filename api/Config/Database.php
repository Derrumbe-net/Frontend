<?php

namespace DerrumbeNet\Config;

use PDO;
use PDOException;
use Dotenv\Dotenv;

class Database {
    private static $conn = null;

    public static function getConnection() {
        if (self::$conn === null) {

            require_once __DIR__ . '/../vendor/autoload.php';

            $dotenv = Dotenv::createImmutable(__DIR__ . '/../../../'); // CHANGE BACK TO 2 (Glerys)
            $dotenv->safeLoad();

            $servername = $_ENV['DB_HOST'];
            $username   = $_ENV['DB_USER'];
            $password   = $_ENV['DB_PASSWORD'];
            $dbname     = $_ENV['DB_NAME'];

            // Build DSN for PDO
            $dsn = "mysql:host=$servername;dbname=$dbname;charset=utf8mb4";

            try {
                self::$conn = new PDO($dsn, $username, $password);
                self::$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                http_response_code(500);
                die(json_encode([
                    "error" => "DB connection failed: " . $e->getMessage()
                ]));
            }
        }

        return self::$conn;
    }
}

