<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;

class Report {
    private $conn;
    public function __construct($conn){ $this->conn = $conn; }
    
    // --- DATABASE METHODS ---

    // Create Report 
    public function createReport($data){
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO report
                (landslide_id, reported_at, description, city, image_url, latitude, longitude,
                 reporter_name, reporter_phone, reporter_email, physical_address,
                 is_validated)
                VALUES
                (:landslide_id, :reported_at, :description, :city, :image_url, :latitude, :longitude,
                 :reporter_name, :reporter_phone, :reporter_email, :physical_address,
                 0)"
            );

            $stmt->bindParam(':landslide_id', $data['landslide_id'], PDO::PARAM_INT);
            $stmt->bindParam(':reported_at', $data['reported_at'], PDO::PARAM_STR);
            $stmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
            $stmt->bindParam(':city', $data['city'], PDO::PARAM_STR);
            $stmt->bindParam(':image_url', $data['image_url'], PDO::PARAM_STR);
            $stmt->bindParam(':latitude', $data['latitude'], PDO::PARAM_STR);
            $stmt->bindParam(':longitude', $data['longitude'], PDO::PARAM_STR);
            $stmt->bindParam(':reporter_name', $data['reporter_name'], PDO::PARAM_STR);
            $stmt->bindParam(':reporter_phone', $data['reporter_phone'], PDO::PARAM_STR);
            $stmt->bindParam(':reporter_email', $data['reporter_email'], PDO::PARAM_STR);
            $stmt->bindParam(':physical_address', $data['physical_address'], PDO::PARAM_STR);

            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;

        } catch(PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }
    // Helper to update Image URL
    public function updateReportImage($id, $path) {
        try {
            $stmt = $this->conn->prepare("UPDATE report SET image_url = :path WHERE report_id = :id");
            $stmt->bindParam(':path', $path, PDO::PARAM_STR);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch(PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

        // UPDATE REPORT BY ID
        public function updateReport($id,$data){
            try{
                $stmt = $this->conn->prepare(
                    "UPDATE report SET landslide_id=:landslide_id,reported_at=:reported_at,description=:description,
                     city=:city,image_url=:image_url,latitude=:latitude,longitude=:longitude,
                     reporter_name=:reporter_name,reporter_phone=:reporter_phone,reporter_email=:reporter_email,
                     physical_address=:physical_address WHERE report_id=:id"
                );
                $stmt->bindParam(':landslide_id', $data['landslide_id'], PDO::PARAM_INT);
                $stmt->bindParam(':reported_at', $data['reported_at'], PDO::PARAM_STR);
                $stmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
                $stmt->bindParam(':city', $data['city'], PDO::PARAM_STR);
                $stmt->bindParam(':image_url', $data['image_url'], PDO::PARAM_STR);
                $stmt->bindParam(':latitude', $data['latitude'], PDO::PARAM_STR);
                $stmt->bindParam(':longitude', $data['longitude'], PDO::PARAM_STR);
                $stmt->bindParam(':reporter_name', $data['reporter_name'], PDO::PARAM_STR);
                $stmt->bindParam(':reporter_phone', $data['reporter_phone'], PDO::PARAM_STR);
                $stmt->bindParam(':reporter_email', $data['reporter_email'], PDO::PARAM_STR);
                $stmt->bindParam(':physical_address', $data['physical_address'], PDO::PARAM_STR);
                $stmt->bindParam(':id', $id, PDO::PARAM_INT);
                return $stmt->execute();
            }catch(PDOException $e){ error_log($e->getMessage()); return false; }
        }
    
    // Standard Getters
    public function getReportById($id){
        $stmt = $this->conn->prepare("SELECT * FROM report WHERE report_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function getAllReports(){
        $stmt = $this->conn->query("SELECT * FROM report");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

        // DELETE REPORT BY ID
        public function deleteReport($id){
            $stmt = $this->conn->prepare("DELETE FROM report WHERE report_id=:id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        }
    
    // --- FTP METHODS ---

    public function uploadTextFile($fileName, $content, $folder = null) {
        $conn_id = false;
        try {
            $ftp_server = $_ENV['FTPS_SERVER'];
            $ftp_port   = $_ENV['FTPS_PORT'] ?? 21;
            
            $conn_id = ftp_ssl_connect($ftp_server, $ftp_port, 10);
            if (!$conn_id || !@ftp_login($conn_id, $_ENV['FTPS_USER'], $_ENV['FTPS_PASS'])) {
                 return false; 
            }
            ftp_pasv($conn_id, true);

            // Navigate to Base Path
            // Example Base: files/landslides/
            $base = $_ENV['FTPS_BASE_PATH_REPORTS'] ?? 'files/landslides/';
            $basePath = rtrim($base, '/') . '/'; 
            
            if (!@ftp_chdir($conn_id, $basePath)) {
                return false;
            }

            // Handle Subfolder: {date}_{id}
            if ($folder) {
                if (!@ftp_chdir($conn_id, $folder)) {
                    // Create if missing
                    if (ftp_mkdir($conn_id, $folder)) {
                        // Enter it
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
                // Format: files/landslides/{FOLDER}/{FILENAME}
                $finalPath = $basePath . ($folder ? $folder . '/' : '') . $fileName;
                return $finalPath;
            }
            return false;

        } catch (\Exception $e) {
            error_log("FTPS Error: " . $e->getMessage());
            return false;
        } finally {
            if ($conn_id) ftp_close($conn_id);
        }
    }

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

public function getReportImageList($folderName) {
    $conn_id = $this->getFtpConnection();
    $list = [];

    try {
        $base = $_ENV['FTPS_BASE_PATH_REPORTS'] ?? 'files/landslides/';
        $basePath = rtrim($base, '/') . '/';
        $targetPath = $basePath . $folderName;

        $files = ftp_nlist($conn_id, $targetPath);

        if (is_array($files)) {
            foreach ($files as $file) {
                $name = basename($file);
                if (preg_match('/\.(jpg|jpeg|png)$/i', $name)) {
                    $list[] = $name;
                }
            }
        }
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
        $fullPath = $basePath . $folderName . '/' . $fileName;

        $tmpFile = tmpfile();

        if (!@ftp_fget($conn_id, $tmpFile, $fullPath, FTP_BINARY)) {
            throw new \Exception("FTP download failed for $fileName");
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

public function getReportImagesBase64($id) {
    $stmt = $this->conn->prepare("SELECT image_url FROM report WHERE report_id = :id");
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    $report = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$report || empty($report['image_url'])) {
        return [];
    }

    $folderName = $report['image_url'];
    $conn_id = $this->getFtpConnection(); // Use the helper from previous step
    $imageData = [];

    try {
        $base = $_ENV['FTPS_BASE_PATH_REPORTS'] ?? 'files/landslides/';
        $basePath = rtrim($base, '/') . '/';
        $targetPath = $basePath . $folderName;

        $files = ftp_nlist($conn_id, $targetPath);
        if (!$files) return [];

        foreach ($files as $file) {
            $name = basename($file);
            
            // Filter specific image extensions
            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png'])) continue;

            $tmpFile = tmpfile();
            if (@ftp_fget($conn_id, $tmpFile, $file, FTP_BINARY)) {
                rewind($tmpFile);
                $content = stream_get_contents($tmpFile);
                fclose($tmpFile);

                $base64 = base64_encode($content);
                $mime = ($ext === 'png') ? 'image/png' : 'image/jpeg';
                
                // Add to result array
                $imageData[] = [
                    'filename' => $name,
                    'src' => "data:$mime;base64,$base64" // Ready for React <img src="" />
                ];
            }
        }

    } catch (\Exception $e) {
        error_log("FTP Batch Error: " . $e->getMessage());
    } finally {
        ftp_close($conn_id);
    }

    return $imageData;
}
}