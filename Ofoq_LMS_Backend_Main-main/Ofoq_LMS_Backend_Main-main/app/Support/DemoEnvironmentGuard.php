<?php

namespace App\Support;

use LogicException;

/**
 * Refuses demo preparation outside an explicitly local, demo-only database.
 *
 * APP_ENV alone is deliberately not trusted here: this project currently uses
 * a production-like APP_ENV for its local demo. All of the conditions below
 * must hold before a command or seeder is allowed to change demo records.
 */
final class DemoEnvironmentGuard
{
    public static function assertLocalDemo(): void
    {
        $connection = config('database.default');
        $database = (array) config("database.connections.{$connection}");
        $host = strtolower((string) ($database['host'] ?? ''));
        $name = (string) ($database['database'] ?? '');
        $appHost = strtolower((string) parse_url((string) config('app.url'), PHP_URL_HOST));

        $isLocalHost = in_array($host, ['127.0.0.1', 'localhost', '::1'], true);
        $isLoopbackApp = in_array($appHost, ['127.0.0.1', 'localhost', '::1'], true);
        $isDemoDatabase = (bool) preg_match('/(^|[_-])demo([_-]|$)/i', $name);

        if (! config('demo.enabled') || ! $isLocalHost || ! $isLoopbackApp || ! $isDemoDatabase) {
            throw new LogicException(
                'Demo setup is restricted to a local loopback application using a *_demo database with DEMO_MODE enabled.'
            );
        }
    }
}
