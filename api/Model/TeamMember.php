<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;
use Exception;

class TeamMember
{
    private $conn;
    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    // CREATE
    public function createMember($data)
    {
        try {
            $stmt = $this->conn->prepare(
                "INSERT INTO team_member
                    (name, role, email, phone, phone_ext, linkedin_url, image_url, member_type, display_order)
                 VALUES
                    (:name, :role, :email, :phone, :phone_ext, :linkedin_url, :image_url, :member_type, :display_order)"
            );
            $name          = $data['name'];
            $role          = $data['role'];
            $email         = $data['email']         ?? null;
            $phone         = $data['phone']         ?? null;
            $phone_ext     = $data['phone_ext']     ?? null;
            $linkedin_url  = $data['linkedin_url']  ?? null;
            $image_url     = $data['image_url']     ?? null;
            $member_type   = $data['member_type'];
            $display_order = (int) ($data['display_order'] ?? 0);

            $stmt->bindParam(':name',          $name,          PDO::PARAM_STR);
            $stmt->bindParam(':role',          $role,          PDO::PARAM_STR);
            $stmt->bindParam(':email',         $email,         PDO::PARAM_STR);
            $stmt->bindParam(':phone',         $phone,         PDO::PARAM_STR);
            $stmt->bindParam(':phone_ext',     $phone_ext,     PDO::PARAM_STR);
            $stmt->bindParam(':linkedin_url',  $linkedin_url,  PDO::PARAM_STR);
            $stmt->bindParam(':image_url',     $image_url,     PDO::PARAM_STR);
            $stmt->bindParam(':member_type',   $member_type,   PDO::PARAM_STR);
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

    // GET ALL (ordered by type then display_order)
    public function getAllMembers()
    {
        $stmt = $this->conn->query(
            "SELECT * FROM team_member ORDER BY
             FIELD(member_type,'faculty','graduate','undergraduate'),
             display_order ASC, member_id ASC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // GET BY ID
    public function getMemberById($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM team_member WHERE member_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // UPDATE
    public function updateMember($id, $data)
    {
        try {
            $allowed = ['name', 'role', 'email', 'phone', 'phone_ext', 'linkedin_url', 'image_url', 'member_type', 'display_order'];
            $setClauses = [];
            $params = [':id' => $id];

            foreach ($allowed as $col) {
                if (array_key_exists($col, $data)) {
                    $setClauses[] = "$col = :$col";
                    $params[":$col"] = $data[$col];
                }
            }
            if (empty($setClauses)) return true;

            $sql = "UPDATE team_member SET " . implode(', ', $setClauses) . " WHERE member_id = :id";
            $stmt = $this->conn->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    // UPDATE image_url only
    public function updateMemberImageColumn($id, $filename)
    {
        try {
            $stmt = $this->conn->prepare(
                "UPDATE team_member SET image_url=:image_url WHERE member_id=:id"
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
    public function deleteMember($id)
    {
        $stmt = $this->conn->prepare("DELETE FROM team_member WHERE member_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    // ---- FTP helpers (mirrors Publication pattern) ----

    public function uploadImageToFtp($localFilePath, $remoteFileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user   = $_ENV['FTPS_USER'];
        $ftp_pass   = $_ENV['FTPS_PASS'];
        $ftp_port   = $_ENV['FTPS_PORT'];

        $base   = rtrim($_ENV['FTPS_BASE_PATH'] ?? 'files/', '/');
        $target = $base . '/team/';
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

    public function getMemberImageContent($fileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user   = $_ENV['FTPS_USER'];
        $ftp_pass   = $_ENV['FTPS_PASS'];
        $ftp_port   = $_ENV['FTPS_PORT'];

        $base   = rtrim($_ENV['FTPS_BASE_PATH'] ?? 'files/', '/');
        $remote = $base . '/team/' . ltrim($fileName, '/');

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
