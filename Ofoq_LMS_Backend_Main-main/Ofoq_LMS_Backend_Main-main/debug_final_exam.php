<?php
/**
 * Debug Script for Final Exam 404 Issue
 * 
 * This script will:
 * 1. Login with the provided credentials
 * 2. Get authentication token
 * 3. Check course and final exam existence
 * 4. Check user enrollment and eligibility
 * 5. Check for active attempts
 * 6. Check cooldown/timer restrictions
 * 7. Generate detailed diagnostic report
 */

// Configuration
$baseUrl = 'https://back.ofuq.academy/api';
$email = 'student@ofuq.academy';
$password = 'Abdo0101@';
$courseId = 10;

// Colors for terminal output
$colors = [
    'reset' => "\033[0m",
    'red' => "\033[31m",
    'green' => "\033[32m",
    'yellow' => "\033[33m",
    'blue' => "\033[34m",
    'magenta' => "\033[35m",
    'cyan' => "\033[36m",
    'white' => "\033[37m",
    'bold' => "\033[1m",
];

function colorize($text, $color, $bold = false) {
    global $colors;
    $prefix = $bold ? $colors['bold'] : '';
    return $prefix . $colors[$color] . $text . $colors['reset'];
}

function printSection($title) {
    echo "\n" . colorize(str_repeat('=', 80), 'cyan') . "\n";
    echo colorize($title, 'cyan', true) . "\n";
    echo colorize(str_repeat('=', 80), 'cyan') . "\n\n";
}

function printSuccess($message) {
    echo colorize('✓ ', 'green', true) . $message . "\n";
}

function printError($message) {
    echo colorize('✗ ', 'red', true) . $message . "\n";
}

function printWarning($message) {
    echo colorize('⚠ ', 'yellow', true) . $message . "\n";
}

function printInfo($message) {
    echo colorize('ℹ ', 'blue', true) . $message . "\n";
}

function makeRequest($url, $method = 'GET', $data = null, $token = null) {
    $ch = curl_init();
    
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json',
    ];
    
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HEADER, true);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    
    $headers = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'headers' => $headers,
        'body' => json_decode($body, true),
        'raw_body' => $body
    ];
}

// Start diagnostic
echo colorize("\n🔍 Final Exam 404 Diagnostic Tool\n", 'magenta', true);
echo colorize("Course ID: $courseId\n", 'white');
echo colorize("User: $email\n", 'white');
echo colorize("Time: " . date('Y-m-d H:i:s') . "\n", 'white');

// Step 1: Login
printSection('STEP 1: Authentication');
printInfo("Attempting login with credentials...");

$loginResponse = makeRequest(
    "$baseUrl/login",
    'POST',
    ['login' => $email, 'password' => $password]
);

if ($loginResponse['status'] !== 200 && $loginResponse['status'] !== 201) {
    printError("Login failed with status: " . $loginResponse['status']);
    echo "Response: " . json_encode($loginResponse['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    exit(1);
}

$token = $loginResponse['body']['token'] ?? null;
$userId = $loginResponse['body']['user']['id'] ?? null;

if (!$token) {
    printError("No token received from login response");
    exit(1);
}

printSuccess("Login successful!");
printInfo("User ID: $userId");
printInfo("Token: " . substr($token, 0, 20) . "...");

// Step 2: Check Course Existence
printSection('STEP 2: Course Verification');
printInfo("Checking if course $courseId exists...");

$courseResponse = makeRequest("$baseUrl/courses/$courseId", 'GET', null, $token);

if ($courseResponse['status'] === 404) {
    printWarning("Course API returned 404 - checking database directly...");
} elseif ($courseResponse['status'] !== 200) {
    printWarning("Unexpected status when fetching course: " . $courseResponse['status']);
    echo "Response: " . json_encode($courseResponse['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} else {
    $course = $courseResponse['body']['data'] ?? $courseResponse['body'];
    printSuccess("Course exists via API: " . ($course['title'] ?? 'Unknown'));
    printInfo("Course ID: " . ($course['id'] ?? 'N/A'));
    printInfo("Published: " . (($course['is_published'] ?? false) ? 'Yes' : 'No'));
}

// Step 3: Check Final Exam Existence (Direct Database Query)
printSection('STEP 3: Course Database Verification');
printInfo("Checking database for course $courseId...");

// Load Laravel environment
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$courseInDb = DB::table('courses')->where('id', $courseId)->first();

if (!$courseInDb) {
    printError("Course $courseId does NOT exist in database!");
    printError("ROOT CAUSE: Invalid course ID");
    exit(1);
}

printSuccess("Course found in database:");
echo "  - ID: {$courseInDb->id}\n";
echo "  - Title: {$courseInDb->title}\n";
echo "  - Published: " . ($courseInDb->is_published ? 'Yes' : 'No') . "\n";
echo "  - Category ID: " . ($courseInDb->category_id ?? 'N/A') . "\n";

if (!$courseInDb->is_published) {
    printWarning("Course is NOT published - this might cause access issues");
}

// Step 4: Check Final Exam Existence
printSection('STEP 4: Final Exam Verification');
printInfo("Checking database for final exams...");

$finalExams = DB::table('quizzes')
    ->where('quizzable_type', 'App\\Models\\Course')
    ->where('quizzable_id', $courseId)
    ->where('is_final', true)
    ->get();

if ($finalExams->isEmpty()) {
    printError("No final exam found for course $courseId in database!");
    printInfo("Checking quizzes table for this course...");
    
    $allQuizzes = DB::table('quizzes')
        ->where('quizzable_type', 'App\\Models\\Course')
        ->where('quizzable_id', $courseId)
        ->get();
    
    if ($allQuizzes->isEmpty()) {
        printError("No quizzes at all for this course!");
    } else {
        printWarning("Found " . $allQuizzes->count() . " quiz(es) but none marked as final:");
        foreach ($allQuizzes as $quiz) {
            echo "  - Quiz ID: {$quiz->id}, Title: {$quiz->title}, is_final: " . ($quiz->is_final ? 'true' : 'false') . "\n";
        }
    }
    
    printError("ROOT CAUSE: No final exam configured for this course!");
    exit(1);
}

printSuccess("Found " . $finalExams->count() . " final exam(s):");
foreach ($finalExams as $exam) {
    echo "  - Exam ID: {$exam->id}, Title: {$exam->title}\n";
    
    // Check questions
    $questionCount = DB::table('questions')->where('quiz_id', $exam->id)->count();
    printInfo("    Questions: $questionCount");
}

$finalExamIds = $finalExams->pluck('id')->toArray();

// Step 5: Check User Enrollment
printSection('STEP 5: User Enrollment Check');
printInfo("Checking if user $userId is enrolled in course $courseId...");

$enrollment = DB::table('user_courses')
    ->where('user_id', $userId)
    ->where('course_id', $courseId)
    ->first();

if (!$enrollment) {
    printError("User is NOT enrolled in this course!");
    printError("ROOT CAUSE: User must be enrolled to take the final exam");
    exit(1);
}

printSuccess("User is enrolled in the course");
printInfo("Enrollment date: " . $enrollment->created_at);
printInfo("Progress: " . ($enrollment->progress ?? 'N/A') . "%");

// Step 6: Check Active Attempts
printSection('STEP 6: Active Attempt Check');
printInfo("Checking for active attempts...");

$activeAttempt = DB::table('user_quizzes_attempts')
    ->where('user_id', $userId)
    ->whereIn('quiz_id', $finalExamIds)
    ->where('status', 'in_progress')
    ->orderByDesc('start_time')
    ->first();

if ($activeAttempt) {
    printSuccess("Found active attempt!");
    echo "  - Attempt ID: {$activeAttempt->id}\n";
    echo "  - Quiz ID: {$activeAttempt->quiz_id}\n";
    echo "  - Status: {$activeAttempt->status}\n";
    echo "  - Started: {$activeAttempt->start_time}\n";
    
    // Check questions for this attempt
    $attemptQuestions = DB::table('user_quiz_attempt_questions')
        ->where('user_quiz_attempt_id', $activeAttempt->id)
        ->get();
    
    printInfo("Attempt has " . $attemptQuestions->count() . " questions");
} else {
    printWarning("No active attempt found");
}

// Step 7: Check All Attempts (History)
printSection('STEP 7: Attempt History');
printInfo("Checking all previous attempts...");

$allAttempts = DB::table('user_quizzes_attempts')
    ->where('user_id', $userId)
    ->whereIn('quiz_id', $finalExamIds)
    ->orderByDesc('created_at')
    ->get();

if ($allAttempts->isEmpty()) {
    printInfo("No previous attempts found");
} else {
    printInfo("Found " . $allAttempts->count() . " attempt(s):");
    foreach ($allAttempts as $attempt) {
        $statusColor = $attempt->status === 'completed' ? 'green' : ($attempt->status === 'in_progress' ? 'yellow' : 'red');
        echo "  - Attempt ID: {$attempt->id}, Status: " . colorize($attempt->status, $statusColor) . 
             ", Score: " . ($attempt->score ?? 'N/A') . ", Date: {$attempt->created_at}\n";
    }
}

// Step 8: Check Cooldown/Timer
printSection('STEP 8: Cooldown/Timer Check');
printInfo("Checking for cooldown restrictions...");

// Get the last completed attempt - handle missing end_time column
try {
    $lastCompletedAttempt = DB::table('user_quizzes_attempts')
        ->where('user_id', $userId)
        ->whereIn('quiz_id', $finalExamIds)
        ->where('status', 'completed')
        ->orderByDesc('updated_at') // Use updated_at instead of end_time
        ->first();
} catch (\Exception $e) {
    printWarning("Error checking cooldown: " . $e->getMessage());
    printInfo("Attempting alternative query...");
    
    $lastCompletedAttempt = DB::table('user_quizzes_attempts')
        ->where('user_id', $userId)
        ->whereIn('quiz_id', $finalExamIds)
        ->where('status', 'completed')
        ->orderByDesc('id')
        ->first();
}

if ($lastCompletedAttempt) {
    printInfo("Last completed attempt:");
    echo "  - Attempt ID: {$lastCompletedAttempt->id}\n";
    
    // Check which timestamp field exists
    $timestampField = null;
    if (isset($lastCompletedAttempt->end_time)) {
        $timestampField = 'end_time';
        echo "  - Completed at: {$lastCompletedAttempt->end_time}\n";
    } elseif (isset($lastCompletedAttempt->updated_at)) {
        $timestampField = 'updated_at';
        echo "  - Completed at (updated_at): {$lastCompletedAttempt->updated_at}\n";
    } else {
        echo "  - Completed at: Unknown (no timestamp field found)\n";
    }
    
    echo "  - Score: " . ($lastCompletedAttempt->score ?? 'N/A') . "\n";
    
    if ($timestampField) {
        // Check if there's a cooldown
        $endTime = new DateTime($lastCompletedAttempt->$timestampField);
        $now = new DateTime();
        $diff = $now->getTimestamp() - $endTime->getTimestamp();
        
        printInfo("Time since last attempt: " . gmdate('H:i:s', $diff) . " (" . $diff . " seconds)");
        
        // Typical cooldown is 24 hours (86400 seconds)
        $cooldownSeconds = 86400;
        if ($diff < $cooldownSeconds) {
            $remaining = $cooldownSeconds - $diff;
            printWarning("User is in cooldown period!");
            printWarning("Remaining cooldown: " . gmdate('H:i:s', $remaining) . " (" . $remaining . " seconds)");
        } else {
            printSuccess("No cooldown restriction");
        }
    }
} else {
    printInfo("No completed attempts found - user can start exam");
}

// Step 9: Test the Actual Endpoint
printSection('STEP 9: Testing Active Attempt Endpoint');
printInfo("Making request to: $baseUrl/courses/$courseId/final-exam/attempt/active");

$activeAttemptResponse = makeRequest(
    "$baseUrl/courses/$courseId/final-exam/attempt/active",
    'GET',
    null,
    $token
);

echo "\nResponse Status: " . colorize($activeAttemptResponse['status'], 
    $activeAttemptResponse['status'] === 200 ? 'green' : 'red', true) . "\n";

echo "\nResponse Headers:\n";
$headerLines = explode("\n", $activeAttemptResponse['headers']);
foreach ($headerLines as $line) {
    if (stripos($line, 'X-Error-Type') !== false || stripos($line, 'HTTP/') !== false) {
        echo colorize($line, 'yellow') . "\n";
    }
}

echo "\nResponse Body:\n";
echo json_encode($activeAttemptResponse['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";

// Step 10: Test Meta Endpoint
printSection('STEP 10: Testing Meta Endpoint');
printInfo("Making request to: $baseUrl/courses/$courseId/final-exam/meta");

$metaResponse = makeRequest(
    "$baseUrl/courses/$courseId/final-exam/meta",
    'GET',
    null,
    $token
);

echo "\nMeta Response Status: " . colorize($metaResponse['status'], 
    $metaResponse['status'] === 200 ? 'green' : 'red', true) . "\n";

echo "\nMeta Response Body:\n";
echo json_encode($metaResponse['body'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";

// Final Analysis
printSection('FINAL ANALYSIS');

echo "\n" . colorize("DIAGNOSTIC SUMMARY:", 'magenta', true) . "\n\n";

// Issue 1: Course API returns 404
if ($courseResponse['status'] === 404) {
    printError("ISSUE 1: Course API returns 404 despite course existing in database");
    printInfo("Possible causes:");
    echo "  - Course visibility/access control issue\n";
    echo "  - API route or controller problem\n";
    echo "  - Middleware blocking access\n";
    echo "  - User doesn't have permission to view this course\n";
    printInfo("RECOMMENDATION: Check CourseController and course access policies");
}

if ($activeAttemptResponse['status'] === 404) {
    $errorType = $activeAttemptResponse['body']['error_type'] ?? 'unknown';
    $message = $activeAttemptResponse['body']['message'] ?? 'Unknown error';
    
    printError("ISSUE 2: Active Attempt Endpoint returned 404");
    printInfo("Error Type: $errorType");
    printInfo("Message: $message");
    
    echo "\n" . colorize("ROOT CAUSE ANALYSIS:", 'magenta', true) . "\n";
    
    if ($errorType === 'no_active_attempt') {
        printSuccess("This is EXPECTED behavior - user has no active attempt");
        printInfo("The frontend should handle this by:");
        echo "  1. Checking the meta endpoint for eligibility\n";
        echo "  2. If eligible, starting a new exam attempt\n";
        echo "  3. If not eligible (cooldown), showing appropriate message\n";
        
        if ($metaResponse['status'] === 200) {
            $meta = $metaResponse['body']['data'] ?? $metaResponse['body'];
            $isAllowed = $meta['is_allowed_now'] ?? false;
            $eligible = $meta['eligible_to_start'] ?? true;
            
            if ($isAllowed && $eligible) {
                printSuccess("User IS eligible to start a new exam");
                printInfo("Frontend should call: POST $baseUrl/courses/$courseId/final-exam/start");
            } else {
                printWarning("User is NOT eligible to start exam right now");
                if (isset($meta['remaining_cooldown_seconds'])) {
                    printWarning("Cooldown remaining: " . $meta['remaining_cooldown_seconds'] . " seconds");
                }
                if (isset($meta['next_allowed_at'])) {
                    printWarning("Next allowed at: " . $meta['next_allowed_at']);
                }
            }
        } else {
            printError("Meta endpoint also failed with status: " . $metaResponse['status']);
            printInfo("This suggests a deeper issue with the final exam system");
        }
    } elseif ($errorType === 'no_final_exam') {
        printError("ROOT CAUSE: No final exam configured for this course");
        printError("SOLUTION: Admin needs to create a final exam for course $courseId");
    } elseif ($errorType === 'course_not_found') {
        printError("ROOT CAUSE: Course not found by the endpoint");
        printError("SOLUTION: Verify course ID is correct and course is accessible");
    } else {
        printWarning("Unknown error type: $errorType");
    }
    
    // Additional analysis based on what we found
    echo "\n" . colorize("ADDITIONAL FINDINGS:", 'cyan', true) . "\n";
    
    if ($courseResponse['status'] === 404 && $courseInDb) {
        printWarning("Course exists in DB but API returns 404");
        printInfo("This indicates an access control or routing issue");
        printInfo("Check: CourseController, policies, and middleware");
    }
    
    if (!$courseInDb->is_published) {
        printWarning("Course is unpublished - this may affect access");
    }
    
    if (empty($allAttempts)) {
        printInfo("User has never attempted this exam before");
        printInfo("This should be a fresh start - no cooldown restrictions");
    }
} elseif ($activeAttemptResponse['status'] === 200) {
    printSuccess("Endpoint returned 200 - Active attempt found!");
    $data = $activeAttemptResponse['body']['data'] ?? [];
    printInfo("Attempt ID: " . ($data['attempt_id'] ?? 'N/A'));
    printInfo("Quiz ID: " . ($data['quiz_id'] ?? 'N/A'));
    printInfo("Questions: " . count($data['questions'] ?? []));
} else {
    printError("Unexpected status code: " . $activeAttemptResponse['status']);
}

echo "\n" . colorize(str_repeat('=', 80), 'cyan') . "\n";
echo colorize("Diagnostic Complete", 'cyan', true) . "\n";
echo colorize(str_repeat('=', 80), 'cyan') . "\n\n";
