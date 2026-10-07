<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Models\UserCourse;
use App\Models\VideoWatchSession;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VideoWatchTrackingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->createMinimalSchema();
        config([
            'video_tracking.enabled' => true,
            'video_tracking.heartbeat_seconds' => 20,
            'video_tracking.completion_threshold' => 85,
            'video_tracking.max_delta_seconds' => 30,
        ]);
    }

    public function test_unauthorized_user_cannot_start_session(): void
    {
        $lesson = $this->createLessonSetup()['lesson'];

        $response = $this->postJson("/api/lessons/{$lesson->id}/watch/start", [
            'duration_seconds' => 100,
        ]);

        $response->assertStatus(401);
    }

    public function test_student_without_lesson_access_cannot_start_session(): void
    {
        $user = User::factory()->create();
        $lesson = $this->createLessonSetup()['lesson'];
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/lessons/{$lesson->id}/watch/start", [
            'duration_seconds' => 100,
        ]);

        $response->assertStatus(403);
    }

    public function test_student_with_access_can_start_session(): void
    {
        $user = User::factory()->create();
        $setup = $this->createLessonSetup($user);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/lessons/{$setup['lesson']->id}/watch/start", [
            'video_guid' => 'video-guid-1',
            'duration_seconds' => 100,
            'position_seconds' => 5,
            'device_id' => 'device-1',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'session_id',
                'current_progress',
                'heartbeat_interval',
                'completed',
                'last_position_seconds',
            ]);

        $this->assertDatabaseHas('video_watch_sessions', [
            'user_id' => $user->id,
            'lesson_id' => $setup['lesson']->id,
            'video_guid' => 'video-guid-1',
        ]);
    }

    public function test_event_is_recorded(): void
    {
        $user = User::factory()->create();
        $session = $this->startSessionFor($user);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/watch-sessions/{$session->id}/events", [
            'event_type' => 'play',
            'position_seconds' => 10,
            'duration_seconds' => 100,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'accepted' => true,
            ]);

        $this->assertDatabaseHas('video_watch_events', [
            'video_watch_session_id' => $session->id,
            'event_type' => 'play',
        ]);
    }

    public function test_seek_does_not_increase_watched_seconds(): void
    {
        $user = User::factory()->create();
        $session = $this->startSessionFor($user);
        $session->update(['last_event_at' => now()->subSeconds(20)]);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/watch-sessions/{$session->id}/events", [
            'event_type' => 'seek',
            'position_seconds' => 80,
            'duration_seconds' => 100,
            'watched_delta_seconds' => 20,
        ]);

        $response->assertStatus(200);
        $session->refresh();

        $this->assertSame(0, (int) $session->watched_seconds);
    }

    public function test_heartbeat_updates_progress(): void
    {
        $user = User::factory()->create();
        $session = $this->startSessionFor($user);
        $session->update(['last_event_at' => now()->subSeconds(20)]);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/watch-sessions/{$session->id}/heartbeat", [
            'position_seconds' => 40,
            'duration_seconds' => 100,
            'is_playing' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('progress_percentage', 40);

        $session->refresh();
        $this->assertGreaterThan(0, (int) $session->watched_seconds);
    }

    public function test_completion_threshold_marks_lesson_completed(): void
    {
        $user = User::factory()->create();
        $session = $this->startSessionFor($user);
        $session->update([
            'watched_seconds' => 85,
            'last_event_at' => now()->subSeconds(20),
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/watch-sessions/{$session->id}/events", [
            'event_type' => 'progress',
            'position_seconds' => 90,
            'duration_seconds' => 100,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('completed', true);

        $this->assertDatabaseHas('user_lesson_progress', [
            'user_id' => $user->id,
            'lesson_id' => $session->lesson_id,
            'status' => 'completed',
            'completion_source' => 'tracking',
        ]);
    }

    public function test_user_cannot_send_event_to_another_users_session(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $session = $this->startSessionFor($owner);
        Sanctum::actingAs($otherUser);

        $response = $this->postJson("/api/watch-sessions/{$session->id}/events", [
            'event_type' => 'play',
            'position_seconds' => 10,
        ]);

        $response->assertStatus(404);
    }

    public function test_old_complete_endpoint_still_works(): void
    {
        $user = User::factory()->create();
        $setup = $this->createLessonSetup($user);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/lessons/{$setup['lesson']->id}/complete");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'progress' => [
                    'status',
                    'started_at',
                    'completed_at',
                ],
            ]);

        $this->assertDatabaseHas('user_lesson_progress', [
            'user_id' => $user->id,
            'lesson_id' => $setup['lesson']->id,
            'status' => 'completed',
        ]);
    }

    private function startSessionFor(User $user): VideoWatchSession
    {
        $setup = $this->createLessonSetup($user);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/lessons/{$setup['lesson']->id}/watch/start", [
            'video_guid' => 'video-guid-1',
            'duration_seconds' => 100,
        ]);

        $response->assertStatus(200);

        return VideoWatchSession::findOrFail($response->json('session_id'));
    }

    private function createLessonSetup(?User $user = null): array
    {
        $course = Course::withoutEvents(fn () => Course::create([
            'title' => 'Tracking Course',
            'description' => 'Tracking course description',
            'price' => 0,
            'is_free' => true,
            'is_published' => true,
            'total_views' => 0,
        ]));

        $chapter = Chapter::create([
            'course_id' => $course->id,
            'title' => 'Tracking Chapter',
            'order' => 1,
        ]);

        $lesson = Lesson::create([
            'chapter_id' => $chapter->id,
            'title' => 'Tracking Lesson',
            'content' => 'Tracking lesson content',
            'order' => 1,
            'video_guid' => 'video-guid-1',
            'views' => 0,
        ]);

        if ($user) {
            UserCourse::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'status' => 'in_progress',
                'progress_percentage' => 0,
            ]);
        }

        return [
            'course' => $course,
            'chapter' => $chapter,
            'lesson' => $lesson,
        ];
    }

    private function createMinimalSchema(): void
    {
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->string('role')->default('student');
                $table->rememberToken();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->string('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('category_of_course')) {
            Schema::create('category_of_course', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->nullable();
                $table->integer('total_views')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('courses')) {
            Schema::create('courses', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->foreignId('category_id')->nullable();
                $table->boolean('is_published')->default(true);
                $table->integer('total_views')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('chapters')) {
            Schema::create('chapters', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id');
                $table->string('title');
                $table->integer('order')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('lessons')) {
            Schema::create('lessons', function (Blueprint $table) {
                $table->id();
                $table->foreignId('chapter_id');
                $table->string('title');
                $table->integer('order')->default(0);
                $table->string('video_guid')->nullable();
                $table->integer('views')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('user_courses')) {
            Schema::create('user_courses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id');
                $table->foreignId('course_id');
                $table->string('status')->default('in_progress');
                $table->decimal('progress_percentage', 5, 2)->default(0);
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('user_category_enrollments')) {
            Schema::create('user_category_enrollments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id');
                $table->foreignId('category_id');
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('user_lesson_progress')) {
            Schema::create('user_lesson_progress', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id');
                $table->foreignId('lesson_id');
                $table->string('status')->default('not_started');
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->boolean('quiz_passed')->default(false);
                $table->decimal('progress_percentage', 5, 2)->default(0);
                $table->unsignedInteger('watch_duration_seconds')->default(0);
                $table->timestamp('last_watched_at')->nullable();
                $table->timestamp('first_started_at')->nullable();
                $table->string('completed_by')->nullable();
                $table->string('completion_source')->nullable();
                $table->unsignedInteger('last_position_seconds')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('video_watch_sessions')) {
            Schema::create('video_watch_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id');
                $table->foreignId('lesson_id');
                $table->foreignId('course_id')->nullable();
                $table->foreignId('category_id')->nullable();
                $table->string('video_guid')->nullable();
                $table->timestamp('started_at');
                $table->timestamp('ended_at')->nullable();
                $table->timestamp('last_event_at')->nullable();
                $table->unsignedInteger('duration_seconds')->default(0);
                $table->unsignedInteger('watched_seconds')->default(0);
                $table->unsignedInteger('max_position_seconds')->default(0);
                $table->decimal('completion_percentage', 5, 2)->default(0);
                $table->boolean('completed')->default(false);
                $table->timestamp('completed_at')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->string('device_id')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('video_watch_events')) {
            Schema::create('video_watch_events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('video_watch_session_id');
                $table->foreignId('user_id');
                $table->foreignId('lesson_id');
                $table->string('event_type', 32);
                $table->unsignedInteger('position_seconds')->default(0);
                $table->unsignedInteger('duration_seconds')->nullable();
                $table->unsignedInteger('watched_delta_seconds')->nullable();
                $table->decimal('playback_rate', 4, 2)->nullable();
                $table->json('metadata')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }
}
