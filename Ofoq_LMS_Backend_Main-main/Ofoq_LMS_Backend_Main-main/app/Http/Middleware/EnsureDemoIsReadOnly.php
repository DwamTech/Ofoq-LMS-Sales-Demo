<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDemoIsReadOnly
{
    /**
     * Block state-changing API requests while the application is in demo mode.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('demo.enabled')) {
            return $next($request);
        }

        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        $route = $request->route();
        $routeName = is_object($route) ? $route->getName() : null;

        if ($routeName && in_array($routeName, config('demo.allowed_route_names', []), true)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'This action is disabled in demo mode.',
            'code' => 'DEMO_READ_ONLY',
        ], Response::HTTP_FORBIDDEN);
    }
}
