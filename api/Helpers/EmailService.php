<?php

namespace DerrumbeNet\Helpers;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailService {

    private $mailer;
    private $templateBaseDir;

    public function __construct(PHPMailer $mailer = null, string $templateBaseDir = null) {
        $this->mailer = $mailer;
        $this->templateBaseDir = $templateBaseDir ?? __DIR__ . '/email_templates';
    }

    /** Load an HTML template and replace {{variables}} */
    public function renderTemplate(string $templateName, array $vars = []): string {
        $path = $this->templateBaseDir . "/{$templateName}.html";

        if (!file_exists($path)) {
            throw new \Exception("Email template not found: {$path}");
        }

        $html = file_get_contents($path);

        foreach ($vars as $key => $value) {
            $html = str_replace("{{{$key}}}", htmlspecialchars($value), $html);
        }

        return $html;
    }

    /** Send email with PHPMailer */
    public function sendEmail(string $to, string $subject, string $body): bool {
        $mail = $this->mailer ?? new PHPMailer(true);

        try {
            if ($this->mailer) {
                $mail->clearAllRecipients();
                $mail->clearAttachments();
                $mail->clearCustomHeaders();
            }

            // Set SMTP Settings (Safe to run on Mocks)
            $mail->isSMTP();
            $mail->Host       = $_ENV['SMTP_HOST'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $_ENV['SMTP_USER'];
            $mail->Password   = $_ENV['SMTP_PASS']; // App password
            $mail->SMTPSecure = $_ENV['SMTP_SECURE'];
            $mail->Port       = $_ENV['SMTP_PORT'];

            $mail->setFrom($_ENV['SMTP_USER'], "DerrumbesNet Notifications");
            $mail->addAddress($to);

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;

            return $mail->send();
        } catch (Exception $e) {
            error_log("Email send error: {$mail->ErrorInfo}");
            return false;
        }
    }
}