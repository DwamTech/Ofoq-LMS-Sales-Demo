<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoWatchEvent extends Model
{
    use HasFactory;

    public const TYPES = [
        'started',
        'play',
        'pause',
        'seek',
        'progress',
        'heartbeat',
        'completed',
        'resumed',
    ];

    public $timestamps = false;

    protected $fillable = [
        'video_watch_session_id',
        'user_id',
        'lesson_id',
        'event_type',
        'position_seconds',
        'duration_seconds',
        'watched_delta_seconds',
        'playback_rate',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'position_seconds' => 'integer',
        'duration_seconds' => 'integer',
        'watched_delta_seconds' => 'integer',
        'playback_rate' => 'decimal:2',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(VideoWatchSession::class, 'video_watch_session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
