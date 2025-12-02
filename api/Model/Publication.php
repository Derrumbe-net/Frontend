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
}
