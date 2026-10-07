<?php

/**
 * Quick script to reset a diploma certificate status to pending for retry
 * Usage: php reset_certificate.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DiplomaCertificate;
use App\Models\User;

// Find the student
$studentName = 'عبد الحكيم   عبدلي عبد';
$user = User::where('name', 'LIKE', '%عبد الحكيم%')->first();

if (!$user) {
    echo "❌ Student not found: {$studentName}\n";
    exit(1);
}

echo "✓ Found student: {$user->name} (ID: {$user->id})\n";

// Find their diploma certificate
$certificate = DiplomaCertificate::where('user_id', $user->id)
    ->orderBy('created_at', 'desc')
    ->first();

if (!$certificate) {
    echo "❌ No diploma certificate found for this student\n";
    exit(1);
}

echo "✓ Found certificate (ID: {$certificate->id})\n";
echo "  Current status: {$certificate->status}\n";
echo "  Current file_path: " . ($certificate->file_path ?? 'NULL') . "\n";
echo "  Diploma ID: {$certificate->diploma_id}\n";

// Reset to pending
$certificate->update([
    'status' => 'pending',
    'file_path' => null,
]);

echo "\n✓ Certificate reset to pending status\n";
echo "  New status: {$certificate->status}\n";
echo "  New file_path: " . ($certificate->file_path ?? 'NULL') . "\n";

echo "\n✓ Now run the queue worker to regenerate:\n";
echo "  php artisan queue:work --once\n";
