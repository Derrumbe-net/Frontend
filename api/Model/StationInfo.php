<?php

namespace DerrumbeNet\Model;

use PDO;
use PDOException;
use Exception;

class StationInfo
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    // CREATE STATION INFO
    public function createStationInfo($data)
    {
        try {
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

            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            } else {
                return false;
            }
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    // GET STATION INFO BY ID
    public function getStationInfoById($id)
    {
        $stmt = $this->conn->prepare("SELECT * FROM station_info WHERE station_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // GET ALL STATIONS INFO
    public function getAllStationInfos()
    {
        $stmt = $this->conn->query("SELECT * FROM station_info");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // UPDATE STATION INFO BY ID
    public function updateStationInfo($id, $data)
    {
        try {
            $stmt = $this->conn->prepare(
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
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    // DELETE STATION BY ID
    public function deleteStationInfo($id)
    {
        $stmt = $this->conn->prepare("DELETE FROM station_info WHERE station_id=:id");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function getStationHistoryFileData($fileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user = $_ENV['FTPS_USER'];
        $ftp_pass = $_ENV['FTPS_PASS'];
        $ftp_port = $_ENV['FTPS_PORT'];

        $base_remote_path = $_ENV['FTPS_BASE_PATH'] ?? 'files/';
        $remote_file_path = rtrim($base_remote_path, '/') . '/' . ltrim($fileName, '/');
        $conn_id = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn_id) throw new Exception("Failed to connect to FTPS server: $ftp_server");

        if (!@ftp_login($conn_id, $ftp_user, $ftp_pass)) {
            ftp_close($conn_id);
            throw new Exception("FTPS login failed for user: $ftp_user");
        }

        ftp_pasv($conn_id, true);

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

        $headers = fgetcsv($tmpFile, 0, ',', '"', '\\');
        if (!$headers) {
            fclose($tmpFile);
            ftp_close($conn_id);
            throw new Exception("Invalid or missing headers in file: $remote_file_path");
        }

        $trimmedHeaders = array_map('trim', $headers);

        if (end($trimmedHeaders) === '') {
            array_pop($trimmedHeaders);
        }
        $headerCount = count($trimmedHeaders);


        $data = [];
        while (($row = fgetcsv($tmpFile, 0, ',', '"', '\\')) !== false) {
            if (!$row) continue;

            $rowCount = count($row);

            if ($rowCount < $headerCount) continue;

            if ($rowCount > $headerCount) {
                $row = array_slice($row, 0, $headerCount);
            }

            $data[] = array_combine($trimmedHeaders, $row);
        }

        fclose($tmpFile);
        ftp_close($conn_id);

        return $data;
    }


    public function getStationFileData($fileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user = $_ENV['FTPS_USER'];
        $ftp_pass = $_ENV['FTPS_PASS'];
        $ftp_port = $_ENV['FTPS_PORT'];

        $base_remote_path = $_ENV['FTPS_BASE_PATH'] ?? 'files/';
        $remote_file_path = rtrim($base_remote_path, '/') . '/' . ltrim($fileName, '/');
        $conn_id = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn_id) throw new Exception("Failed to connect to FTPS server: $ftp_server");

        if (!@ftp_login($conn_id, $ftp_user, $ftp_pass)) {
            ftp_close($conn_id);
            throw new Exception("FTPS login failed for user: $ftp_user");
        }

        ftp_pasv($conn_id, true);

        $tmpFile = tmpfile();
        $meta = stream_get_meta_data($tmpFile);
        $tmpFilePath = $meta['uri'];

        if (!ftp_fget($conn_id, $tmpFile, $remote_file_path, FTP_ASCII)) {
            fclose($tmpFile);
            ftp_close($conn_id);
            throw new Exception("Unable to download file: $remote_file_path via FTPS");
        }

        rewind($tmpFile);

        fgetcsv($tmpFile, 0, ',', '"', '\\');

        $headers = fgetcsv($tmpFile, 0, ',', '"', '\\');
        if (!$headers) {
            fclose($tmpFile);
            ftp_close($conn_id);
            throw new Exception("Invalid or missing headers in .dat file: $remote_file_path");
        }

        $trimmedHeaders = array_map('trim', $headers);
        $headerCount = count($trimmedHeaders);

        fgetcsv($tmpFile, 0, ',', '"', '\\');
        fgetcsv($tmpFile, 0, ',', '"', '\\');

        $data = [];
        while (($row = fgetcsv($tmpFile, 0, ',', '"', '\\')) !== false) {
            if (!$row || count($row) !== $headerCount) continue;
            $data[] = array_combine($trimmedHeaders, $row);
        }

        fclose($tmpFile);
        ftp_close($conn_id);

        return $data;
    }

    public function getStationWcHistoryData($stationId)
    {
        $stationInfo = $this->getStationInfoById($stationId);
        if (!$stationInfo) {
            throw new Exception("Station ID $stationId not found.");
        }

        if (empty($stationInfo['history_data_url'])) {
            throw new Exception("No ftp_file_path found for station ID $stationId.");
        }
        $fileName = $stationInfo['history_data_url'];

        $dataRows = $this->getStationHistoryFileData($fileName);
        if (empty($dataRows)) {
            return [];
        }

        $wcColumns = [];
        $timestampColumn = null;

        if (!empty($dataRows)) {
            $headers = array_keys(reset($dataRows));

            foreach ($headers as $header) {
                $normalizedHeader = strtolower($header);

                if (str_contains($normalizedHeader, 'timestamp') || str_contains($normalizedHeader, 'timestmp')) {
                    $timestampColumn = $header;
                }

                if (preg_match('/^wc[1-4]_/', $normalizedHeader)) {
                    $baseWcKey = substr($normalizedHeader, 0, 3);
                    if (!isset($wcColumns[$baseWcKey])) {
                        $wcColumns[$baseWcKey] = $header;
                    }
                }
            }
        }

        if (!$timestampColumn || count($wcColumns) < 4) {
            $missingWc = [];
            for ($i = 1; $i <= 4; $i++) {
                if (!isset($wcColumns["wc$i"])) {
                    $missingWc[] = "wc$i";
                }
            }
            $errorDetail = (!$timestampColumn ? "Timestamp column missing. " : "") .
                (count($missingWc) > 0 ? "Missing WC columns: " . implode(', ', $missingWc) : "");

            throw new Exception("Required columns not found in file: $fileName. Details: " . $errorDetail);
        }

        $dailyData = [];
        $dateFormat = 'Y-m-d';

        foreach ($dataRows as $row) {
            $timestamp = $row[$timestampColumn] ?? null;

            if (!$timestamp) continue;

            try {
                $date = date($dateFormat, strtotime($timestamp));
            } catch (\Throwable $e) {
                error_log("Invalid timestamp format: $timestamp");
                continue;
            }

            if (!isset($dailyData[$date])) {
                $dailyData[$date] = [
                    'count' => 0,
                    'total_wc1' => 0.0,
                    'total_wc2' => 0.0,
                    'total_wc3' => 0.0,
                    'total_wc4' => 0.0,
                ];
            }

            $dailyData[$date]['count']++;
            $dailyData[$date]['total_wc1'] += (float)($row[$wcColumns['wc1']] ?? 0.0);
            $dailyData[$date]['total_wc2'] += (float)($row[$wcColumns['wc2']] ?? 0.0);
            $dailyData[$date]['total_wc3'] += (float)($row[$wcColumns['wc3']] ?? 0.0);
            $dailyData[$date]['total_wc4'] += (float)($row[$wcColumns['wc4']] ?? 0.0);
        }

        $history = [];
        foreach ($dailyData as $date => $data) {
            if ($data['count'] > 0) {
                $history[] = [
                    'timestamp' => $date,
                    'wc1' => round($data['total_wc1'] / $data['count'], 2),
                    'wc2' => round($data['total_wc2'] / $data['count'], 2),
                    'wc3' => round($data['total_wc3'] / $data['count'], 2),
                    'wc4' => round($data['total_wc4'] / $data['count'], 2),
                ];
            }
        }

        return $history;
    }

    public function getStationImageContent($fileName)
    {
        $ftp_server = $_ENV['FTPS_SERVER'];
        $ftp_user   = $_ENV['FTPS_USER'];
        $ftp_pass   = $_ENV['FTPS_PASS'];
        $ftp_port   = $_ENV['FTPS_PORT'];
        $base_remote_path = $_ENV['FTPS_BASE_PATH'] ?? 'files/';

        $remote_file_path = rtrim($base_remote_path, '/') . '/' . ltrim($fileName, '/');

        $conn_id = ftp_ssl_connect($ftp_server, $ftp_port, 10);
        if (!$conn_id) throw new \Exception("Failed to connect to FTPS server");

        if (!@ftp_login($conn_id, $ftp_user, $ftp_pass)) {
            ftp_close($conn_id);
            throw new \Exception("FTPS login failed");
        }

        ftp_pasv($conn_id, true);

        $tmpFile = tmpfile();

        if (!ftp_fget($conn_id, $tmpFile, $remote_file_path, FTP_BINARY)) {
            fclose($tmpFile);
            ftp_close($conn_id);
            throw new \Exception("Unable to download image: $remote_file_path");
        }

        rewind($tmpFile);
        $content = stream_get_contents($tmpFile);

        fclose($tmpFile);
        ftp_close($conn_id);

        return $content;
    }
}
