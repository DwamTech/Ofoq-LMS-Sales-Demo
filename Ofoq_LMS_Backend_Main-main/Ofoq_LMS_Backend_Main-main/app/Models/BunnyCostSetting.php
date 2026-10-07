<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BunnyCostSetting extends Model
{
    protected $fillable = [
        'bandwidth_cost_per_gb',
        'storage_cost_per_gb_month',
        'fixed_monthly_cost',
        'currency',
        'effective_from',
        'is_active',
        'data_source',
        'accuracy_level',
        'metadata',
    ];

    protected $casts = [
        'bandwidth_cost_per_gb' => 'decimal:6',
        'storage_cost_per_gb_month' => 'decimal:6',
        'fixed_monthly_cost' => 'decimal:6',
        'effective_from' => 'date',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    public function snapshots(): HasMany
    {
        return $this->hasMany(BunnyCostSnapshot::class);
    }

    public static function activeFor(?string $date = null): ?self
    {
        return self::where('is_active', true)
            ->where('effective_from', '<=', $date ?? now()->toDateString())
            ->orderByDesc('effective_from')
            ->first();
    }
}
