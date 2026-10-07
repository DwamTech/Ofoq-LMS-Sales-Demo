<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLessonProgress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'lesson_id',
        'status',
        'quiz_passed',
        'started_at',
        'completed_at',
        'progress_percentage',
        'watch_duration_seconds',
        'last_watched_at',
        'first_started_at',
        'completed_by',
        'completion_source',
        'last_position_seconds',
    ];

    protected $casts = [
        'quiz_passed' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'progress_percentage' => 'decimal:2',
        'watch_duration_seconds' => 'integer',
        'last_watched_at' => 'datetime',
        'first_started_at' => 'datetime',
        'last_position_seconds' => 'integer',
    ];

    /**
     * Get the user that owns the progress
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the lesson that this progress is for
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Scope for completed lessons
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for in progress lessons
     */
    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    /**
     * Check if lesson is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Mark lesson as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now()
        ]);
    }
}
