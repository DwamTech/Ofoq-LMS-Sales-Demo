<?php

namespace App\Jobs;

use App\Models\CourseCertificate;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Spatie\Browsershot\Browsershot;

class GenerateCertificateJob implements ShouldQueue
{
    use Queueable;

    protected $certificate;

    /**
     * Create a new job instance.
     */
    public function __construct(CourseCertificate $certificate)
    {
        $this->certificate = $certificate;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Starting certificate generation', ['certificate_id' => $this->certificate->id]);
            
            // 1. Gather data (student name, course name, dates, etc.)
            $user = $this->certificate->user;
            $course = $this->certificate->course;

            if (!$user || !$course) {
                throw new \Exception('User or Course not found');
            }

            Log::info('Data gathered', ['user' => $user->name, 'course' => $course->title]);

            // 2. Generate or reuse unique serial number (random but unique)
            $serial = $this->certificate->serial_number;
            if (empty($serial)) {
                // Count existing certificates to determine if we need 7 digits
                $totalCerts = \App\Models\Certificate::count() 
                    + \App\Models\DiplomaCertificate::count()
                    + CourseCertificate::count();

                // If we've used most of 5-digit space (99999), switch to 7 digits
                $useSevenDigits = $totalCerts >= 90000;

                do {
                    if ($useSevenDigits) {
                        $random = mt_rand(100000, 9999999);
                        $serial = str_pad($random, 7, '0', STR_PAD_LEFT);
                    } else {
                        $random = mt_rand(1, 99999);
                        $serial = str_pad($random, 5, '0', STR_PAD_LEFT);
                    }
                } while (
                    \App\Models\Certificate::where('serial_number', $serial)->exists() ||
                    \App\Models\DiplomaCertificate::where('serial_number', $serial)->exists() ||
                    CourseCertificate::where('serial_number', $serial)->exists()
                );

                // Persist serial early to keep DB and PDF consistent
                $this->certificate->serial_number = $serial;
            }

            // 2.a Ensure a stable verification token exists before generating PDF
            $token = $this->certificate->verification_token;
            if (empty($token)) {
                $token = (string) Str::uuid();
                $this->certificate->verification_token = $token;
            }
            // Save early so QR/verification in PDF matches DB
            $this->certificate->save();
            
            Log::info('Serial generated', ['serial' => $serial]);

            // Get course hours (using hours_count field)
            $course_hours = $course->hours_count ?? 0;
            // Get lectures count from lessons relation
            $lectures_count = $course->lessons()->count();
            
            // Get diploma name through category (if available)
            $diploma_name = null;
            if ($course->category) {
                $diploma_name = $course->category->name;
            }

            // 2. تجميع البيانات (بدون معالجة عربية - Browsershot هتتعامل معاها)
            $certificateData = [
                'student_name' => $user->name,
                'course_name' => $course->title,
                'course_title' => $course->title, // Keep for backward compatibility
                'completion_date' => $this->certificate->updated_at->format('j F Y'),
                'course_hours' => $course_hours . ' ساعات تدريبية',
                'lectures_count' => $lectures_count,
                'diploma_name' => $diploma_name ?? 'دبلومة عامة',
                'serial_number' => $serial,
                'verification_token' => $token,
                'issued_date' => now()->format('F d, Y'),
                'h1_text' => 'شهادة إتمام الدورة التدريبية',
                'p1_text' => 'قد حضر المقرر الدراسي',
                'p2_line1_text' => 'ضمن دبلومة ' . ($diploma_name ?? ''),
                'p2_line2_text' => 'وقد اجتاز الاختبار بنجاح',
                'p2_line3_text' => 'وهذه شهادة منا بذلك سائلين المولي عز وجل له دوام التوفيق والسداد',
                'footer_text' => 'أكمل بتاريخ',
                'title_text' => 'شهادة',
            ];

            // --- QR Code Generation ---
            // Generate verification URL with serial number
            $verificationUrl = 'https://www.ofuq.academy/verify-certificate?s=' . $serial;
            
            // --- QR Code Generation ---
            // Generate verification URL with serial number
            $verificationUrl = 'https://www.ofuq.academy/verify-certificate?s=' . $serial;
            
            // Generate QR Code using QR Server API (Google Charts is deprecated/unreliable)
            $qrApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verificationUrl);
            
            try {
                // Use Laravel Http client for better reliability and debugging
                $response = Http::timeout(10)->get($qrApiUrl);
                
                if ($response->successful()) {
                    $certificateData['qrCodeBase64'] = 'data:image/png;base64,' . base64_encode($response->body());
                } else {
                    Log::error('Failed to generate QR code from QR Server API. Status: ' . $response->status());
                    $certificateData['qrCodeBase64'] = '';
                }
            } catch (\Exception $qrEx) {
                Log::error('QR code generation failed (Exception): ' . $qrEx->getMessage());
                $certificateData['qrCodeBase64'] = '';
            }
            // --- End QR Code Generation ---


            // --- بداية التعديل المصحح ---
            // 1. وضع قيمة افتراضية للمتغير لتجنب خطأ Undefined Variable في حالة عدم وجود الصورة
            $certificateData['backgroundImageBase64'] = '';

            // 2. تحديد مسار الصورة (بالاسم الذي أكدته)
            $imagePath = public_path('storage/certifecate_cover.jpg');

            // 3. التحقق والقراءة
            if (file_exists($imagePath) && is_readable($imagePath)) {
                $imageData = base64_encode(file_get_contents($imagePath));
                $certificateData['backgroundImageBase64'] = 'data:image/jpeg;base64,' . $imageData;
            } else {
                Log::warning('Certificate background image missing or unreadable', ['path' => $imagePath]);
            }
            // --- نهاية التعديل ---

            // Log only essential data without Base64 images to prevent log bloat
            $logData = [
                'student_name' => $certificateData['student_name'],
                'course_name' => $certificateData['course_name'],
                'serial_number' => $certificateData['serial_number'],
                'verification_token' => $certificateData['verification_token'],
                'course_hours' => $certificateData['course_hours'],
                'lectures_count' => $certificateData['lectures_count'],
            ];
            Log::info('Certificate data prepared', $logData);
            // 3. Generate PDF using Browsershot instead of DomPDF

            // [الخطوة الجديدة] تحويل اسم الطالب لاسم مناسب للملفات (slug)
            $student_slug = Str::slug($user->name); 

            // توحيد المسار تحت certificates/courses باستخدام الرقم التسلسلي
            $fileName = 'certificates/courses/' . $serial . '.pdf';
            $fullPath = storage_path('app/public/' . $fileName);

            // تأكيد وجود مجلد الحفظ داخل قرص public قبل توليد الملف
            if (!Storage::disk('public')->exists('certificates/courses')) {
                Storage::disk('public')->makeDirectory('certificates/courses');
            }
            
            $browsershot = Browsershot::html(view('certificates.course_certificate_simple', $certificateData)->render())
                ->showBackground()
                ->landscape()
                ->format('A4')
                ->waitUntilNetworkIdle()
                ->setEnvironmentOptions([
                    'SNAP_NAME' => 'chromium',
                    'SNAP_INSTANCE_NAME' => 'chromium',
                ]);

            // Configure Browsershot from environment (OS-aware + Safety Checks)
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
            $nodeKey = $isWindows ? 'BROWSERSHOT_NODE_PATH_WINDOWS' : 'BROWSERSHOT_NODE_PATH_LINUX';
            $chromeKey = $isWindows ? 'BROWSERSHOT_CHROME_PATH_WINDOWS' : 'BROWSERSHOT_CHROME_PATH_LINUX';

            // Prefer OS-specific keys, fallback to generic keys
            $nodePath = env($nodeKey, env('BROWSERSHOT_NODE_PATH'));
            $chromePath = env($chromeKey, env('BROWSERSHOT_CHROME_PATH'));
            
            // Fallback: Try common Chrome/Chromium paths on Linux
            if (!$isWindows && (empty($chromePath) || !file_exists($chromePath))) {
                $possiblePaths = [
                    '/usr/bin/google-chrome-stable',
                    '/usr/bin/google-chrome',
                    '/usr/bin/chromium-browser',
                    '/usr/bin/chromium',
                    '/snap/bin/chromium',
                    '/home/ofuq-api/htdocs/api.ofuq.academy/storage/browsers/chrome/linux-142.0.7444.61/chrome-linux64/chrome',
                ];
                
                foreach ($possiblePaths as $path) {
                    if (file_exists($path) && is_executable($path)) {
                        $chromePath = $path;
                        Log::info('Auto-detected Chrome path', ['path' => $chromePath]);
                        break;
                    }
                }
            }
            
            $noSandboxDefault = $isWindows ? false : true;
            $noSandbox = env('BROWSERSHOT_NO_SANDBOX', $noSandboxDefault);

            // Log configuration for debugging
            Log::info('Browsershot configuration', [
                'node_path' => $nodePath ?? 'default',
                'chrome_path' => $chromePath ?? 'default',
                'no_sandbox' => $noSandbox,
                'is_windows' => $isWindows,
            ]);

            // Only apply paths if they actually exist on the current machine
            if (!empty($nodePath) && file_exists($nodePath)) {
                $browsershot->setNodeBinary($nodePath);
            }
            if (!empty($chromePath) && file_exists($chromePath)) {
                $browsershot->setChromePath($chromePath);
            }
            if ($noSandbox) {
                $browsershot->noSandbox();
                // Add Linux-friendly chromium args - REMOVED single-process and no-zygote to fix Target closed error
                $browsershot->addChromiumArguments([
                    'disable-setuid-sandbox',
                    'disable-dev-shm-usage',
                    'disable-gpu',
                    'disable-software-rasterizer',
                    'disable-extensions',
                    'no-first-run',
                    'disable-dbus',  // Fix DBus errors
                    'disable-background-networking',
                ]);
            }
            
            // Add timeout and delay to prevent hanging and allow page to load
            $browsershot->timeout(120)->setDelay(1000);

            $browsershot->save($fullPath);
            
            Log::info('PDF generated successfully', ['file_name' => $fileName, 'path' => $fullPath]);

            // 4. Update the record in database (must match PDF values)
            $updateResult = $this->certificate->update([
                'status' => 'completed',
                'file_path' => $fileName,
                'serial_number' => $serial,
                'verification_token' => $token,
            ]);

            Log::info('Database update result', [
                'update_success' => $updateResult,
                'certificate_id' => $this->certificate->id,
                'new_status' => 'completed',
                'file_path' => $fileName,
            ]);

            // Refresh model to verify update
            $this->certificate->refresh();

            Log::info('Certificate generated successfully', [
                'certificate_id' => $this->certificate->id,
                'user_id' => $user->id,
                'course_id' => $course->id,
                'file_path' => $fileName,
                'verified_status' => $this->certificate->status,
                'verified_file_path' => $this->certificate->file_path,
            ]);

        } catch (\Exception $e) {
            // 5. In case of failure
            $debugInfo = [
                'error' => $e->getMessage(),
                'debug_node_path' => $nodePath ?? 'N/A',
                'debug_chrome_path' => $chromePath ?? 'N/A',
                'chrome_exists' => !empty($chromePath) ? (file_exists($chromePath) ? 'YES' : 'NO') : 'N/A',
                'chrome_readable' => !empty($chromePath) ? (is_readable($chromePath) ? 'YES' : 'NO') : 'N/A',
                'chrome_perms' => !empty($chromePath) && file_exists($chromePath) ? substr(sprintf('%o', fileperms($chromePath)), -4) : 'N/A',
                'current_user' => get_current_user() . ' (UID: ' . getmyuid() . ')',
            ];

            $this->certificate->update([
                'status' => 'failed',
                'certificate_data' => $debugInfo
            ]);
            
            Log::error('Certificate Generation Failed: ' . $e->getMessage(), [
                'certificate_id' => $this->certificate->id,
                'debug_info' => $debugInfo,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
