<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;

class Report {
    private $conn;
    public function __construct($conn){ $this->conn = $conn; }

    // --- DATABASE METHODS (Unchanged) ---
    public function createReport(array $data)
{
    $sql = "INSERT INTO report (
                landslide_id, 
                reported_at, 
                description, 
                city, 
                image_url, 
                latitude, 
                longitude, 
                reporter_name, 
                reporter_phone, 
                reporter_email, 
                physical_address, 
                is_validated
            ) VALUES (
                :landslide_id, 
                :reported_at, 
                :description, 
                :city, 
                :image_url, 
                :latitude, 
                :longitude, 
                :reporter_name, 
                :reporter_phone, 
                :reporter_email, 
                :physical_address, 
                :is_validated
            )";

    try {
        $stmt = $this->conn->prepare($sql);

        $stmt->execute([
            ':landslide_id'     => $data['landslide_id'] ?? null,
            ':reported_at'      => $data['reported_at'] ?? date('Y-m-d H:i:s'),
            ':description'      => $data['description'] ?? '',
            ':city'             => $data['city'] ?? '',
            ':image_url'        => $data['image_url'] ?? '',
            ':latitude'         => $data['latitude'] ?? 0.0,
            ':longitude'        => $data['longitude'] ?? 0.0,
            ':reporter_name'    => $data['reporter_name'] ?? '',
            ':reporter_phone'   => $data['reporter_phone'] ?? '',
            ':reporter_email'   => $data['reporter_email'] ?? '',
            ':physical_address' => $data['physical_address'] ?? '',
            ':is_validated'     => $data['is_validated'] ?? 0
        ]);
        return $this->conn->lastInsertId();

    } catch (\PDOException $e) {
        error_log("Database Error in createReport: " . $e->getMessage());
        return false;
    }
}

    public function updateReportImage($id, $path) {
        try {
            $stmt = $this->conn->prepare("UPDATE report SET image_url = :path WHERE report_id = :id");
            $stmt->bindParam(':path', $path);
            $stmt->bindParam(':id', $id);
            return $stmt->execute();
        } catch(PDOException $e) { return false; }
    }

    public function updateReport($id, $data){
        try{
            // Note: I removed :image_url from the query because we handle images separately via FTP now
            // If you want to allow updating the folder name manually, keep it, otherwise remove it.
            $stmt = $this->conn->prepare(
                "UPDATE report SET 
             landslide_id=:landslide_id,
             reported_at=:reported_at,
             description=:description,
             city=:city,
             latitude=:latitude,
             longitude=:longitude,
             reporter_name=:reporter_name,
             reporter_phone=:reporter_phone,
             reporter_email=:reporter_email,
             physical_address=:physical_address,
             is_validated=:is_validated
             WHERE report_id=:id"
            );

            // Bind params
            $stmt->bindParam(':landslide_id', $data['landslide_id'], PDO::PARAM_INT);
            $stmt->bindParam(':reported_at', $data['reported_at']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':city', $data['city']);
            $stmt->bindParam(':latitude', $data['latitude']);
            $stmt->bindParam(':longitude', $data['longitude']);
            $stmt->bindParam(':reporter_name', $data['reporter_name']);
            $stmt->bindParam(':reporter_phone', $data['reporter_phone']);
            $stmt->bindParam(':reporter_email', $data['reporter_email']);
            $stmt->bindParam(':physical_address', $data['physical_address']);
            $stmt->bindParam(':is_validated', $data['is_validated'], PDO::PARAM_INT);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();
        } catch(PDOException $e){
            error_log($e->getMessage());
            return false;
        }
    }

    public function getReportById($id){
        $stmt = $this->conn->prepare("SELECT * FROM report WHERE report_id=:id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getAllReports(){
        $stmt = $this->conn->query("SELECT * FROM report");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function deleteReport($id){
        $stmt = $this->conn->prepare("DELETE FROM report WHERE report_id=:id");
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    // --- FTP METHODS ---

    private function getFtpConnection() {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_port   = $_ENV['FTPS_PORT'] ?? 21;

        $conn_id = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn_id || !@ftp_login($conn_id, $_ENV['FTPS_USER'], $_ENV['FTPS_PASS'])) {
            throw new \Exception("Could not connect to FTP");
        }
        ftp_pasv($conn_id, true);
        return $conn_id;
    }

    public function uploadTextFile($fileName, $content, $folder = null) {
        $conn_id = null;
        try {
            $conn_id = $this->getFtpConnection();

            // Navigate to Base Path
            // Note: Ensuring we use the REPORTS base path
            $base = $_ENV['FTPS_BASE_PATH_REPORTS'] ?? 'files/landslides/';
            $basePath = rtrim($base, '/') . '/';

            if (!@ftp_chdir($conn_id, $basePath)) {
                // Try creating base path if it doesn't exist? Or fail.
                return false;
            }

            // Handle Subfolder
            if ($folder) {
                if (!@ftp_chdir($conn_id, $folder)) {
                    if (ftp_mkdir($conn_id, $folder)) {
                        ftp_chdir($conn_id, $folder);
                    } else {
                        return false;
                    }
                }
            }

            $tmpFile = tmpfile();
            fwrite($tmpFile, $content);
            rewind($tmpFile);

            $result = @ftp_fput($conn_id, $fileName, $tmpFile, FTP_BINARY);
            fclose($tmpFile);

            if ($result) {
                return $basePath . ($folder ? $folder . '/' : '') . $fileName;
            }
            return false;

        } catch (\Exception $e) {
            error_log("FTPS Error: " . $e->getMessage());
            return false;
        } finally {
            if ($conn_id) ftp_close($conn_id);
        }
    }

    public function getReportImageList($folderName) {
        $conn_id = $this->getFtpConnection();
        $list = [];

        try {
            $base = $_ENV['FTPS_BASE_PATH_REPORTS'] ?? 'files/landslides/';
            $basePath = rtrim($base, '/') . '/';
            $targetPath = $basePath . $folderName;

            // Try to navigate
            if (!@ftp_chdir($conn_id, $targetPath)) {
                return []; // Folder doesn't exist yet
            }

            $files = ftp_nlist($conn_id, "."); // List current directory

            if (is_array($files)) {
                foreach ($files as $file) {
                    $name = basename($file);
                    // Filter logic matching Landslide (and webp)
                    if ($name == '.' || $name == '..') continue;
                    if (preg_match('/\.(jpg|jpeg|png|webp|gif)$/i', $name)) {
                        $list[] = $name;
                    }
                }
            }
            sort($list);
        } catch (\Exception $e) {
            error_log($e->getMessage());
        } finally {
            ftp_close($conn_id);
        }

        return $list;
    }

    public function getReportImageContent($folderName, $fileName) {
        $conn_id = $this->getFtpConnection();

        try {
            $base = $_ENV['FTPS_BASE_PATH_REPORTS'] ?? 'files/landslides/';
            $basePath = rtrim($base, '/') . '/';

            // Construct full path manually to ensure accuracy
            $fullPath = $basePath . $folderName . '/' . $fileName;

            $tmpFile = tmpfile();

            if (!@ftp_fget($conn_id, $tmpFile, $fullPath, FTP_BINARY)) {
                // Try navigating if full path failed (sometimes FTP servers are picky)
                if (@ftp_chdir($conn_id, $basePath . $folderName)) {
                    if (!@ftp_fget($conn_id, $tmpFile, $fileName, FTP_BINARY)) {
                        throw new \Exception("FTP download failed for $fileName");
                    }
                } else {
                    throw new \Exception("FTP path not found: $fullPath");
                }
            }

            rewind($tmpFile);
            $content = stream_get_contents($tmpFile);
            fclose($tmpFile);

            return $content;

        } catch (\Exception $e) {
            error_log($e->getMessage());
            return null;
        } finally {
            ftp_close($conn_id);
        }
    }
}