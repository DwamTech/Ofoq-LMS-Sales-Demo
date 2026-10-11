<?php

namespace App\Http\Middleware;

use App\Support\DemoEntryGuard;
use App\Support\DemoPersonas;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Throwable;

class RestrictDemoGatewayToken
{
    public function handle(Request $request, Closure $next)
    {
        $plain = $request->bearerToken();
        $token = $plain ? PersonalAccessToken::findToken($plain) : null;
        if (! $token || $token->name !== 'ofoq-demo-gateway') {
            return $next($request); // Existing legitimate Sanctum flows are unchanged.
        }
        if ($request->isMethod('POST') && in_array($request->path(), ['api/auth/logout', 'api/demo/session'], true)) {
            return $next($request); // Logout remains possible after disabling entry.
        }
        try {
            app(DemoEntryGuard::class)->assertReady();
        } catch (Throwable) {
            return $this->deny();
        }
        $user = $token->tokenable;
        if (! $user || ! isset(DemoPersonas::ACCOUNTS[$user->role])
            || $user->email !== DemoPersonas::ACCOUNTS[$user->role]
            || ! $token->can('demo:persona:'.$user->role) || ! $token->can('demo:read-only')
            || $token->expires_at?->isPast()) {
            return $this->deny();
        }
        if (! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return response()->json(['message' => 'This action is disabled in demo mode.', 'code' => 'DEMO_READ_ONLY'], 403);
        }
        // Positive allowlist: no backup files, system logs, secrets, integration control,
        // or the legacy GET endpoint that generates a new course certificate.
        $path = $request->path();
        if ($user->role === 'admin' && preg_match('~^api/admin/showcase/(students(?:/\d+)?|exams/\d+)$~', $path)) {
            return $next($request); // Three exact admin-only, non-mutating positive projections.
        }
        if ($user->role === 'student' && preg_match('~^api/student/certificates/(course|legacy-course|diploma)/\d+/download$~', $path)) {
            return $next($request); // Exact read-only download; controller enforces ownership and issued status.
        }
        $allowed = preg_match('~^api/(profile|user(?:/profile|/permissions|/favorite-courses)?|stats/(general|students-by-country)|sections|allCourses|course/\d+|courses/featured|courses/\d+/(reviews|progress|final-exam/meta|final-exam/attempt/active|certificate-status|certificate/data)|categories(?:/[^/]+)?|diplomas(?:/[^/]+)?|my-enrollments(?:/filters)?|my-diplomas|my-tests|my-certificates|lessons/\d+(?:/navigation|/notes|/quiz|/status)?|chapters/\d+/quiz|quiz/\d+/attempts|courseEnroll/\d+|categories/\d+/certificate(?:/data)?)$~', $path);
        if (str_starts_with($path, 'api/admin/')) {
            $allowed = $user->role === 'admin' && preg_match('~^api/admin/(courses(?:/\d+|/\d+/chapters(?:/\d+)?)?|course/\d+|courses-details|courses-not-published|categories(?:/\d+(?:/subscribers|/final-exam|/students|/certificates|/eligible-students)?)?|sections(?:/\d+)?|students|stats/students|instructors(?:/\d+)?|chapters/\d+/lessons|quizzes/\d+/questions|reports/(overview|beneficiaries(?:/pdf)?|students/\d+|lessons/\d+|courses/\d+|diplomas/\d+)|diploma-certificates/student|certificates/search|users/\d+/certificates|diplomas/\d+/(students|certificates|eligible-students))$~', $path);
        }

        return $allowed ? $next($request) : $this->deny();
    }

    private function deny()
    {
        return response()->json(['code' => 'DEMO_SCOPE_DENIED', 'message' => 'This resource is not available in the public demo.'], 403);
    }
}
