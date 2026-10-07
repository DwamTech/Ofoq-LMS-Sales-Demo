<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BunnySyncLog extends Model
{
    protected $fillable = [
        'sync_type',
        'status',
        'dry_run',
        'limit',
        'processed_count',
        'succeeded_count',
        'failed_count',
        'skipped_count',
        'message',
        'error_message',
        'metadata',
        'started_at',
        'finished_at',
        'duration_ms',
    ];

    protected $casts = [
        'dry_run' => 'boolean',
        'limit' => 'integer',
        'processed_count' => 'integer',
        'succeeded_count' => 'integer',
        'failed_count' => 'integer',
        'skipped_count' => 'integer',
        'metadata' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'duration_ms' => 'integer',
    ];
}
