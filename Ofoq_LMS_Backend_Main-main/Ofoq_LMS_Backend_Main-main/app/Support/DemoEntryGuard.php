<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

class DemoEntryGuard
{
    public function assertIsolated(): void
    {
        DemoEnvironmentGuard::assertLocalDemo();
        if (config('database.default') !== 'mysql') {
            throw new LogicException('Demo entry requires the verified local MySQL showcase.');
        }
        $expected = (string) config('demo.entry.database');
        $actual = DB::selectOne('SELECT DATABASE() AS database_name')->database_name;
        if ($expected === '' || ! hash_equals($expected, (string) $actual)) {
            throw new LogicException('Demo database identity has not been explicitly confirmed.');
        }
        // A demo-looking DB name alone is not isolation. Refuse mixed real/demo users.
        if (User::whereNull('email')->orWhere('email', 'not like', '%@demo.ofoq.local')->exists()) {
            throw new LogicException('Non-synthetic accounts exist in this database.');
        }
        if (\App\Models\Instructors::whereNull('email')->orWhere('email', 'not like', '%@demo.ofoq.local')->exists()) {
            throw new LogicException('Non-synthetic instructor identities exist in this database.');
        }
        foreach (DemoPersonas::ACCOUNTS as $role => $email) {
            $user = User::where('email', $email)->first();
            if (! $user || $user->role !== $role || ! $user->hasRole($role)
                || $user->roles()->where('name', '!=', $role)->exists()) {
                throw new LogicException('The designated demo persona is absent or has conflicting roles.');
            }
        }
    }

    public function assertReady(): void
    {
        if (! config('demo.entry.enabled') || strlen((string) config('demo.entry.signing_key')) < 32) {
            throw new LogicException('Demo entry is disabled or has no private signing key.');
        }
        $origin = (string) config('demo.entry.frontend_origin');
        if (! in_array(parse_url($origin, PHP_URL_HOST), ['127.0.0.1', 'localhost', '::1'], true)) {
            throw new LogicException('Public demo deployment requires a separate isolation/security approval.');
        }
        $this->assertIsolated();
    }
}
