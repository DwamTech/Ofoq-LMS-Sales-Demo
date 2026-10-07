<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BunnyUsageSnapshot extends Model
{
    protected $fillable = [
        'period_start',
        'period_end',
        'hourly',
        'total_views',
        'total_watch_time_seconds',
        'total_storage_size_bytes',
        'traffic_usage_bytes',
        'storage_usage_bytes',
        'bandwidth_bytes',
        'requests_count',
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
        'total_storage_size_bytes' => 'integer',
        'traffic_usage_bytes' => 'integer',
        'storage_usage_bytes' => 'integer',
        'bandwidth_bytes' => 'integer',
        'requests_count' => 'integer',
        'views_chart' => 'array',
        'watch_time_chart' => 'array',
        'country_view_counts' => 'array',
        'country_watch_time' => 'array',
        'unavailable_metrics' => 'array',
        'raw_payload' => 'array',
        'last_synced_at' => 'datetime',
    ];
}
