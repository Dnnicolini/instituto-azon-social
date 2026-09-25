<?php

namespace App\Mail;

use App\Models\ProjectApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProjectApplicationConfirmation extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [30, 120, 600];

    public function __construct(
        public readonly string $projectTitle,
        public readonly string $protocol,
        public readonly string $confirmationMessage,
    ) {}

    public static function fromApplication(ProjectApplication $application, string $message): self
    {
        return new self($application->project->title, (string) $application->protocol, $message);
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Confirmação de inscrição — '.$this->projectTitle);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.project-application-confirmation', text: 'mail.project-application-confirmation-text');
    }
}
