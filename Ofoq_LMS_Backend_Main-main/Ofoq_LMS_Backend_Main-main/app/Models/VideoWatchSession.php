<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VideoWatchSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'lesson_id',
        'course_id',
        'category_id',
        'video_guid',
        'started_at',
        'ended_at',
        'last_event_at',
        'duration_seconds',
        'watched_seconds',
        'max_position_seconds',
        'completion_percentage',
        'completed',
        'completed_at',
        'ip_address',
        'user_agent',
        'device_id',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'last_event_at' => 'datetime',
        'completed_at' => 'datetime',
        'duration_seconds' => 'integer',
        'watched_seconds' => 'integer',
        'max_position_seconds' => 'integer',
        'completion_percentage' => 'decimal:2',
        'completed' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(CategoryOfCourse::class, 'category_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(VideoWatchEvent::class);
    }
}
