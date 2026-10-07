<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "🧪 Testing Active Attempt Fix\n";
echo str_repeat("=", 80) . "\n\n";

// Test credentials
$email = 'student@ofuq.academy';
$password = 'Abdo0101@';
$courseId = 10;

// Step 1: Login
echo "STEP 1: Login\n";
echo str_repeat("-", 80) . "\n";

$loginUrl = 'https://back.ofuq.academy/api/login';
$loginData = json_encode([
    'login' => $email,
    'password' => $password
]);

$ch = curl_init($loginUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $loginData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

$loginResponse = curl_exec($ch);
$loginStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($loginStatus !== 201 && $loginStatus !== 200) {
    echo "❌ Login failed with status $loginStatus\n";
    echo "Response: $loginResponse\n";
    exit(1);
}

$loginData = json_decode($loginResponse, true);
$token = $loginData['token'] ?? null;

if (!$token) {
    echo "❌ No token in login response\n";
    exit(1);
}

echo "✓ Login successful\n";
echo "Token: " . substr($token, 0, 20) . "...\n\n";

// Step 2: Test Active Attempt Endpoint
echo "STEP 2: Test Active Attempt Endpoint\n";
echo str_repeat("-", 80) . "\n";

$attemptUrl = "https://back.ofuq.academy/api/courses/$courseId/final-exam/attempt/active";

$ch = curl_init($attemptUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_HEADER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$headers = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

echo "HTTP Status: $httpCode\n";
echo "Response Body:\n";
echo $body . "\n\n";

// Step 3: Analyze Response
echo "STEP 3: Analysis\n";
echo str_repeat("-", 80) . "\n";

if ($httpCode === 200) {
    $data = json_decode($body, true);
    
    if ($data === null) {
        echo "❌ FAILED: Response body is null\n";
        echo "This indicates the infrastructure is still stripping the body\n";
    } elseif (isset($data['success']) && $data['success'] === false) {
        echo "✓ SUCCESS: Got 200 response with success: false\n";
        echo "✓ Error type: " . ($data['error_type'] ?? 'not set') . "\n";
        echo "✓ Message: " . ($data['message'] ?? 'not set') . "\n";
        echo "\n✅ FIX WORKING: Frontend will correctly handle this as 'no active attempt'\n";
    } elseif (isset($data['success']) && $data['success'] === true) {
        echo "✓ Active attempt found\n";
        echo "Attempt ID: " . ($data['data']['attempt_id'] ?? 'not set') . "\n";
    } else {
        echo "⚠ Unexpected response format\n";
        echo "Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    }
} elseif ($httpCode === 404) {
    echo "❌ FAILED: Still getting 404\n";
    echo "The code change may not be deployed yet\n";
    echo "Response body: $body\n";
} else {
    echo "⚠ Unexpected HTTP status: $httpCode\n";
    echo "Response: $body\n";
}

echo "\n" . str_repeat("=", 80) . "\n";
echo "Test Complete\n";
