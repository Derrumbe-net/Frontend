<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;

class OfficeInfo
{
    private $conn;
    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    /** Always returns the single row (id = 1). */
    public function get()
    {
        try {
            $stmt = $this->conn->query("SELECT * FROM office_info WHERE id = 1 LIMIT 1");
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return null;
        }
    }

    /** Upsert — always updates row id = 1. */
    public function update($data)
    {
        try {
            $allowed = ['email', 'phone', 'phone_ext', 'office_location', 'facebook_url'];
            $setClauses = [];
            $params = [];

            foreach ($allowed as $col) {
                if (array_key_exists($col, $data)) {
                    $setClauses[] = "$col = :$col";
                    $params[":$col"] = $data[$col];
                }
            }
            if (empty($setClauses)) return true;

            $sql = "UPDATE office_info SET " . implode(', ', $setClauses) . " WHERE id = 1";
            $stmt = $this->conn->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }
}
