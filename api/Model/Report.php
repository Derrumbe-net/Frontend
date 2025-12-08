<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;

class Report {
    private $conn;
    public function __construct($conn){ $this->conn = $conn; }
    
    // --- DATABASE METHODS (Unchanged) ---

    // CREATE REPORT
    public function createReport($data){
        try{
            $stmt = $this->conn->prepare(
                "INSERT INTO report
                (landslide_id, reported_at, description, city, image_url, latitude, longitude,
                 reporter_name, reporter_phone, reporter_email, physical_address)
                 VALUES
                (:landslide_id, :reported_at, :description, :city, :image_url, :latitude, :longitude,
                 :reporter_name, :reporter_phone, :reporter_email, :physical_address)"
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
            } else {
                return false;
            }
        }catch(PDOException $e){ error_log($e->getMessage()); return false; }
    }
    
    // GET REPORT BY ID
    public function getReportById($id){
        $stmt = $this->conn->prepare("SELECT * FROM report WHERE report_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // GET ALL REPORTS
    public function getAllReports(){
        $stmt = $this->conn->query("SELECT * FROM report");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
    
    // DELETE REPORT BY ID
    public function deleteReport($id){
        $stmt = $this->conn->prepare("DELETE FROM report WHERE report_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    // --- FTP METHODS ---

    /**
     * Establishes a secure FTPS connection.
     */
    private function getFtpConnection() {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user   = $_ENV['FTPS_USER'];
        $ftp_pass   = $_ENV['FTPS_PASS'];
        $ftp_port   = $_ENV['FTPS_PORT'] ?? 21; 

        $conn_id = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn_id) throw new \Exception("Failed to connect to FTPS server");

        if (!@ftp_login($conn_id, $ftp_user, $ftp_pass)) {
            ftp_close($conn_id);
            throw new \Exception("FTPS login failed");
        }

        ftp_pasv($conn_id, true);
        return $conn_id;
    }

    /**
     * Navigates to the base reports folder.
     */
    private function navigateToFolder($conn_id) {
        $base = $_ENV['FTPS_BASE_PATH_REPORTS'] ?? 'files/reports/images/';
        $basePath = rtrim($base, '/') . '/'; 

        if (@ftp_chdir($conn_id, $basePath)) {
            return true;
        }
        return false;
    }

    /**
     * Connects to FTPS and uploads the file content.
     * Supports creating a subfolder if provided.
     */
    public function uploadTextFile($fileName, $content, $folder = null) {
        $conn_id = false;
        try {
            // 1. Establish connection
            $conn_id = $this->getFtpConnection();            

            // 2. Navigate to the BASE target folder first
            if (!$this->navigateToFolder($conn_id)) {
                throw new \Exception("FTPS: Could not navigate to the base folder.");
            }
            
            // 3. Handle Subfolder Logic (Report_Folder)
            if ($folder) {
                // Try to enter the subfolder
                if (!@ftp_chdir($conn_id, $folder)) {
                    // If failed, try to create it
                    if (ftp_mkdir($conn_id, $folder)) {
                        // Try to enter it again after creating
                        if (!ftp_chdir($conn_id, $folder)) {
                             throw new \Exception("FTPS: Created folder '$folder' but could not enter it.");
                        }
                    } else {
                         throw new \Exception("FTPS: Failed to create folder '$folder'.");
                    }
                }
            }
            
            // 4. Prepare content using a temporary file
            $tmpFile = tmpfile();
            fwrite($tmpFile, $content);
            rewind($tmpFile); 

            // 5. Upload the file
            // IMPORTANT: Changed to FTP_BINARY for images. FTP_ASCII corrupts images!
            $upload_success = @ftp_fput($conn_id, $fileName, $tmpFile, FTP_BINARY);
            
            fclose($tmpFile);

            if (!$upload_success) {
                throw new \Exception("Unable to upload file: $fileName");
            }
            
            // 6. Build the return path
            $basePath = $_ENV['FTPS_BASE_PATH_REPORTS'] ?? 'files/reports/images/';
            $basePath = rtrim($basePath, '/') . '/'; // Ensure trailing slash

            // If we used a subfolder, append it to the path
            if ($folder) {
                $remotePath = $basePath . $folder . '/' . $fileName;
            } else {
                $remotePath = $basePath . $fileName;
            }

            return $remotePath; 

        } catch (\Exception $e) {
            error_log("FTPS Upload Error: " . $e->getMessage());
            return false;
        } finally {
            if ($conn_id) {
                ftp_close($conn_id);
            }
        }
    }
}