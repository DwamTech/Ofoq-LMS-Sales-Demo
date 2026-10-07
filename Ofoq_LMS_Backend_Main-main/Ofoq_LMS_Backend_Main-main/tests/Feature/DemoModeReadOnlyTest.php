<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class DemoModeReadOnlyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('api')->prefix('api/demo-mode-test')->group(function (): void {
            Route::get('/admin', fn () => response()->json(['ok' => true]));
            Route::get('/student', fn () => response()->json(['ok' => true]));
            Route::post('/login', fn () => response()->json(['ok' => true]))->name('login');
            Route::post('/logout', fn () => response()->json(['ok' => true]))->name('auth.logout');
            Route::post('/mutation', fn () => response()->json(['ok' => true]));
        });
    }

    public function test_mutations_keep_existing_behaviour_when_demo_mode_is_disabled(): void
    {
        config()->set('demo.enabled', false);

        $this->postJson('/api/demo-mode-test/mutation')->assertOk()->assertJson(['ok' => true]);
    }

    public function test_demo_mode_allows_reads_and_authentication_routes(): void
    {
        config()->set('demo.enabled', true);

        $this->getJson('/api/demo-mode-test/admin')->assertOk();
        $this->getJson('/api/demo-mode-test/student')->assertOk();
        $this->postJson('/api/demo-mode-test/login')->assertOk();
        $this->postJson('/api/demo-mode-test/logout')->assertOk();
    }

    public function test_demo_mode_blocks_all_other_mutations_with_the_standard_response(): void
    {
        config()->set('demo.enabled', true);

        foreach ([
            ['post', '/api/admin/courses'],
            ['put', '/api/admin/courses/1'],
            ['delete', '/api/admin/courses/1'],
            ['post', '/api/courses/1/enroll'],
            ['post', '/api/lessons/1/complete'],
            ['post', '/api/quiz/1/submit'],
            ['put', '/api/profile'],
            ['post', '/api/admin/bunny/sync/run'],
            ['post', '/api/admin/backups/create'],
            ['post', '/api/admin/backups/restore'],
        ] as [$method, $uri]) {
            $this->{$method . 'Json'}($uri)
                ->assertForbidden()
                ->assertExactJson([
                    'message' => 'This action is disabled in demo mode.',
                    'code' => 'DEMO_READ_ONLY',
                ]);
        }
    }
}
