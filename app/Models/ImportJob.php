<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImportJob extends Model
{
    public const STATUS_QUEUED = 'queued';
    public const STATUS_RUNNING = 'running';
    public const STATUS_DONE = 'done';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'type',
        'status',
        'message',
        'context',
        'started_at',
        'finished_at',
        'file_name', // Store original file name for reference
    ];

    protected $casts = [
        'context' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function markRunning(): void
    {
        $this->forceFill([
            'status' => self::STATUS_RUNNING,
            'started_at' => now(),
            'message' => null,
        ])->save();
    }

    public function markDone(?string $message = null): void
    {
        $this->forceFill([
            'status' => self::STATUS_DONE,
            'finished_at' => now(),
            'message' => $message,
        ])->save();
    }

    public function markFailed(?string $message = null): void
    {
        $this->forceFill([
            'status' => self::STATUS_FAILED,
            'finished_at' => now(),
            'message' => $message,
        ])->save();
    }
}
