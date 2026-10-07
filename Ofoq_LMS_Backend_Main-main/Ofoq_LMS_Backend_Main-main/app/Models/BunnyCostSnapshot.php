<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BunnyCostSnapshot extends Model
{
    protected $fillable = [
        'bunny_cost_setting_id',
        'period_start',
        'period_end',
        'storage_bytes',
        'bandwidth_bytes',
        'storage_cost',
        'bandwidth_cost',
        'fixed_cost',
        'total_estimated_cost',
        'currency',
        'cost_status',
        'data_source',
        'accuracy_level',
        'calculation_basis',
        'unavailable_metrics',
        'last_synced_at',
    ];

    protected $casts = [
        'period_start' => 'datetime',
        'period_end' => 'datetime',
        'storage_bytes' => 'integer',
        'bandwidth_bytes' => 'integer',
        'storage_cost' => 'decimal:6',
        'bandwidth_cost' => 'decimal:6',
        'fixed_cost' => 'decimal:6',
        'total_estimated_cost' => 'decimal:6',
        'calculation_basis' => 'array',
        'unavailable_metrics' => 'array',
        'last_synced_at' => 'datetime',
    ];

    public function costSetting(): BelongsTo
    {
        return $this->belongsTo(BunnyCostSetting::class, 'bunny_cost_setting_id');
    }
}
