<?php

/**
 * Course Routes Testing Script
 * Tests all routes related to /api/course/ and /api/admin/course/
 * 
 * Usage: php test_course_routes.php
 */

// Configuration
$baseUrl = 'https://back.ofuq.academy';
$adminEmail = 'admin@ofuq.academy';
$adminPassword = 'admin123';
$courseId = 3; // Test with course ID 3

// Colors for terminal output
class Colors {
    const RED = "\033[0;31m";
    const GREEN = "\033[0;32m";
    const YELLOW = "\033[1;33m";
    const BLUE = "\033[0;34m";
    const NC = "\033[0m"; // No Color
}

// Helper functions
function printSuccess($message) {
    echo Colors::GREEN . "✅ " . $message . Colors::NC . "\n";
}

function printError($message) {
    echo Colors::RED . "❌ " . $message . Colors::NC . "\n";
}

function printInfo($message) {
    echo Colors::BLUE . "ℹ️  " . $message . Colors::NC . "\n";
}

function printWarning($message) {
    echo Colors::YELLOW . "⚠️  " . $message . Colors::NC . "\n";
}

function printHeader($message) {
    echo "\n";
    echo Colors::BLUE . str_repeat("=", 60) . Colors::NC . "\n";
    echo Colors::BLUE . $message . Colors::NC . "\n";
    echo Colors::BLUE . str_repeat("=", 60) . Colors::NC . "\n";
}

// Function to make HTTP request
function makeRequest($method, $url, $token = null, $data = null) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For testing only
    
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json',
    ];
    
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    switch (strtoupper($method)) {
        case 'POST':
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
            break;
        case 'PUT':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
            break;
        case 'DELETE':
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
            break;
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'body' => $response,
        'error' => $error
    ];
}

// Function to test a route
function testRoute($method, $route, $description, $authRequired, $token, $data = null) {
    global $baseUrl;
    
    echo "\n";
    printInfo("Testing: $description");
    echo "Route: $method $route\n";
    
    $url = $baseUrl . $route;
    $result = makeRequest($method, $url, $authRequired ? $token : null, $data);
    
    $status = $result['status'];
    $body = $result['body'];
    
    // Check status code
    if ($status == 200 || $status == 201) {
        printSuccess("Status: $status - Success");
        
        // Try to decode JSON
        $json = json_decode($body, true);
        if ($json) {
            // Show preview of response
            $preview = json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            $preview = mb_substr($preview, 0, 300);
            echo "Response preview:\n$preview...\n";
        } else {
            echo "Response preview: " . mb_substr($body, 0, 200) . "...\n";
        }
    } elseif ($status == 404) {
        printError("Status: $status - Not Found");
        echo "Response: $body\n";
    } elseif ($status == 401) {
        printError("Status: $status - Unauthorized");
    } elseif ($status == 403) {
        printError("Status: $status - Forbidden");
    } elseif ($status == 422) {
        printWarning("Status: $status - Validation Error");
        echo "Response: $body\n";
    } else {
        printWarning("Status: $status");
        echo "Response: $body\n";
    }
    
    return $status;
}

// Start testing
printHeader("Course Routes Testing Script");
echo "Base URL: $baseUrl\n";
echo "Admin Email: $adminEmail\n";
echo "Test Course ID: $courseId\n";

// Step 1: Login and get token
printHeader("Step 1: Authentication");
printInfo("Logging in as admin...");

$loginResult = makeRequest('POST', $baseUrl . '/api/login', null, [
    'login' => $adminEmail,  // API expects 'login' not 'email'
    'password' => $adminPassword
]);

if ($loginResult['status'] == 200 || $loginResult['status'] == 201) {
    printSuccess("Login successful!");
    
    $loginData = json_decode($loginResult['body'], true);
    
    if (isset($loginData['token'])) {
        $token = $loginData['token'];
        printSuccess("Token obtained: " . substr($token, 0, 20) . "...");
    } else {
        printError("Failed to extract token from response");
        echo "Response: " . $loginResult['body'] . "\n";
        exit(1);
    }
} else {
    printError("Login failed with status: " . $loginResult['status']);
    echo "Response: " . $loginResult['body'] . "\n";
    exit(1);
}

// Step 2: Test Public Course Routes
printHeader("Step 2: Testing Public Course Routes");

testRoute('GET', "/api/course/$courseId", "Get single course (public)", false, $token);
testRoute('GET', "/api/allCourses", "Get all courses (public)", false, $token);
testRoute('GET', "/api/courses/featured", "Get featured courses (public)", false, $token);
testRoute('GET', "/api/courses/$courseId/reviews", "Get course reviews (public)", false, $token);

// Step 3: Test Authenticated Course Routes
printHeader("Step 3: Testing Authenticated Course Routes");

testRoute('GET', "/api/courseEnroll/$courseId", "Get course for enrollment", true, $token);
testRoute('POST', "/api/courses/$courseId/enroll", "Enroll in course", true, $token, []);
testRoute('GET', "/api/courses/$courseId/progress", "Get course progress", true, $token);
testRoute('GET', "/api/my-enrollments", "Get my enrollments", true, $token);

// Step 4: Test Final Exam Routes
printHeader("Step 4: Testing Final Exam Routes");

testRoute('GET', "/api/courses/$courseId/final-exam/meta", "Get final exam metadata", true, $token);
testRoute('GET', "/api/courses/$courseId/final-exam/attempt/active", "Get active exam attempt", true, $token);
testRoute('GET', "/api/my-tests", "Get my tests", true, $token);

// Step 5: Test Certificate Routes
printHeader("Step 5: Testing Certificate Routes");

testRoute('GET', "/api/courses/$courseId/certificate-status", "Get certificate status", true, $token);
testRoute('GET', "/api/courses/$courseId/certificate/data", "Get certificate data", true, $token);
testRoute('GET', "/api/my-certificates", "Get my certificates", true, $token);

// Step 6: Test Review Routes
printHeader("Step 6: Testing Review Routes (Authenticated)");

testRoute('POST', "/api/courses/$courseId/reviews", "Create review", true, $token, [
    'rating' => 5,
    'comment' => 'Test review from automated script'
]);

// Step 7: Test Admin Course Routes
printHeader("Step 7: Testing Admin Course Routes");

testRoute('GET', "/api/admin/courses", "Get all courses (admin)", true, $token);
testRoute('GET', "/api/admin/course/$courseId", "Get single course (admin)", true, $token);
testRoute('GET', "/api/admin/courses/$courseId", "Get course details (admin)", true, $token);
testRoute('GET', "/api/admin/courses-details", "Get courses details (admin)", true, $token);
testRoute('GET', "/api/admin/courses-not-published", "Get unpublished courses (admin)", true, $token);

// Step 8: Test Admin Chapter Routes
printHeader("Step 8: Testing Admin Chapter Routes");

testRoute('POST', "/api/admin/courses/$courseId/chapters", "Create chapter (admin)", true, $token, [
    'title' => 'Test Chapter from Script',
    'order' => 999
]);

// Summary
printHeader("Testing Complete!");
printInfo("All routes have been tested");
printInfo("Check the output above for any failures");

echo "\n";
echo "Note: Some routes may fail due to business logic (e.g., already enrolled, no certificate available)\n";
echo "404 errors on course routes indicate the original issue is NOT fixed\n";
echo "\n";
