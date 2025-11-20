<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;

class StationInfo {
    private $conn;
    public function __construct($conn){ $this->conn = $conn; }

    // CREATE STATION INFO
    public function createStationInfo($data){
        try{
            $stmt = $this->conn->prepare(
                "INSERT INTO station_info
                (admin_id, soil_saturation, precipitation, sensor_image_url, data_image_url, city,
                 is_available, last_updated, latitude, longitude, wc1, wc2, wc3, wc4)
                 VALUES
                (:admin_id, :soil_saturation, :precipitation, :sensor_image_url, :data_image_url, :city,
                 :is_available, :last_updated, :latitude, :longitude, :wc1, :wc2, :wc3, :wc4)"
            );
            $stmt->bindParam(':admin_id', $data['admin_id'], PDO::PARAM_INT);
            $stmt->bindParam(':soil_saturation', $data['soil_saturation'], PDO::PARAM_STR);
            $stmt->bindParam(':precipitation', $data['precipitation'], PDO::PARAM_STR);
            $stmt->bindParam(':sensor_image_url', $data['sensor_image_url'], PDO::PARAM_STR);
            $stmt->bindParam(':data_image_url', $data['data_image_url'], PDO::PARAM_STR);
            $stmt->bindParam(':city', $data['city'], PDO::PARAM_STR);
            $stmt->bindParam(':is_available', $data['is_available'], PDO::PARAM_BOOL);
            $stmt->bindParam(':last_updated', $data['last_updated'], PDO::PARAM_STR);
            $stmt->bindParam(':latitude', $data['latitude'], PDO::PARAM_STR);
            $stmt->bindParam(':longitude', $data['longitude'], PDO::PARAM_STR);
            $stmt->bindParam(':wc1', $data['wc1'], PDO::PARAM_STR);
            $stmt->bindParam(':wc2', $data['wc2'], PDO::PARAM_STR);
            $stmt->bindParam(':wc3', $data['wc3'], PDO::PARAM_STR);
            $stmt->bindParam(':wc4', $data['wc4'], PDO::PARAM_STR);
            // $stmt->execute();
            
            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            } else {
                return false;
            }
        }catch(PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    // GET STATION INFO BY ID
    public function getStationInfoById($id){
        $stmt=$this->conn->prepare("SELECT * FROM station_info WHERE station_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET ALL STATIONS INFO
    public function getAllStationInfos(){
        $stmt=$this->conn->query("SELECT * FROM station_info");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // UPDATE STATION INFO BY ID
    public function updateStationInfo($id,$data){
        try{
            $stmt=$this->conn->prepare(
                "UPDATE station_info SET admin_id=:admin_id,soil_saturation=:soil_saturation,
                 precipitation=:precipitation,sensor_image_url=:sensor_image_url,data_image_url=:data_image_url,
                 city=:city,is_available=:is_available,last_updated=:last_updated,
                 latitude=:latitude,longitude=:longitude,
                 wc1=:wc1, wc2=:wc2, wc3=:wc3, wc4=:wc4
                 WHERE station_id=:id"
            );
            $stmt->bindParam(':admin_id', $data['admin_id'], PDO::PARAM_INT);
            $stmt->bindParam(':soil_saturation', $data['soil_saturation'], PDO::PARAM_STR);
            $stmt->bindParam(':precipitation', $data['precipitation'], PDO::PARAM_STR);
            $stmt->bindParam(':sensor_image_url', $data['sensor_image_url'], PDO::PARAM_STR);
            $stmt->bindParam(':data_image_url', $data['data_image_url'], PDO::PARAM_STR);
            $stmt->bindParam(':city', $data['city'], PDO::PARAM_STR);
            $stmt->bindParam(':is_available', $data['is_available'], PDO::PARAM_BOOL);
            $stmt->bindParam(':last_updated', $data['last_updated'], PDO::PARAM_STR);
            $stmt->bindParam(':latitude', $data['latitude'], PDO::PARAM_STR);
            $stmt->bindParam(':longitude', $data['longitude'], PDO::PARAM_STR);
            $stmt->bindParam(':wc1', $data['wc1'], PDO::PARAM_STR);
            $stmt->bindParam(':wc2', $data['wc2'], PDO::PARAM_STR);
            $stmt->bindParam(':wc3', $data['wc3'], PDO::PARAM_STR);
            $stmt->bindParam(':wc4', $data['wc4'], PDO::PARAM_STR);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        }catch(PDOException $e){
            error_log($e->getMessage());
            return false;
        }
    }

    // DELETE STATION BY ID
    public function deleteStationInfo($id){
        $stmt=$this->conn->prepare("DELETE FROM station_info WHERE station_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getStationFileData($fileName) {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user   = $_ENV['FTPS_USER'];
        $ftp_pass   = $_ENV['FTPS_PASS'];
        $ftp_port   = $_ENV['FTPS_PORT'];

        $base_remote_path = $_ENV['FTPS_BASE_PATH'] ?? 'files/network/data/latest/';
        $remote_file_path = rtrim($base_remote_path, '/') . '/' . ltrim($fileName, '/');

        $conn_id = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn_id) throw new Exception("Failed to connect to FTPS server: $ftp_server");

        if (!@ftp_login($conn_id, $ftp_user, $ftp_pass)) {
            ftp_close($conn_id);
            throw new Exception("FTPS login failed for user: $ftp_user");
        }

        ftp_pasv($conn_id, true);

        $files = ftp_nlist($conn_id, $base_remote_path);

        // Download to temporary file
        $tmpFile = tmpfile();
        $meta = stream_get_meta_data($tmpFile);
        $tmpFilePath = $meta['uri'];

        if (!ftp_fget($conn_id, $tmpFile, $remote_file_path, FTP_ASCII)) {
            fclose($tmpFile);
            ftp_close($conn_id);
            throw new Exception("Unable to download file: $remote_file_path via FTPS");
        }

        rewind($tmpFile);

        // Skip first metadata line
        fgetcsv($tmpFile, 0, ',', '"', '\\');

        // Header line (column names)
        $headers = fgetcsv($tmpFile, 0, ',', '"', '\\');
        if (!$headers) {
            fclose($tmpFile);
            ftp_close($conn_id);
            throw new Exception("Invalid or missing headers in .dat file: $remote_file_path");
        }

        // Skip the next 2 lines (technical row + units)
        fgetcsv($tmpFile, 0, ',', '"', '\\');
        fgetcsv($tmpFile, 0, ',', '"', '\\');

        $data = [];
        while (($row = fgetcsv($tmpFile, 0, ',', '"', '\\')) !== false) {
            if (!$row || count($row) !== count($headers)) continue;
            $data[] = array_combine($headers, $row);
        }

        fclose($tmpFile);
        ftp_close($conn_id);

        return $data;
    }

    // PROCESS FILE AND UPDATE STATION INFO
    public function processStationFileAndUpdate($stationId) {
        $stationInfo = $this->getStationInfoById($stationId);
        if (!$stationInfo) {
            echo "[ERROR] Station ID $stationId not found.\n";
            return false;
        }

        // Get file name from station info
        if (empty($stationInfo['ftp_file_path'])) {
            echo "[ERROR] No file_name found for station ID $stationId.\n";
            return false;
        }
        $fileName = $stationInfo['ftp_file_path'];

        // Load data from FTPS file
        $dataRows = $this->getStationFileData($fileName);
        if (empty($dataRows)) {
            echo "[WARN] No data loaded from file: $fileName\n";
            return false;
        }

        // 12-hour rain total
        $last12Rows = array_slice($dataRows, -12);
        $rainValues = array_map(fn($row) => isset($row['Rain_mm_Tot']) ? (float)$row['Rain_mm_Tot'] : 0.0, $last12Rows);
        $totalRain = array_sum($rainValues);

        $lastRow = end($dataRows);
        $wcValues = [];

        foreach ($lastRow as $col => $value) {
            $normalizedCol = strtolower(trim($col));
            if (str_starts_with($normalizedCol, 'wc')) {
                $baseKey = explode('_', $normalizedCol)[0];
                $wcValues[$baseKey] = (float)$value;
            }
        }

        $wcMaxValues = [
            'wc1' => (float)$stationInfo['wc1'],
            'wc2' => (float)$stationInfo['wc2'],
            'wc3' => (float)$stationInfo['wc3'],
            'wc4' => (float)$stationInfo['wc4']
        ];

        $avgVWC = null;
        if ($wcMaxValues && count($wcMaxValues) === count($wcValues)) {
            $vwcRatios = [];
            foreach ($wcValues as $i => $wc) $vwcRatios[] = $wc / $wcMaxValues[$i];
            $avgVWC = array_sum($vwcRatios) / count($vwcRatios) * 100;
        } else {
            echo "[WARN] WC max values missing or mismatch for station ID: $stationId\n";
        }

        $updateData = [
            'admin_id'        => $stationInfo['admin_id'],
            'soil_saturation' => $avgVWC !== null ? number_format($avgVWC, 0) : null,
            'precipitation'   => number_format($totalRain, 2),
            'sensor_image_url'=> $stationInfo['sensor_image_url'],
            'data_image_url'  => $stationInfo['data_image_url'],
            'city'            => $stationInfo['city'],
            'is_available'    => true,
            'last_updated'    => date('Y-m-d H:i:s'),
            'latitude'        => $stationInfo['latitude'],
            'longitude'       => $stationInfo['longitude'],
            'wc1'         => $stationInfo['wc1'],
            'wc2'         => $stationInfo['wc2'],
            'wc3'         => $stationInfo['wc3'],
            'wc4'         => $stationInfo['wc4'],
        ];

        $result = $this->updateStationInfo($stationId, $updateData);

        return $result;
    }
}

