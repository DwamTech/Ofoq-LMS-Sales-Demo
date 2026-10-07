<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BunnyVideoStat extends Model
{
    protected $fillable = [
        'lesson_id',
        'video_guid',
        'title',
        'status_code',
        'status_label',
        'duration_seconds',
        'storage_size_bytes',
        'views',
        'average_watch_time_seconds',
        'total_watch_time_seconds',
        'thumbnail_file_name',
        'thumbnail_url',
        'collection_id',
        'available_resolutions',
        'data_source',
        'accuracy_level',
        'sync_status',
        'raw_payload',
        'last_synced_at',
    ];

    protected $casts = [
        'status_code' => 'integer',
        'duration_seconds' => 'integer',
        'storage_size_bytes' => 'integer',
        'views' => 'integer',
        'average_watch_time_seconds' => 'integer',
        'total_watch_time_seconds' => 'integer',
        'raw_payload' => 'array',
        'last_synced_at' => 'datetime',
    ];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
