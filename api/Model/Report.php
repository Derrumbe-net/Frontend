<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;

class Report {
    private $conn;
    public function __construct($conn){ $this->conn = $conn; }

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
    
            $params = [
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
            ];
    
            $stmt->execute($params);
    
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
            $stmt = $this->conn->prepare(
                "UPDATE report SET 
                landslide_id = :landslide_id,
                reported_at = :reported_at,
                description = :description,
                city = :city,
                latitude = :latitude,
                longitude = :longitude,
                reporter_name = :reporter_name,
                reporter_phone = :reporter_phone,
                reporter_email = :reporter_email,
                physical_address = :physical_address,
                is_validated = :is_validated
            WHERE report_id = :id"
            );

            $stmt->bindValue(':landslide_id', $data['landslide_id'] ?? null, PDO::PARAM_INT);
            $stmt->bindValue(':reported_at', $data['reported_at'] ?? null);
            $stmt->bindValue(':description', $data['description'] ?? '');
            $stmt->bindValue(':city', $data['city'] ?? '');
            $stmt->bindValue(':latitude', $data['latitude'] ?? null);
            $stmt->bindValue(':longitude', $data['longitude'] ?? null);
            $stmt->bindValue(':reporter_name', $data['reporter_name'] ?? '');
            $stmt->bindValue(':reporter_phone', $data['reporter_phone'] ?? '');
            $stmt->bindValue(':reporter_email', $data['reporter_email'] ?? '');
            $stmt->bindValue(':physical_address', $data['physical_address'] ?? '');
            $stmt->bindValue(':is_validated', $data['is_validated'] ?? 0, PDO::PARAM_INT);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();

        } catch(PDOException $e){
            error_log("Database Update Error: " . $e->getMessage());
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

    public function deleteImageFile($folderName, $fileName) {
        $conn_id = $this->getFtpConnection();

        try {
            $base = $_ENV['FTPS_BASE_PATH_REPORTS'] ?? 'files/landslides/';
            $basePath = rtrim($base, '/') . '/';

            // Full path to the specific file
            $fullPath = $basePath . $folderName . '/' . $fileName;

            // Attempt deletion
            if (@ftp_delete($conn_id, $fullPath)) {
                return true;
            }

            // Optional: Check if we need to navigate first (some servers are strict)
            if (@ftp_chdir($conn_id, $basePath . $folderName)) {
                if (@ftp_delete($conn_id, $fileName)) {
                    return true;
                }
            }

            return false;

        } catch (\Exception $e) {
            error_log("FTP Delete Error: " . $e->getMessage());
            return false;
        } finally {
            if ($conn_id) ftp_close($conn_id);
        }
    }
}
