<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;
use Exception;

class FundingSource
{
    private $conn;
    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    // CREATE
    public function createFundingSource($data)
    {
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO funding_source (name, website_url, image_url, display_order)
                 VALUES (:name, :website_url, :image_url, :display_order)"
            );
            $name          = $data['name'];
            $website_url   = $data['website_url']   ?? null;
            $image_url     = $data['image_url']     ?? null;
            $display_order = (int) ($data['display_order'] ?? 0);

            $stmt->bindParam(':name',          $name,          PDO::PARAM_STR);
            $stmt->bindParam(':website_url',   $website_url,   PDO::PARAM_STR);
            $stmt->bindParam(':image_url',     $image_url,     PDO::PARAM_STR);
            $stmt->bindParam(':display_order', $display_order, PDO::PARAM_INT);

            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    // GET ALL
    public function getAllFundingSources()
    {
        $stmt = $this->conn->query(
            "SELECT * FROM funding_source ORDER BY display_order ASC, funding_id ASC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET BY ID
    public function getFundingSourceById($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM funding_source WHERE funding_id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // UPDATE
    public function updateFundingSource($id, $data)
    {
        try {
            $allowed = ['name', 'website_url', 'image_url', 'display_order'];
            $setClauses = [];
            $params = [':id' => $id];

            foreach ($allowed as $col) {
                if (array_key_exists($col, $data)) {
                    $setClauses[] = "$col = :$col";
                    $params[":$col"] = $data[$col];
                }
            }
            if (empty($setClauses)) return true;

            $sql = "UPDATE funding_source SET " . implode(', ', $setClauses) . " WHERE funding_id = :id";
            $stmt = $this->conn->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    // UPDATE image_url only
    public function updateFundingSourceImageColumn($id, $filename)
    {
        try {
            $stmt = $this->conn->prepare(
                "UPDATE funding_source SET image_url = :image_url WHERE funding_id = :id"
            );
            $stmt->bindParam(':image_url', $filename, PDO::PARAM_STR);
            $stmt->bindParam(':id',        $id,       PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    // DELETE
    public function deleteFundingSource($id)
    {
        $stmt = $this->conn->prepare("DELETE FROM funding_source WHERE funding_id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    // ---- FTP helpers ----

    public function uploadImageToFtp($localFilePath, $remoteFileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user   = $_ENV['FTPS_USER'];
        $ftp_pass   = $_ENV['FTPS_PASS'];
        $ftp_port   = $_ENV['FTPS_PORT'];

        $base   = rtrim($_ENV['FTPS_BASE_PATH'] ?? 'files/', '/');
        $target = $base . '/funding/';
        $remote = $target . $remoteFileName;

        $conn = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn) throw new Exception("Failed to connect to FTPS server");
        if (!@ftp_login($conn, $ftp_user, $ftp_pass)) {
            ftp_close($conn);
            throw new Exception("FTPS login failed");
        }
        ftp_pasv($conn, true);
        if (!ftp_put($conn, $remote, $localFilePath, FTP_BINARY)) {
            ftp_close($conn);
            throw new Exception("Unable to upload image to: $remote");
        }
        ftp_close($conn);
        return $remoteFileName;
    }

    public function getFundingSourceImageContent($fileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user   = $_ENV['FTPS_USER'];
        $ftp_pass   = $_ENV['FTPS_PASS'];
        $ftp_port   = $_ENV['FTPS_PORT'];

        $base   = rtrim($_ENV['FTPS_BASE_PATH'] ?? 'files/', '/');
        $remote = $base . '/funding/' . ltrim($fileName, '/');

        $conn = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn) throw new Exception("Failed to connect to FTPS server");
        if (!@ftp_login($conn, $ftp_user, $ftp_pass)) {
            ftp_close($conn);
            throw new Exception("FTPS login failed");
        }
        ftp_pasv($conn, true);

        $tmp = tmpfile();
        if (!@ftp_fget($conn, $tmp, $remote, FTP_BINARY)) {
            fclose($tmp);
            ftp_close($conn);
            throw new Exception("Unable to download image: $remote");
        }
        rewind($tmp);
        $content = stream_get_contents($tmp);
        fclose($tmp);
        ftp_close($conn);
        return $content;
    }
}
