<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;

class Publication {
    private $conn;
    public function __construct($conn) { $this->conn = $conn; }

    // CREATE PUBLICATION
    public function createPublication($data) {
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO publication (admin_id, title, publication_url, image_url, description)
                 VALUES (:admin_id, :title, :publication_url, :image_url, :description)"
            );
            $stmt->bindParam(':admin_id', $data['admin_id'], PDO::PARAM_INT);
            $stmt->bindParam(':title', $data['title'], PDO::PARAM_STR);
            $stmt->bindParam(':publication_url', $data['publication_url'], PDO::PARAM_STR);
            $stmt->bindParam(':image_url', $data['image_url'], PDO::PARAM_STR);
            $stmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
            // $stmt->execute();

            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            } else {
                return false;
            }
        } catch(PDOException $e) { error_log($e->getMessage()); return false; }
    }
    
    // GET PUBLICATION BY ID
    public function getPublicationById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM publication WHERE publication_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // GET ALL PUBLICATIONS
    public function getAllPublications() {
        $stmt = $this->conn->query("SELECT * FROM publication");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET ALL PUBLICATIONS SORTED BY OLDEST FIRST
    public function getAllPublicationsByOldest() {
        $stmt = $this->conn->query("SELECT * FROM publication ORDER BY created_at ASC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET ALL PUBLICATIONS SORTED BY LATEST FIRST
    public function getAllPublicationsByLatest() {
        $stmt = $this->conn->query("SELECT * FROM publication ORDER BY created_at DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // UPDATE PUBLICATION
    public function updatePublication($id, $data) {
        try {
            $stmt = $this->conn->prepare(
                "UPDATE publication SET admin_id=:admin_id, title=:title, publication_url=:publication_url,
                 image_url=:image_url, description=:description WHERE publication_id=:id"
            );
            $stmt->bindParam(':admin_id', $data['admin_id'], PDO::PARAM_INT);
            $stmt->bindParam(':title', $data['title'], PDO::PARAM_STR);
            $stmt->bindParam(':publication_url', $data['publication_url'], PDO::PARAM_STR);
            $stmt->bindParam(':image_url', $data['image_url'], PDO::PARAM_STR);
            $stmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch(PDOException $e) { error_log($e->getMessage()); return false; }
    }
    
    // DELETE PUBLICATION BY ID
    public function deletePublication($id) {
        $stmt = $this->conn->prepare("DELETE FROM publication WHERE publication_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    // Update just the image_url column
    public function updatePublicationImageColumn($id, $filename) {
        try {
            $stmt = $this->conn->prepare("UPDATE publication SET image_url=:image_url WHERE publication_id=:id");
            $stmt->bindParam(':image_url', $filename, PDO::PARAM_STR);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch(PDOException $e) { error_log($e->getMessage()); return false; }
    }

    // Upload local file to FTP
    public function uploadImageToFtp($localFilePath, $remoteFileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user = $_ENV['FTPS_USER'];
        $ftp_pass = $_ENV['FTPS_PASS'];
        $ftp_port = $_ENV['FTPS_PORT'];

        // Define specific folder for publications
        $base_remote_path = $_ENV['FTPS_BASE_PATH'] ?? 'files/';
        $target_dir = rtrim($base_remote_path, '/') . '/publications/';
        $remote_file_path = $target_dir . $remoteFileName;

        $conn_id = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn_id) throw new Exception("Failed to connect to FTPS server");

        if (!@ftp_login($conn_id, $ftp_user, $ftp_pass)) {
            ftp_close($conn_id);
            throw new Exception("FTPS login failed");
        }

        ftp_pasv($conn_id, true);

        if (!ftp_put($conn_id, $remote_file_path, $localFilePath, FTP_BINARY)) {
            ftp_close($conn_id);
            throw new Exception("Unable to upload image to: $remote_file_path");
        }

        ftp_close($conn_id);
        return $remoteFileName; // Return just the name or relative path
    }

    // Get content to serve
    public function getPublicationImageContent($fileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user = $_ENV['FTPS_USER'];
        $ftp_pass = $_ENV['FTPS_PASS'];
        $ftp_port = $_ENV['FTPS_PORT'];

        $base_remote_path = $_ENV['FTPS_BASE_PATH'] ?? 'files/';
        $remote_file_path = rtrim($base_remote_path, '/') . '/publications/' . ltrim($fileName, '/');

        $conn_id = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn_id) throw new Exception("Failed to connect to FTPS server");

        if (!@ftp_login($conn_id, $ftp_user, $ftp_pass)) {
            ftp_close($conn_id);
            throw new Exception("FTPS login failed");
        }

        ftp_pasv($conn_id, true);

        $tmpFile = tmpfile();

        if (!@ftp_fget($conn_id, $tmpFile, $remote_file_path, FTP_BINARY)) {
            fclose($tmpFile);
            ftp_close($conn_id);
            throw new Exception("Unable to download image: $remote_file_path");
        }

        rewind($tmpFile);
        $content = stream_get_contents($tmpFile);

        fclose($tmpFile);
        ftp_close($conn_id);

        return $content;
    }
}
