<?php

namespace Helpers;

use DerrumbeNet\Helpers\EmailService;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPUnit\Framework\TestCase;

class EmailServiceTest extends TestCase
{
    private $tempDir;

    protected function setUp(): void
    {
        // 1. Setup Mock Environment Variables
        $_ENV['SMTP_HOST'] = 'smtp.test.com';
        $_ENV['SMTP_USER'] = 'test@test.com';
        $_ENV['SMTP_PASS'] = 'secret';
        $_ENV['SMTP_SECURE'] = 'tls';
        $_ENV['SMTP_PORT'] = 587;

        // 2. Create a temporary directory for templates
        $this->tempDir = sys_get_temp_dir() . '/email_tests_' . uniqid();
        if (!is_dir($this->tempDir)) {
            mkdir($this->tempDir);
        }
    }

    protected function tearDown(): void
    {
        // Cleanup temporary files
        array_map('unlink', glob("$this->tempDir/*.*"));
        if (is_dir($this->tempDir)) {
            rmdir($this->tempDir);
        }
    }

    // --- TEMPLATE RENDERING TESTS ---

    public function testRenderTemplateSuccess()
    {
        // Create a dummy template file
        $templateContent = "<html><body><h1>Hello {{name}}</h1><p>Welcome to {{app}}</p></body></html>";
        file_put_contents($this->tempDir . '/welcome.html', $templateContent);

        // Inject null mailer (not needed here) and our temp path
        $service = new EmailService(null, $this->tempDir);

        $result = $service->renderTemplate('welcome', [
            'name' => 'John',
            'app' => 'DerrumbeNet'
        ]);

        $this->assertStringContainsString('Hello John', $result);
        $this->assertStringContainsString('Welcome to DerrumbeNet', $result);
    }

    public function testRenderTemplateNotFound()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Email template not found');

        $service = new EmailService(null, $this->tempDir);
        $service->renderTemplate('missing_file');
    }

    // --- SEND EMAIL TESTS ---

    public function testSendEmailSuccess()
    {
        // 1. Create a Mock of PHPMailer
        // We only strictly need to mock 'send' to return true.
        // Other methods (isSMTP, addAddress) return null/void on mocks, which is usually fine.
        $mailerMock = $this->createMock(PHPMailer::class);

        // Expect send() to be called once and return true
        $mailerMock->expects($this->once())
            ->method('send')
            ->willReturn(true);

        // Use 'addAddress' return type stub if your PHPMailer version enforces bool return types
        // $mailerMock->method('addAddress')->willReturn(true);

        $service = new EmailService($mailerMock);

        $result = $service->sendEmail('user@test.com', 'Subject', 'Body');

        $this->assertTrue($result);
    }

    public function testSendEmailFailure()
    {
        $mailerMock = $this->createMock(PHPMailer::class);

        // Expect send() to throw an Exception
        $mailerMock->expects($this->once())
            ->method('send')
            ->willThrowException(new Exception("SMTP Connect Failed"));

        $service = new EmailService($mailerMock);

        // We expect false, and the error should be logged (we can't easily assert the log, but we assert the return value)
        $result = $service->sendEmail('user@test.com', 'Subject', 'Body');

        $this->assertFalse($result);
    }
}