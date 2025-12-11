<?php

namespace DerrumbeNet\Test\Model;

/**
 * Shared state to control FTP mock behavior across all tests.
 */
class FtpState
{
    public static $connect = true;
    public static $login = true;
    public static $chdir = true;
    public static $mkdir = true;
    public static $put = true;
    public static $get = true;
    public static $delete = true;
    public static $nlist = [];

    // NEW: Allow customizing downloaded content (for CSV testing)
    public static $fgetContent = 'fake_content_bytes';

    public static function reset()
    {
        self::$connect = true;
        self::$login = true;
        self::$chdir = true;
        self::$mkdir = true;
        self::$put = true;
        self::$get = true;
        self::$delete = true;
        self::$nlist = [];
        self::$fgetContent = 'fake_content_bytes'; // Default
    }
}

// --- DEFINE GLOBAL MOCKS IN THE MODEL NAMESPACE ---
namespace DerrumbeNet\Model;

use DerrumbeNet\Test\Model\FtpState;

if (!function_exists('DerrumbeNet\Model\ftp_ssl_connect')) {
    function ftp_ssl_connect($h, $p, $t) { return FtpState::$connect ? 1 : false; }
    function ftp_login($c, $u, $p) { return FtpState::$login; }
    function ftp_pasv($c, $m) { return true; }
    function ftp_chdir($c, $d) { return FtpState::$chdir; }
    function ftp_mkdir($c, $d) { return FtpState::$mkdir; }
    function ftp_put($c, $r, $l, $m) { return FtpState::$put; }
    function ftp_fput($c, $f, $h, $m) { return FtpState::$put; }

    function ftp_fget($c, $h, $r, $m) {
        if (FtpState::$get) {
            // Write the custom content buffer to the file handle
            fwrite($h, FtpState::$fgetContent);
            return true;
        }
        return false;
    }

    function ftp_nlist($c, $d) { return FtpState::$nlist; }
    function ftp_delete($c, $p) { return FtpState::$delete; }
    function ftp_close($c) { return true; }
}