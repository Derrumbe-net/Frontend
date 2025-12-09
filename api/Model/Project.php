<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;

class Project {
    private $conn;
    public function __construct($conn){ $this->conn = $conn; }

    // CREATE PROJECT
    public function createProject($data){
        try{
            $stmt = $this->conn->prepare(
                "INSERT INTO project (admin_id, title, start_year, end_year, project_status, description, image_url)
                 VALUES (:admin_id, :title, :start_year, :end_year, :project_status, :description, :image_url)"
            );
            $stmt->bindParam(':admin_id', $data['admin_id'], PDO::PARAM_INT);
            $stmt->bindParam(':title', $data['title'], PDO::PARAM_STR);
            $stmt->bindParam(':start_year', $data['start_year'], PDO::PARAM_INT);
            $stmt->bindParam(':end_year', $data['end_year'], PDO::PARAM_INT);
            $stmt->bindParam(':project_status', $data['project_status'], PDO::PARAM_STR);
            $stmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
            $stmt->bindParam(':image_url', $data['image_url'], PDO::PARAM_STR);
            // $stmt->execute();
            
            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            } else {
                return false;
            }
        } catch(PDOException $e){ error_log($e->getMessage()); return false; }
    }
    
    // GET PROJECT ID
    public function getProjectById($id){
        $stmt=$this->conn->prepare("SELECT * FROM project WHERE project_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET PROJECT BY STATUS
    public function getProjectsByStatus($status){
        $stmt = $this->conn->prepare("SELECT * FROM project WHERE project_status = :status");
        $stmt->bindParam(':status', $status, PDO::PARAM_STR);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET ALL PROJECT
    public function getAllProjects(){
        $stmt = $this->conn->query("SELECT * FROM project");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // UPDATE PROJECT BY ID
    public function updateProject($id,$data){
        try{
            $stmt = $this->conn->prepare(
                "UPDATE project SET admin_id=:admin_id,title=:title,start_year=:start_year,
                 end_year=:end_year,project_status=:project_status,description=:description,image_url=:image_url
                 WHERE project_id=:id"
            );
            $stmt->bindParam(':admin_id', $data['admin_id'], PDO::PARAM_INT);
            $stmt->bindParam(':title', $data['title'], PDO::PARAM_STR);
            $stmt->bindParam(':start_year', $data['start_year'], PDO::PARAM_INT);
            $stmt->bindParam(':end_year', $data['end_year'], PDO::PARAM_INT);
            $stmt->bindParam(':project_status', $data['project_status'], PDO::PARAM_STR);
            $stmt->bindParam(':description', $data['description'], PDO::PARAM_STR);
            $stmt->bindParam(':image_url', $data['image_url'], PDO::PARAM_STR);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch(PDOException $e){ error_log($e->getMessage()); return false; }
    }
    
    // DELETE PROJECT BY ID
    public function deleteProject($id){
        $stmt=$this->conn->prepare("DELETE FROM project WHERE project_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function updateProjectImageColumn($id, $filename) {
        try {
            $stmt = $this->conn->prepare("UPDATE project SET image_url=:image_url WHERE project_id=:id");
            $stmt->bindParam(':image_url', $filename, PDO::PARAM_STR);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch(PDOException $e) { error_log($e->getMessage()); return false; }
    }

    public function uploadImageToFtp($localFilePath, $remoteFileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user = $_ENV['FTPS_USER'];
        $ftp_pass = $_ENV['FTPS_PASS'];
        $ftp_port = $_ENV['FTPS_PORT'];

        // Define specific folder for projects
        $base_remote_path = $_ENV['FTPS_BASE_PATH'] ?? 'files/';
        $target_dir = rtrim($base_remote_path, '/') . '/projects/';
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
        return $remoteFileName;
    }

    public function getProjectImageContent($fileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user = $_ENV['FTPS_USER'];
        $ftp_pass = $_ENV['FTPS_PASS'];
        $ftp_port = $_ENV['FTPS_PORT'];

        // Construct path for projects
        $base_remote_path = $_ENV['FTPS_BASE_PATH'] ?? 'files/';
        $remote_file_path = rtrim($base_remote_path, '/') . '/projects/' . ltrim($fileName, '/');

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
