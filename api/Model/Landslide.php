<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;

class Landslide {
    private $conn;

    public function __construct($conn) { $this->conn = $conn; }

    // CREATE LANDSLIDE
    public function createLandslide($data) {
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO landslide (admin_id, landslide_date, latitude, longitude) 
                 VALUES (:admin_id, :landslide_date, :latitude, :longitude)"
            );

            $stmt->bindParam(':admin_id', $data['admin_id'], PDO::PARAM_INT);
            $stmt->bindParam(':landslide_date', $data['landslide_date'], PDO::PARAM_STR);
            $stmt->bindParam(':latitude', $data['latitude'], PDO::PARAM_STR);
            $stmt->bindParam(':longitude', $data['longitude'], PDO::PARAM_STR);

            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;

        } catch(PDOException $e){ error_log($e->getMessage()); return false; }
    }
    
    // GET LANSLIDE BY ID
    public function getLandslideById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM landslide WHERE landslide_id = :id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET ALL LANDSLIDES
    public function getAllLandslides() {
        $stmt = $this->conn->query("SELECT * FROM landslide");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // UPDATE LANDSLIDE BY ID
    public function updateLandslide($id, $data) {
        try {
            $stmt = $this->conn->prepare(
                "UPDATE landslide SET admin_id=:admin_id, landslide_date=:landslide_date,
                 latitude=:latitude, longitude=:longitude WHERE landslide_id=:id"
            );

            $stmt->bindParam(':admin_id', $data['admin_id'], PDO::PARAM_INT);
            $stmt->bindParam(':landslide_date', $data['landslide_date'], PDO::PARAM_STR);
            $stmt->bindParam(':latitude', $data['latitude'], PDO::PARAM_STR);
            $stmt->bindParam(':longitude', $data['longitude'], PDO::PARAM_STR);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) { error_log($e->getMessage()); return false; }
    }
    
    // DELETE LANSLIDE BY ID
    public function deleteLandslide($id) {
        try {
            $stmt = $this->conn->prepare("DELETE FROM landslide WHERE landslide_id=:id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) { error_log($e->getMessage()); return false; }
    }

    private function getFtpConnection() {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user   = $_ENV['FTPS_USER'];
        $ftp_pass   = $_ENV['FTPS_PASS'];
        $ftp_port   = $_ENV['FTPS_PORT'];

        $conn_id = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn_id) throw new Exception("Failed to connect to FTPS server");

        if (!@ftp_login($conn_id, $ftp_user, $ftp_pass)) {
            ftp_close($conn_id);
            throw new Exception("FTPS login failed");
        }

        ftp_pasv($conn_id, true);
        return $conn_id;
    }

    private function navigateToFolder($conn_id, $folderName) {
        $base = $_ENV['FTPS_BASE_PATH'] ?? 'files/';
        $basePath = rtrim($base, '/') . '/landslides/';

        $path1 = $basePath . $folderName;

        if (@ftp_chdir($conn_id, $path1)) {
            return true;
        }

        $folderNameUnderscore = preg_replace('/-(?=[^-]*$)/', '_', $folderName);
        $path2 = $basePath . $folderNameUnderscore;

        if (@ftp_chdir($conn_id, $path2)) {
            return true;
        }

        return false;
    }

    public function getLandslideImagesList($folderName) {
        $conn_id = $this->getFtpConnection();

        if (!$this->navigateToFolder($conn_id, $folderName)) {
            error_log("FTPS: Could not find folder for '$folderName' (checked hyphen and underscore variants)");
            ftp_close($conn_id);
            return [];
        }

        $files = ftp_nlist($conn_id, ".");

        ftp_close($conn_id);

        if ($files === false) return [];

        $images = [];
        foreach ($files as $file) {
            $fileName = basename($file);

            if ($fileName == '.' || $fileName == '..') continue;

            if (preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $fileName)) {
                $images[] = $fileName;
            }
        }

        sort($images);
        return $images;
    }

    public function getLandslideImageContent($folderName, $fileName) {
        $conn_id = $this->getFtpConnection();

        if (!$this->navigateToFolder($conn_id, $folderName)) {
            ftp_close($conn_id);
            throw new Exception("Folder not found: $folderName");
        }

        $tmpFile = tmpfile();

        if (!@ftp_fget($conn_id, $tmpFile, $fileName, FTP_BINARY)) {
            fclose($tmpFile);
            ftp_close($conn_id);
            throw new Exception("Unable to download image: $fileName");
        }

        rewind($tmpFile);
        $content = stream_get_contents($tmpFile);

        fclose($tmpFile);
        ftp_close($conn_id);

        return $content;
    }
}