<?php

namespace App\Enums;

enum ProjectApplicationStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case PendingDocuments = 'pending_documents';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Rascunho',
            self::Submitted => 'Enviada',
            self::UnderReview => 'Em análise',
            self::PendingDocuments => 'Pendente de documentação',
            self::Approved => 'Aprovada',
            self::Rejected => 'Rejeitada',
            self::Cancelled => 'Cancelada',
        };
    }

    public function countsAgainstLimit(): bool
    {
        return ! in_array($this, [self::Draft, self::Cancelled], true);
    }
}
