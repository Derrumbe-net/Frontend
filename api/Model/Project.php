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
}
