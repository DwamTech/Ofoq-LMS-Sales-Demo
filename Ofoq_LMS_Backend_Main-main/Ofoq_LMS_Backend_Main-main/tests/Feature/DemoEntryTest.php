<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\DemoEntryGuard;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use LogicException;
use Mockery;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DemoEntryTest extends TestCase
{
    private string $key;

    protected function setUp(): void
    {
        parent::setUp();
        // Never run migration/fixture writes against the existing MySQL showcase.
        if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') {
            throw new LogicException('These fixtures require SQLite :memory:.');
        }
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('role');
            $table->string('password')->nullable();
            $table->string('profile_picture')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();
        });
        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
        });
        Schema::create('blocked_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->boolean('is_blocked');
        });
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
        $this->key = Str::random(64);
        config()->set('demo.enabled', true);
        config()->set('demo.entry.enabled', true);
        config()->set('demo.entry.signing_key', $this->key);
        config()->set('demo.entry.frontend_origin', 'http://127.0.0.1:3004');
        Cache::flush();
        foreach (['student', 'admin'] as $role) {
            $model = User::create(['name' => 'Synthetic '.$role, 'email' => $role.'.demo@demo.ofoq.local', 'role' => $role]);
            $model->roles()->attach(Role::create(['name' => $role, 'guard_name' => 'sanctum'])->id);
        }
        // HTTP contract tests mock only isolation, which is separately checked against
        // the real local DB by demo:entry-audit and real authenticated smoke tests.
        $guard = Mockery::mock(DemoEntryGuard::class);
        $guard->shouldReceive('assertReady')->andReturnNull();
        $this->app->instance(DemoEntryGuard::class, $guard);
    }

    private function signed(string $role, ?string $nonce = null, ?string $timestamp = null): array
    {
        $timestamp ??= (string) time();
        $nonce ??= bin2hex(random_bytes(16));

        return ['X-Demo-Timestamp' => $timestamp, 'X-Demo-Nonce' => $nonce, 'X-Demo-Origin' => 'http://127.0.0.1:3004',
            'X-Demo-Signature' => hash_hmac('sha256', implode("\n", [$timestamp, $nonce, $role, 'http://127.0.0.1:3004']), $this->key)];
    }

    public function test_unsigned_request_cannot_impersonate_an_admin(): void
    {
        $this->postJson('/api/demo/session', ['persona' => 'admin'])->assertForbidden();
        $this->assertSame(0, PersonalAccessToken::count());
    }

    public function test_signed_sessions_have_real_roles_short_expiry_and_no_wildcard_ability(): void
    {
        foreach (['student', 'admin'] as $role) {
            $response = $this->postJson('/api/demo/session', ['persona' => $role], $this->signed($role));
            $response->assertCreated()->assertJsonPath('user.role', $role);
            $token = PersonalAccessToken::findToken($response->json('token'));
            $this->assertNotNull($token);
            $this->assertFalse($token->can('*'));
            $this->assertTrue($token->can('demo:read-only'));
            $this->assertTrue($token->expires_at->isFuture());
            $this->assertTrue($token->expires_at->lessThanOrEqualTo(now()->addMinutes(31)));
        }
    }

    public function test_nonce_replay_and_stale_signatures_are_denied(): void
    {
        $headers = $this->signed('student');
        $this->postJson('/api/demo/session', ['persona' => 'student'], $headers)->assertCreated();
        $this->postJson('/api/demo/session', ['persona' => 'student'], $headers)->assertForbidden();
        $this->postJson('/api/demo/session', ['persona' => 'student'], $this->signed('student', null, (string) (time() - 60)))->assertForbidden();
        $this->assertSame(1, PersonalAccessToken::count());
    }

    public function test_invalid_role_or_modified_signed_role_is_denied(): void
    {
        $this->postJson('/api/demo/session', ['persona' => 'supervisor'], $this->signed('supervisor'))->assertUnprocessable();
        $this->postJson('/api/demo/session', ['persona' => 'admin'], $this->signed('student'))->assertForbidden();
    }

    public function test_sensitive_reads_and_writes_are_unavailable_for_demo_tokens(): void
    {
        $user = User::where('role', 'admin')->first();
        $plain = $user->createToken('ofoq-demo-gateway', ['demo:read-only', 'demo:persona:admin'], now()->addMinutes(30))->plainTextToken;
        $headers = ['Authorization' => 'Bearer '.$plain];
        foreach (['/api/admin/backups', '/api/admin/backups/private.sql/download', '/api/admin/bunny/sync-logs', '/api/external/certificates/pending', '/api/courses/1/certificate'] as $path) {
            $this->getJson($path, $headers)->assertForbidden()->assertJsonPath('code', 'DEMO_SCOPE_DENIED');
        }
        $this->putJson('/api/profile', ['name' => 'Not saved'], $headers)->assertForbidden()->assertJsonPath('code', 'DEMO_READ_ONLY');
        $this->assertSame('Synthetic admin', $user->fresh()->name);
    }

    public function test_student_token_cannot_read_admin_routes_even_with_forged_client_state(): void
    {
        $user = User::where('role', 'student')->first();
        $plain = $user->createToken('ofoq-demo-gateway', ['demo:read-only', 'demo:persona:student'], now()->addMinutes(30))->plainTextToken;
        $this->getJson('/api/admin/courses', ['Authorization' => 'Bearer '.$plain])->assertForbidden();
    }

    public function test_disabled_or_unisolated_guard_returns_generic_unavailable_without_config(): void
    {
        $this->app->instance(DemoEntryGuard::class, new DemoEntryGuard);
        config()->set('demo.entry.enabled', false);
        $this->postJson('/api/demo/session', ['persona' => 'admin'], $this->signed('admin'))
            ->assertStatus(503)->assertJsonPath('code', 'DEMO_ENTRY_UNAVAILABLE');
        $this->assertSame(0, PersonalAccessToken::count());
    }

    public function test_expired_token_does_not_authorize_profile(): void
    {
        $user = User::where('role', 'student')->first();
        $plain = $user->createToken('ofoq-demo-gateway', ['demo:read-only', 'demo:persona:student'], now()->subMinute())->plainTextToken;
        $this->getJson('/api/profile', ['Authorization' => 'Bearer '.$plain])->assertUnauthorized();
    }

    public function test_entry_is_rate_limited(): void
    {
        for ($i = 0; $i < 12; $i++) {
            $this->postJson('/api/demo/session', ['persona' => 'admin'])->assertForbidden();
        }
        $this->postJson('/api/demo/session', ['persona' => 'admin'])->assertStatus(429);
    }

    public function test_default_configuration_is_opt_in_and_isolation_checks_do_not_trust_demo_flag(): void
    {
        $guard = new DemoEntryGuard;
        config()->set('demo.entry.enabled', false);
        $this->expectException(LogicException::class);
        $guard->assertReady();
    }

    public function test_demo_mode_alone_cannot_authorize_an_unapproved_connection(): void
    {
        config()->set('app.url', 'http://127.0.0.1:8000');
        $this->expectException(LogicException::class);
        (new DemoEntryGuard)->assertIsolated(); // SQLite fixture is not an approved MySQL demo DB.
    }

    public function test_remote_origin_requires_separate_security_approval(): void
    {
        config()->set('demo.entry.frontend_origin', 'https://public.example');
        $this->expectException(LogicException::class);
        (new DemoEntryGuard)->assertReady();
    }

    public function test_disabling_entry_blocks_already_issued_gateway_reads_but_keeps_logout(): void
    {
        $user = User::where('role', 'admin')->first();
        $plain = $user->createToken('ofoq-demo-gateway', ['demo:read-only', 'demo:persona:admin'], now()->addMinutes(30))->plainTextToken;
        $this->app->instance(DemoEntryGuard::class, new DemoEntryGuard);
        config()->set('demo.entry.enabled', false);
        $headers = ['Authorization' => 'Bearer '.$plain];
        $this->getJson('/api/profile', $headers)->assertForbidden()->assertJsonPath('code', 'DEMO_SCOPE_DENIED');
        $this->postJson('/api/auth/logout', [], $headers)->assertOk();
        $this->assertNull(PersonalAccessToken::findToken($plain));
    }

    public function test_preserved_legacy_login_profile_and_logout_work_when_gateway_is_disabled(): void
    {
        config()->set('demo.entry.enabled', false);
        $this->app->instance(DemoEntryGuard::class, new DemoEntryGuard);
        foreach (['student', 'admin'] as $role) {
            $this->app['auth']->shouldUse('web'); // Fresh HTTP request's configured login guard.
            $user = User::where('role', $role)->first();
            $password = Str::random(40); // Ephemeral SQLite fixture only; never logged.
            $user->update(['password' => $password]);
            $response = $this->postJson('/api/login', ['login' => $user->email, 'password' => $password]);
            $response->assertCreated()->assertJsonPath('user.role', $role);
            $plain = $response->json('token');
            $this->assertSame('auth_token', PersonalAccessToken::findToken($plain)->name);
            // A separate browser HTTP request has no in-process web login guard.
            // Clear that PHPUnit-retained session so the test proves bearer auth.
            $this->app['auth']->guard('web')->logout();
            $this->app['auth']->forgetGuards();
            $headers = ['Authorization' => 'Bearer '.$plain];
            $this->getJson('/api/profile', $headers)->assertOk()->assertJsonPath('user.role', $role);
            $this->postJson('/api/auth/logout', [], $headers)->assertOk();
            $this->assertNull(PersonalAccessToken::findToken($plain));
            $this->app['auth']->forgetGuards();
        }
    }
}
