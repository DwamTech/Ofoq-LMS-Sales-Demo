<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BunnyVideoUsageSnapshot extends Model
{
    protected $fillable = [
        'lesson_id',
        'video_guid',
        'period_start',
        'period_end',
        'hourly',
        'total_views',
        'total_watch_time_seconds',
        'engagement_score',
        'data_source',
        'metric_type',
        'accuracy_level',
        'sync_status',
        'views_chart',
        'watch_time_chart',
        'country_view_counts',
        'country_watch_time',
        'unavailable_metrics',
        'raw_payload',
        'last_synced_at',
    ];

    protected $casts = [
        'period_start' => 'datetime',
        'period_end' => 'datetime',
        'hourly' => 'boolean',
        'total_views' => 'integer',
        'total_watch_time_seconds' => 'integer',
        'engagement_score' => 'decimal:2',
        'views_chart' => 'array',
        'watch_time_chart' => 'array',
        'country_view_counts' => 'array',
        'country_watch_time' => 'array',
        'unavailable_metrics' => 'array',
        'raw_payload' => 'array',
        'last_synced_at' => 'datetime',
    ];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
