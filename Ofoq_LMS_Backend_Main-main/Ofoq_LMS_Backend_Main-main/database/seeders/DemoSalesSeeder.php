<?php

namespace Database\Seeders;

use App\Models\{CategoryOfCourse, Chapter, Course, Instructors, Lesson, Question, Quiz, Section, User};
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use App\Support\DemoEnvironmentGuard;

/**
 * Explicit-only, deterministic sales dataset for an empty, migrated demo database.
 * It never truncates tables, calls external services, creates files, or modifies rows
 * that do not carry this seeder's deterministic demo identifiers.
 */
class DemoSalesSeeder extends Seeder
{
    private const MARKER = 'OFOQ Sales Demo dataset';
    private const STUDENTS = 800;

    public function run(): void
    {
        DemoEnvironmentGuard::assertLocalDemo();
        $this->assertSchema();
        DB::transaction(function (): void {
            $sections = $this->seedSections();
            $instructors = $this->seedInstructors();
            [$diplomas, $courses] = $this->seedCatalogue($sections, $instructors);
            $this->seedLearningStructure($courses);
            $students = $this->seedStudents();
            $this->seedStudentLearning($students, $diplomas, $courses);
            $this->seedBunnyReports($courses);
        });
    }

    private function assertSchema(): void
    {
        foreach (['users', 'courses', 'category_of_course', 'chapters', 'lessons', 'user_courses', 'user_lesson_progress'] as $table) {
            if (!Schema::hasTable($table)) {
                throw new \RuntimeException("DemoSalesSeeder requires the migrated '{$table}' table.");
            }
        }
    }

    private function seedSections(): array
    {
        $items = [
            ['name' => 'البرمجة والتقنية', 'icon' => 'code'], ['name' => 'التصميم والإبداع', 'icon' => 'palette'],
            ['name' => 'البيانات والذكاء الاصطناعي', 'icon' => 'chart'], ['name' => 'المهارات الرقمية', 'icon' => 'laptop'],
        ];
        $result = [];
        foreach ($items as $index => $item) {
            $result[] = Section::firstOrCreate(['slug' => 'demo-sales-section-'.($index + 1)], $item + ['is_published' => true, 'display_order' => $index + 1]);
        }
        return $result;
    }

    private function seedInstructors(): array
    {
        $items = [
            ['د. خالد عبد الله', 'تطوير الويب'], ['م. سارة إبراهيم', 'البرمجة بلغة Python'], ['م. ياسر محمود', 'Front-End Development'],
            ['د. هبة السيد', 'قواعد البيانات'], ['م. ندى عادل', 'UI/UX'], ['م. عمر حمدي', 'تحليل البيانات'],
            ['د. ريم مصطفى', 'الذكاء الاصطناعي'], ['م. أحمد السالمي', 'الأمن السيبراني'], ['م. ليلى خالد', 'المهارات الرقمية'],
        ];
        $result = [];
        foreach ($items as $index => [$name, $title]) {
            $result[] = Instructors::firstOrCreate(['email' => "instructor{$index}@demo.ofoq.local"], [
                'name' => $name, 'title' => $title, 'bio' => "مدرب متخصص في {$title} بخبرة عملية في التعليم الرقمي.", 'rating' => 4.6,
            ]);
        }
        return $result;
    }

    private function seedCatalogue(array $sections, array $instructors): array
    {
        $diplomaData = [
            ['دبلومة تطوير الويب الشامل', 'مسار احترافي لبناء تطبيقات ويب حديثة من الواجهة إلى الخادم.', 0],
            ['دبلومة البرمجة بلغة Python', 'برنامج عملي يبدأ بالأساسيات وينتهي بمشاريع قابلة للتطبيق.', 0],
            ['دبلومة تصميم واجهات وتجربة المستخدم', 'تعلّم تصميم منتجات رقمية مفهومة وجميلة وقابلة للاستخدام.', 1],
            ['دبلومة تحليل البيانات', 'مسار تطبيقي لاستخراج القرار من البيانات باستخدام أدوات حديثة.', 2],
            ['دبلومة المهارات الرقمية والذكاء الاصطناعي', 'مهارات عملية للإنتاجية وتطبيقات الذكاء الاصطناعي.', 3],
        ];
        $diplomas = [];
        foreach ($diplomaData as $i => [$name, $description, $section]) {
            $attributes = [
                'name' => $name,
                'description' => $description.' '.self::MARKER,
                'section_id' => $sections[$section]->id,
                'is_published' => true,
                'is_free' => false,
                'price' => 1499 + $i * 200,
                'display_order' => $i + 1,
                'total_views' => 1200 + $i * 180,
            ];

            // Do not key this by a slug that the model's Arabic slug observer
            // replaces on create. The marker plus name is the stable identity
            // of this seeder's records and prevents repeated runs creating
            // empty, suffixed diploma duplicates.
            $diploma = CategoryOfCourse::query()
                ->where('name', $name)
                ->where('description', 'like', '%'.self::MARKER.'%')
                ->withCount('courses')
                ->orderByDesc('courses_count')
                ->orderBy('id')
                ->first();

            if ($diploma) {
                $diploma->fill($attributes);
                $diploma->save();
            } else {
                $diploma = CategoryOfCourse::create($attributes);
            }

            $diplomas[] = $diploma;
        }
        $courseNames = [
            ['HTML وCSS لبناء صفحات احترافية',0], ['JavaScript وتطبيقات الويب التفاعلية',0], ['React لتطوير الواجهات الحديثة',0], ['Laravel وبناء واجهات API',0],
            ['أساسيات البرمجة بلغة Python',1], ['البرمجة الكائنية في Python',1], ['قواعد البيانات باستخدام Python',1], ['مشاريع Python تطبيقية',1],
            ['أساسيات تصميم الواجهات',2], ['UX Research وتصميم الرحلات',2], ['Figma للمصممين',2], ['بناء Design Systems',2],
            ['Excel لتحليل البيانات',3], ['SQL للمحللين',3], ['Python لتحليل البيانات',3], ['تصور البيانات واتخاذ القرار',3],
            ['الإنتاجية الرقمية الحديثة',4], ['أساسيات الذكاء الاصطناعي',4], ['هندسة الأوامر العملية',4], ['أدوات الذكاء الاصطناعي للعمل',4],
        ];
        $courses = [];
        foreach ($courseNames as $i => [$title, $diplomaIndex]) {
            $diploma = $diplomas[$diplomaIndex];
            $course = Course::withoutGlobalScopes()->where('title', $title)->where('description', 'like', '%'.self::MARKER.'%')->first();
            if (!$course) {
                $course = Course::create([
                    'title' => $title, 'description' => "مقرر عملي ضمن {$diploma->name}. ".self::MARKER,
                    'price' => $i % 5 === 0 ? 0 : 299 + ($i % 4) * 75, 'is_free' => $i % 5 === 0,
                    'is_published' => $i < 18, 'duration' => 18 + ($i % 5) * 4, 'hours_count' => 18 + ($i % 5) * 4,
                    'rating' => 4.3 + ($i % 5) / 10, 'instructor_id' => $instructors[$i % count($instructors)]->id,
                    'category_id' => $diploma->id, 'section_id' => $diploma->section_id, 'students_count' => 80 + ($i * 13),
                    'chapters_count' => 3, 'reviews_count' => 12 + ($i % 8), 'total_views' => 400 + $i * 75,
                ]);
            }
            $courses[] = $course;
        }
        return [$diplomas, $courses];
    }

    private function seedLearningStructure(array $courses): void
    {
        foreach ($courses as $courseIndex => $course) {
            $chapters = [];
            foreach (['المفاهيم الأساسية', 'التطبيق العملي', 'مشروع ومهارات متقدمة'] as $chapterIndex => $label) {
                $chapter = Chapter::firstOrCreate(['course_id' => $course->id, 'order' => $chapterIndex + 1], [
                    'title' => $label.' في '.$course->title, 'description' => 'محتوى تدريبي منظم يجمع الشرح والتطبيق.',
                ]);
                $chapters[] = $chapter;
                foreach (['مدخل إلى الموضوع', 'المفاهيم والأدوات', 'تطبيق عملي', 'مراجعة ومهام'] as $lessonIndex => $lessonTitle) {
                    $lesson = Lesson::firstOrCreate(['chapter_id' => $chapter->id, 'order' => $lessonIndex + 1], [
                        'title' => $lessonTitle.' — '.$course->title, 'content' => 'شرح تدريبي عملي مع أمثلة ومهام قابلة للتنفيذ.',
                        'is_visible' => true, 'duration_seconds' => 900 + $lessonIndex * 240, 'duration_source' => 'demo_seed',
                        'video_status' => 'ready', 'video_guid' => sprintf('demo-%03d-%02d-%02d', $courseIndex + 1, $chapterIndex + 1, $lessonIndex + 1),
                        'views' => 120 + $courseIndex * 9 + $lessonIndex * 13,
                    ]);
                    if ($lessonIndex === 2) $this->seedLessonQuiz($lesson);
                }
            }
            $final = Quiz::where('quizzable_type', Course::class)->where('quizzable_id', $course->id)->where('is_final', true)->first();
            if ($final) $this->seedQuestions($final, 6, $course->title);
        }
    }

    private function seedLessonQuiz(Lesson $lesson): void
    {
        $quiz = Quiz::firstOrCreate(['quizzable_type' => Lesson::class, 'quizzable_id' => $lesson->id], ['title' => 'تقييم '.$lesson->title, 'is_final' => false]);
        $this->seedQuestions($quiz, 4, $lesson->title);
    }

    private function seedQuestions(Quiz $quiz, int $count, string $subject): void
    {
        for ($i = 1; $i <= $count; $i++) {
            Question::firstOrCreate(['quiz_id' => $quiz->id, 'question' => "سؤال تطبيقي {$i} في {$subject}"], [
                'options' => ['المفهوم الصحيح', 'خيار غير دقيق', 'تطبيق غير مناسب', 'معلومة غير مرتبطة'], 'correct_answer' => '0',
                'explanation' => 'الإجابة الأولى تمثل التطبيق الصحيح للمفهوم المشروح.',
            ]);
        }
    }

    private function seedStudents(): array
    {
        $names = ['أحمد محمد علي','سارة محمود حسن','يوسف خالد إبراهيم','مريم أحمد مصطفى','عمر طارق السيد','نورهان محمد علي','عبد الرحمن سامح','سلمى أحمد عمر','رنا خالد','خالد يوسف','ليان أحمد','محمد الزهراني'];
        $countries = ['مصر','مصر','مصر','السعودية','السعودية','الإمارات','الأردن','الكويت','قطر','البحرين','عمان','المغرب','الجزائر','تونس','العراق'];
        $password = Hash::make('demo-internal-only');
        $result = [];
        for ($i = 1; $i <= self::STUDENTS; $i++) {
            $registered = now()->subDays(15 + (($i * 17) % 240));
            $email = sprintf('student%03d@demo.ofoq.local', $i);
            $phone = sprintf('+2010%07d', $i);

            // A designated showcase student may deliberately be given a
            // stable public-facing email while retaining this original phone.
            // Treat either deterministic identity as the same seeded person;
            // never try to recreate it and violate the unique phone index.
            $student = User::query()
                ->where('email', $email)
                ->orWhere('phone', $phone)
                ->first();

            if (! $student) {
                $student = User::create([
                    'email' => $email,
                    'name' => $names[($i - 1) % count($names)].' '.(($i - 1) % 37 + 1),
                    'password' => $password,
                    'role' => 'student',
                    'phone' => $phone,
                    'nationality' => $countries[($i - 1) % count($countries)],
                    'qualification' => 'بكالوريوس',
                    'created_at' => $registered,
                    'updated_at' => $registered,
                ]);
            }

            $result[] = $student;
        }
        return $result;
    }

    private function seedStudentLearning(array $students, array $diplomas, array $courses): void
    {
        $lessonCache = [];
        foreach ($courses as $course) $lessonCache[$course->id] = Lesson::whereHas('chapter', fn ($q) => $q->where('course_id', $course->id))->orderBy('id')->get();
        $now = now();
        foreach ($students as $index => $student) {
            $group = $index % 100; // 20% completed, 24% high, 28% medium, 18% early, 10% inactive
            $progress = $group < 20 ? 100 : ($group < 44 ? 70 + ($index % 26) : ($group < 72 ? 35 + ($index % 35) : ($group < 90 ? 5 + ($index % 30) : 0)));
            $course = $courses[$index % 18];
            $enrolledAt = $now->copy()->subDays(10 + (($index * 11) % 230));
            $enrollment = DB::table('user_courses')->where('user_id', $student->id)->where('course_id', $course->id)->first();
            if (!$enrollment) DB::table('user_courses')->insert(['user_id' => $student->id, 'course_id' => $course->id, 'status' => $progress === 100 ? 'completed' : 'active', 'progress_percentage' => $progress, 'final_exam_score' => $progress === 100 ? 78 + ($index % 20) : null, 'completed_at' => $progress === 100 ? $enrolledAt->copy()->addDays(25) : null, 'created_at' => $enrolledAt, 'updated_at' => $now]);
            if ($index % 3 !== 0 && Schema::hasTable('user_category_enrollments')) {
                $diploma = $diplomas[$index % count($diplomas)];
                DB::table('user_category_enrollments')->updateOrInsert(['user_id' => $student->id, 'category_id' => $diploma->id], ['status' => $progress === 100 ? 'completed' : 'active', 'completed_at' => $progress === 100 ? $now->copy()->subDays($index % 80) : null, 'created_at' => $enrolledAt, 'updated_at' => $now]);
            }
            $lessons = $lessonCache[$course->id]; $completed = (int) floor($lessons->count() * $progress / 100);
            foreach ($lessons->take($completed) as $lessonNumber => $lesson) {
                DB::table('user_lesson_progress')->updateOrInsert(['user_id' => $student->id, 'lesson_id' => $lesson->id], ['status' => 'completed', 'quiz_passed' => true, 'started_at' => $enrolledAt->copy()->addDays($lessonNumber), 'completed_at' => $enrolledAt->copy()->addDays($lessonNumber + 1), 'created_at' => $enrolledAt, 'updated_at' => $now]);
                if ($progress > 0 && Schema::hasTable('video_watch_sessions') && ($lessonNumber < 3 || $index % 5 === 0)) $this->seedWatchSession($student->id, $course, $lesson, $enrolledAt->copy()->addDays($lessonNumber));
            }
            if ($progress === 100) {
                $this->seedCompletedLearningArtifacts($student, $course, $diplomas[$index % count($diplomas)], $index, $enrolledAt);
            }
            if ($index % 3 === 0) DB::table('user_favorite_courses')->updateOrInsert(['user_id' => $student->id, 'course_id' => $courses[($index + 3) % count($courses)]->id], ['created_at' => $enrolledAt, 'updated_at' => $now]);
        }
        $this->seedQuizAttemptQuestions();
    }

    /** The current pivot schema stores relations only; it has no answer/correctness columns. */
    private function seedQuizAttemptQuestions(): void
    {
        if (!Schema::hasTable('user_quiz_attempt_questions')) return;

        DB::table('user_quizzes_attempts')->orderBy('id')->eachById(function (object $attempt): void {
            $questions = DB::table('questions')->where('quiz_id', $attempt->quiz_id)->orderBy('id')->get();
            foreach ($questions as $question) {
                DB::table('user_quiz_attempt_questions')->updateOrInsert([
                    'user_quiz_attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                ], [
                    'created_at' => $attempt->created_at ?? now(),
                    'updated_at' => $attempt->updated_at ?? now(),
                ]);
            }
        });
    }

    private function seedCompletedLearningArtifacts(User $student, Course $course, CategoryOfCourse $diploma, int $index, Carbon $date): void
    {
        $finalQuiz = Quiz::where('quizzable_type', Course::class)->where('quizzable_id', $course->id)->where('is_final', true)->first();
        if ($finalQuiz && Schema::hasTable('user_quizzes_attempts')) {
            DB::table('user_quizzes_attempts')->updateOrInsert(['user_id' => $student->id, 'quiz_id' => $finalQuiz->id], [
                'score' => 78 + ($index % 20), 'total_questions' => 6, 'correct_answers' => 5 + ($index % 2), 'answers' => json_encode([]),
                'time_taken' => 840, 'passed' => true, 'status' => 'submitted', 'start_time' => $date->copy()->addDays(20), 'created_at' => $date->copy()->addDays(20), 'updated_at' => $date->copy()->addDays(20),
            ]);
        }
        if (Schema::hasTable('course_certificates')) {
            DB::table('course_certificates')->updateOrInsert(['serial_number' => sprintf('OFOQ-C-%04d', $index + 1)], [
                'user_id' => $student->id, 'course_id' => $course->id, 'status' => 'issued', 'verification_token' => (string) Str::uuid(),
                'certificate_data' => json_encode(['student_name' => $student->name, 'course_title' => $course->title, 'issued_for' => 'demo']), 'created_at' => $date->copy()->addDays(22), 'updated_at' => $date->copy()->addDays(22),
            ]);
        }
        if ($index < 150 && Schema::hasTable('diploma_certificates') && Schema::hasTable('user_category_enrollments')) {
            $enrollment = DB::table('user_category_enrollments')->where('user_id', $student->id)->where('category_id', $diploma->id)->first();
            if ($enrollment) {
                $serial = sprintf('OFOQ-D-%04d', $index + 1);
                $exists = DB::table('diploma_certificates')->where('serial_number', $serial)
                    ->orWhere(fn ($query) => $query->where('user_id', $student->id)->where('diploma_id', $diploma->id))
                    ->exists();
                if (! $exists) DB::table('diploma_certificates')->insert([
                    'user_id' => $student->id, 'diploma_id' => $diploma->id, 'user_category_enrollment_id' => $enrollment->id, 'student_name' => $student->name, 'serial_number' => $serial, 'verification_token' => (string) Str::uuid(),
                    'certificate_data' => json_encode(['student_name' => $student->name, 'diploma_name' => $diploma->name]), 'issued_at' => $date->copy()->addDays(30), 'created_at' => $date->copy()->addDays(30), 'updated_at' => $date->copy()->addDays(30),
                ]);
            }
        }
        if ($index < 180 && Schema::hasTable('reviews')) {
            DB::table('reviews')->updateOrInsert(['user_id' => $student->id, 'course_id' => $course->id], ['rating' => $index % 10 === 0 ? 4 : 5, 'comment' => 'محتوى منظم وتطبيقات عملية ساعدتني على التقدم بثقة.', 'created_at' => $date->copy()->addDays(18), 'updated_at' => $date->copy()->addDays(18)]);
        }
    }

    private function seedWatchSession(int $userId, Course $course, Lesson $lesson, Carbon $startedAt): void
    {
        $session = DB::table('video_watch_sessions')->where(['user_id' => $userId, 'lesson_id' => $lesson->id])->first();
        if ($session) return;
        $duration = (int) ($lesson->duration_seconds ?: 1200); $watched = (int) ($duration * 0.88);
        $id = DB::table('video_watch_sessions')->insertGetId(['user_id' => $userId, 'lesson_id' => $lesson->id, 'course_id' => $course->id, 'category_id' => $course->category_id, 'video_guid' => $lesson->video_guid, 'started_at' => $startedAt, 'ended_at' => $startedAt->copy()->addSeconds($watched), 'last_event_at' => $startedAt->copy()->addSeconds($watched), 'duration_seconds' => $duration, 'watched_seconds' => $watched, 'max_position_seconds' => $watched, 'completion_percentage' => 88, 'completed' => true, 'completed_at' => $startedAt->copy()->addSeconds($watched), 'created_at' => $startedAt, 'updated_at' => $startedAt]);
        if (Schema::hasTable('video_watch_events')) DB::table('video_watch_events')->insert(['video_watch_session_id' => $id, 'user_id' => $userId, 'lesson_id' => $lesson->id, 'event_type' => 'progress', 'position_seconds' => $watched, 'duration_seconds' => $duration, 'watched_delta_seconds' => $watched, 'playback_rate' => 1, 'metadata' => json_encode(['source' => 'demo_seed']), 'created_at' => $startedAt->copy()->addSeconds($watched)]);
    }

    private function seedBunnyReports(array $courses): void
    {
        if (!Schema::hasTable('bunny_video_stats')) return;
        $lessons = Lesson::whereNotNull('video_guid')->get();
        foreach ($lessons as $i => $lesson) DB::table('bunny_video_stats')->updateOrInsert(['video_guid' => $lesson->video_guid], ['lesson_id' => $lesson->id, 'title' => $lesson->title, 'status_code' => 4, 'status_label' => 'finished', 'duration_seconds' => $lesson->duration_seconds, 'storage_size_bytes' => 180000000 + $i * 1200000, 'views' => 180 + $i * 9, 'average_watch_time_seconds' => 720, 'total_watch_time_seconds' => 129600 + $i * 3600, 'data_source' => 'demo_seed_local', 'accuracy_level' => 'demo', 'sync_status' => 'synced', 'last_synced_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
        $storage = (int) DB::table('bunny_video_stats')->sum('storage_size_bytes');
        if (Schema::hasTable('bunny_usage_snapshots')) {
            for ($month = 7; $month >= 0; $month--) {
                $periodStart = now()->startOfMonth()->subMonths($month);
                $growth = 0.45 + (7 - $month) * 0.11;
                DB::table('bunny_usage_snapshots')->updateOrInsert(['data_source' => 'demo_seed_local', 'metric_type' => 'library_stream_'. $periodStart->format('Ym')], ['period_start' => $periodStart, 'period_end' => $periodStart->copy()->endOfMonth(), 'hourly' => false, 'total_views' => (int) (18750 * $growth), 'total_watch_time_seconds' => (int) (2844000 * $growth), 'total_storage_size_bytes' => (int) ($storage * (0.55 + (7 - $month) * 0.06)), 'traffic_usage_bytes' => (int) (42000000000 * $growth), 'storage_usage_bytes' => (int) ($storage * (0.55 + (7 - $month) * 0.06)), 'bandwidth_bytes' => (int) (42000000000 * $growth), 'requests_count' => (int) (68400 * $growth), 'accuracy_level' => 'demo', 'sync_status' => 'synced', 'views_chart' => json_encode([]), 'watch_time_chart' => json_encode([]), 'last_synced_at' => $periodStart->copy()->endOfMonth(), 'created_at' => $periodStart, 'updated_at' => now()]);
            }
        }
        if (Schema::hasTable('bunny_cost_settings') && Schema::hasTable('bunny_cost_snapshots')) {
            for ($month = 7; $month >= 0; $month--) {
                $periodStart = now()->startOfMonth()->subMonths($month); $growth = 0.55 + (7 - $month) * 0.06;
                DB::table('bunny_cost_settings')->updateOrInsert(['data_source' => 'demo_seed_local', 'effective_from' => $periodStart->toDateString()], ['bandwidth_cost_per_gb' => 0.01, 'storage_cost_per_gb_month' => 0.02, 'fixed_monthly_cost' => 5, 'currency' => 'USD', 'is_active' => $month === 0, 'accuracy_level' => 'demo', 'created_at' => $periodStart, 'updated_at' => now()]);
                $settingId = DB::table('bunny_cost_settings')->where('data_source', 'demo_seed_local')->where('effective_from', $periodStart->toDateString())->value('id');
                $storageForPeriod = (int) ($storage * $growth); $bandwidth = (int) (42000000000 * $growth);
                DB::table('bunny_cost_snapshots')->updateOrInsert(['data_source' => 'demo_seed_local', 'bunny_cost_setting_id' => $settingId], ['period_start' => $periodStart, 'period_end' => $periodStart->copy()->endOfMonth(), 'storage_bytes' => $storageForPeriod, 'bandwidth_bytes' => $bandwidth, 'storage_cost' => round($storageForPeriod / 1073741824 * 0.02, 6), 'bandwidth_cost' => round($bandwidth / 1073741824 * 0.01, 6), 'fixed_cost' => 5, 'total_estimated_cost' => round($storageForPeriod / 1073741824 * 0.02 + $bandwidth / 1073741824 * 0.01 + 5, 6), 'currency' => 'USD', 'cost_status' => 'estimated', 'accuracy_level' => 'demo', 'last_synced_at' => $periodStart->copy()->endOfMonth(), 'created_at' => $periodStart, 'updated_at' => now()]);
            }
        }
        if (Schema::hasTable('bunny_video_usage_snapshots')) {
            foreach (DB::table('bunny_video_stats')->orderByDesc('views')->limit(12)->get() as $rank => $video) for ($month = 7; $month >= 0; $month--) {
                $periodStart = now()->startOfMonth()->subMonths($month); $growth = 0.4 + (7 - $month) * 0.1; $weight = 1.35 - $rank * 0.06;
                DB::table('bunny_video_usage_snapshots')->updateOrInsert(['video_guid' => $video->video_guid, 'period_start' => $periodStart], ['lesson_id' => $video->lesson_id, 'period_end' => $periodStart->copy()->endOfMonth(), 'hourly' => false, 'total_views' => (int) max(1, $video->views * $growth * $weight), 'total_watch_time_seconds' => (int) max(60, $video->total_watch_time_seconds * $growth * $weight), 'engagement_score' => round(74 + ($rank % 5) * 4, 2), 'data_source' => 'demo_seed_local', 'metric_type' => 'video_stream_statistics', 'accuracy_level' => 'demo', 'sync_status' => 'synced', 'views_chart' => json_encode([]), 'watch_time_chart' => json_encode([]), 'last_synced_at' => $periodStart->copy()->endOfMonth(), 'created_at' => $periodStart, 'updated_at' => now()]);
            }
        }
        if (Schema::hasTable('bunny_sync_logs')) {
            foreach ([['completed', 7], ['completed', 3], ['failed', 28], ['completed', 1]] as [$status, $days]) { $started = now()->subDays($days); DB::table('bunny_sync_logs')->updateOrInsert(['sync_type' => 'video_details', 'started_at' => $started], ['status' => $status, 'dry_run' => false, 'limit' => 50, 'processed_count' => 60, 'succeeded_count' => $status === 'completed' ? 60 : 57, 'failed_count' => $status === 'completed' ? 0 : 3, 'message' => $status === 'completed' ? 'تمت المزامنة بنجاح' : 'فشل محدود في مزامنة بعض السجلات', 'finished_at' => $started->copy()->addMinutes(3), 'duration_ms' => 180000, 'created_at' => $started, 'updated_at' => now()]); }
        }
    }
}
