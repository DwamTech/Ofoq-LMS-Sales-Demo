<?php

namespace App\Http\Controllers;

use App\Models\BlockedUser;
use App\Models\User;
use App\Support\DemoEntryGuard;
use App\Support\DemoPersonas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Throwable;

class DemoEntryController extends Controller
{
    public function __invoke(Request $request, DemoEntryGuard $guard)
    {
        try {
            $guard->assertReady();
        } catch (Throwable) {
            return $this->unavailable();
        }

        $data = $request->validate(['persona' => ['required', 'string', Rule::in(array_keys(DemoPersonas::ACCOUNTS))]]);
        $timestamp = $request->header('X-Demo-Timestamp', '');
        $nonce = $request->header('X-Demo-Nonce', '');
        $origin = $request->header('X-Demo-Origin', '');
        $signature = $request->header('X-Demo-Signature', '');
        $payload = implode("\n", [$timestamp, $nonce, $data['persona'], $origin]);
        if (! in_array($request->ip(), ['127.0.0.1', '::1'], true)
            || ! ctype_digit($timestamp) || abs(time() - (int) $timestamp) > 30
            || ! preg_match('/^[a-f0-9]{32}$/', $nonce)
            || ! hash_equals((string) config('demo.entry.frontend_origin'), $origin)
            || ! hash_equals(hash_hmac('sha256', $payload, config('demo.entry.signing_key')), $signature)) {
            return response()->json(['code' => 'DEMO_ENTRY_DENIED', 'message' => 'Demo session request denied.'], 403);
        }
        if (! Cache::add('demo-entry-nonce:'.$nonce, true, 65)) {
            return response()->json(['code' => 'DEMO_ENTRY_DENIED', 'message' => 'Demo session request denied.'], 403);
        }
        $user = User::where('email', DemoPersonas::ACCOUNTS[$data['persona']])->first();
        if (! $user || $user->role !== $data['persona'] || ! $user->hasRole($data['persona'])
            || $user->roles()->where('name', '!=', $data['persona'])->exists()
            || BlockedUser::where('user_id', $user->id)->where('is_blocked', true)->exists()) {
            return $this->unavailable();
        }
        $expires = now()->addMinutes(30);
        // Revoke ONLY this browser's previous gateway token, never shared account tokens.
        $old = $request->bearerToken();
        $oldToken = $old ? \Laravel\Sanctum\PersonalAccessToken::findToken($old) : null;
        $token = DB::transaction(function () use ($user, $expires, $oldToken) {
            $new = $user->createToken('ofoq-demo-gateway', ['demo:read-only', 'demo:persona:'.$user->role], $expires);
            if ($oldToken && $oldToken->can('demo:read-only') && $oldToken->name === 'ofoq-demo-gateway') {
                $oldToken->delete();
            }

            return $new->plainTextToken;
        });

        return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'role', 'profile_picture']),
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_at' => $expires->toIso8601String(),
        ], 201)->header('Cache-Control', 'no-store, private');
    }

    private function unavailable()
    {
        return response()->json(['code' => 'DEMO_ENTRY_UNAVAILABLE', 'message' => 'Demo entry is unavailable. Use the preserved login.'], 503);
    }
}
