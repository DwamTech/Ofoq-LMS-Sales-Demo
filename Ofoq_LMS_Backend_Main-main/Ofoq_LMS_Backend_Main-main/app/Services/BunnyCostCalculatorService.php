<?php

namespace App\Services;

use App\Models\BunnyCostSetting;
use App\Models\BunnyCostSnapshot;
use App\Models\BunnyUsageSnapshot;
use App\Models\BunnyVideoStat;

class BunnyCostCalculatorService
{
    public function calculate(?string $from, ?string $to, bool $dryRun = false): array
    {
        $setting = BunnyCostSetting::activeFor($to);
        $storageBytes = BunnyVideoStat::sum('storage_size_bytes') ?: null;
        $latestUsage = BunnyUsageSnapshot::latest('id')->first();
        $bandwidthBytes = $latestUsage?->bandwidth_bytes;

        if (!$setting) {
            $payload = [
                'period_start' => $from,
                'period_end' => $to,
                'storage_bytes' => $storageBytes,
                'bandwidth_bytes' => $bandwidthBytes,
                'cost_status' => 'missing_settings',
                'accuracy_level' => 'unavailable',
                'data_source' => 'bunny_cost_calculator',
                'unavailable_metrics' => ['active_bunny_cost_settings'],
                'calculation_basis' => [
                    'message' => 'No active Bunny cost settings exist, so no estimated cost was calculated.',
                ],
                'last_synced_at' => now(),
            ];

            if (!$dryRun) {
                BunnyCostSnapshot::create($payload);
            }

            return ['status' => 'missing_settings', 'payload' => $payload];
        }

        $storageGb = $storageBytes ? $storageBytes / 1024 / 1024 / 1024 : 0;
        $bandwidthGb = $bandwidthBytes ? $bandwidthBytes / 1024 / 1024 / 1024 : 0;
        $storageCost = $storageGb * (float) $setting->storage_cost_per_gb_month;
        $bandwidthCost = $bandwidthGb * (float) $setting->bandwidth_cost_per_gb;
        $fixedCost = (float) $setting->fixed_monthly_cost;
        $unavailable = [];

        if ($bandwidthBytes === null) {
            $unavailable[] = 'bandwidth_bytes';
        }

        $payload = [
            'bunny_cost_setting_id' => $setting->id,
            'period_start' => $from,
            'period_end' => $to,
            'storage_bytes' => $storageBytes,
            'bandwidth_bytes' => $bandwidthBytes,
            'storage_cost' => round($storageCost, 6),
            'bandwidth_cost' => round($bandwidthCost, 6),
            'fixed_cost' => round($fixedCost, 6),
            'total_estimated_cost' => round($storageCost + $bandwidthCost + $fixedCost, 6),
            'currency' => $setting->currency,
            'cost_status' => $unavailable === [] ? 'estimated' : 'estimated_partial',
            'accuracy_level' => 'estimated',
            'data_source' => 'bunny_cost_calculator',
            'unavailable_metrics' => $unavailable,
            'calculation_basis' => [
                'formula' => '(storage_bytes / 1024^3 * storage_cost_per_gb_month) + (bandwidth_bytes / 1024^3 * bandwidth_cost_per_gb) + fixed_monthly_cost',
                'storage_cost_per_gb_month' => $setting->storage_cost_per_gb_month,
                'bandwidth_cost_per_gb' => $setting->bandwidth_cost_per_gb,
                'fixed_monthly_cost' => $setting->fixed_monthly_cost,
                'currency' => $setting->currency,
            ],
            'last_synced_at' => now(),
        ];

        if (!$dryRun) {
            BunnyCostSnapshot::create($payload);
        }

        return ['status' => $payload['cost_status'], 'payload' => $payload];
    }
}
