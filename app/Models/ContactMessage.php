<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property string|null $subject
 * @property string $message
 * @property string $status
 * @property Carbon|null $read_at
 * @property Carbon|null $responded_at
 * @property Carbon|null $created_at
 */
class ContactMessage extends Model
{
    protected $fillable = ['name', 'email', 'phone', 'subject', 'message', 'status', 'read_at', 'responded_at', 'ip_hash'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime', 'responded_at' => 'datetime'];
    }
}
