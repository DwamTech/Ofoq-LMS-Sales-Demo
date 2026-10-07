<?php

namespace App\Jobs;

use App\Models\DiplomaCertificate;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Spatie\Browsershot\Browsershot;

class GenerateDiplomaCertificateJob implements ShouldQueue
{
    use Queueable;

    protected $diplomaCertificate;

    /**
     * Create a new job instance.
     */
    public function __construct(DiplomaCertificate $diplomaCertificate)
    {
        $this->diplomaCertificate = $diplomaCertificate;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Starting diploma certificate generation', ['diploma_certificate_id' => $this->diplomaCertificate->id]);
            
            // 1. Gather data (student name, diploma name, dates, etc.)
            $user = $this->diplomaCertificate->user;
            $diploma = $this->diplomaCertificate->diploma;

            if (!$user || !$diploma) {
                throw new \Exception('User or Diploma not found');
            }

            Log::info('Data gathered', ['user' => $user->name, 'diploma' => $diploma->name]);

            // 2. Reuse existing serial number from record; fallback generate only if missing
            $serial = $this->diplomaCertificate->serial_number;
            if (empty($serial)) {
                Log::warning('Diploma serial_number missing on record; generating fallback serial');
                
                // Count existing certificates to determine if we need 7 digits
                $totalCerts = \App\Models\Certificate::count() 
                    + DiplomaCertificate::count()
                    + \App\Models\CourseCertificate::count();

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
                    DiplomaCertificate::where('serial_number', $serial)->exists() ||
                    \App\Models\CourseCertificate::where('serial_number', $serial)->exists()
                );

                // Persist fallback to avoid mismatch
                $this->diplomaCertificate->serial_number = $serial;
            }

            // 2.a Ensure verification token exists before rendering PDF
            $token = $this->diplomaCertificate->verification_token;
            if (empty($token)) {
                $token = (string) Str::uuid();
                $this->diplomaCertificate->verification_token = $token;
            }
            $this->diplomaCertificate->save();
            
            Log::info('Serial generated', ['serial' => $serial]);

            // Get total courses in this diploma
            $totalCourses = $diploma->courses()->count();
            $coursesText = $totalCourses . ' مقررات تدريبية';

            // 2. تجميع البيانات (بدون معالجة عربية - Browsershot هتتعامل معاها)
            $certificateData = [
                'student_name' => $user->name,
                'diploma_name' => $diploma->name,
                'completion_date' => $this->diplomaCertificate->updated_at->format('j F Y'),
                'total_courses' => $coursesText,
                'serial_number' => $serial,
                'verification_token' => $token,
                'issued_date' => now()->format('F d, Y'),
                'h1_text' => 'شهادة إتمام دبلومة مهنية',
                'p1_text' => 'تشهد منصة أفق أن الطالب',
                'p2_text' => 'قد أتم بنجاح جميع متطلبات',
                'footer_text' => 'تم الاعتماد بتاريخ',
                'title_text' => 'شهادة دبلومة',
            ];

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
                    Log::error('Failed to generate QR code from QR Server API for diploma. Status: ' . $response->status());
                    $certificateData['qrCodeBase64'] = '';
                }
            } catch (\Exception $qrEx) {
                Log::error('Diploma QR code generation failed (Exception): ' . $qrEx->getMessage());
                $certificateData['qrCodeBase64'] = '';
            }
            // --- End QR Code Generation ---

            // --- بداية الكود الجديد ---
            // 1. تحديد مسار الصورة
            $imagePath = public_path('storage/certifecate_cover.jpg');

            // 2. قراءة الصورة وتحويلها لـ Base64 بشكل آمن (تخطي عند عدم توفرها)
            if (is_readable($imagePath)) {
                $imageData = base64_encode(file_get_contents($imagePath));
                // 3. تجهيز الكود الكامل للـ CSS
                $imageBase64 = 'data:image/jpeg;base64,' . $imageData;
                // 4. إضافة الكود للمتغيرات اللي هتروح للـ View
                $certificateData['backgroundImageBase64'] = $imageBase64;
            } else {
                Log::warning('Diploma certificate background image missing or unreadable', ['path' => $imagePath]);
            }

            // 5. تضمين الخطوط (Fonts) كـ Base64 لضمان ظهورها
            $fontRegularPath = public_path('fonts/Cairo-Regular.ttf');
            $fontBoldPath = public_path('fonts/Cairo-Bold.ttf');

            if (is_readable($fontRegularPath)) {
                $fontRegularData = base64_encode(file_get_contents($fontRegularPath));
                $certificateData['fontRegularBase64'] = 'data:font/ttf;base64,' . $fontRegularData;
            } else {
                Log::warning('Cairo-Regular font missing', ['path' => $fontRegularPath]);
            }

            if (is_readable($fontBoldPath)) {
                $fontBoldData = base64_encode(file_get_contents($fontBoldPath));
                $certificateData['fontBoldBase64'] = 'data:font/ttf;base64,' . $fontBoldData;
            } else {
                Log::warning('Cairo-Bold font missing', ['path' => $fontBoldPath]);
            }
            // --- نهاية الكود الجديد ---

            // Log only essential data without Base64 images to prevent log bloat
            $logData = [
                'student_name' => $certificateData['student_name'],
                'diploma_name' => $certificateData['diploma_name'],
                'serial_number' => $certificateData['serial_number'],
                'verification_token' => $certificateData['verification_token'],
                'total_courses' => $certificateData['total_courses'],
            ];
            Log::info('Certificate data prepared', $logData);
            // 3. Generate PDF using Browsershot instead of DomPDF

            // [الخطوة الجديدة] تحويل اسم الطالب لاسم مناسب للملفات (slug)
            $student_slug = Str::slug($user->name); 

            // توحيد المسار تحت certificates/diplomas باستخدام الرقم التسلسلي
            $fileName = 'certificates/diplomas/' . $serial . '.pdf';
            $fullPath = storage_path('app/public/' . $fileName);

            // تأكيد وجود مجلد الحفظ داخل قرص public قبل توليد الملف
            if (!Storage::disk('public')->exists('certificates/diplomas')) {
                Storage::disk('public')->makeDirectory('certificates/diplomas');
            }

            $browsershot = Browsershot::html(view('certificates.diploma_certificate', $certificateData)->render())
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

            // 4. Update the record in database (keep serial and token consistent with PDF)
            $updateResult = $this->diplomaCertificate->update([
                'status' => 'completed',
                'file_path' => $fileName,
                'serial_number' => $serial,
                'verification_token' => $token,
            ]);

            Log::info('Database update result', [
                'update_success' => $updateResult,
                'certificate_id' => $this->diplomaCertificate->id,
                'new_status' => 'completed',
                'file_path' => $fileName,
            ]);

            // Refresh model to verify update
            $this->diplomaCertificate->refresh();
            
            Log::info('Diploma Certificate generated successfully', [
                'diploma_certificate_id' => $this->diplomaCertificate->id,
                'user_id' => $user->id,
                'diploma_id' => $diploma->id,
                'file_path' => $fileName,
                'verified_status' => $this->diplomaCertificate->status,
                'verified_file_path' => $this->diplomaCertificate->file_path,
            ]);

        } catch (\Exception $e) {
            // 5. In case of failure
            $this->diplomaCertificate->update(['status' => 'failed']);
            
            Log::error('Diploma Certificate Generation Failed: ' . $e->getMessage(), [
                'diploma_certificate_id' => $this->diplomaCertificate->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}