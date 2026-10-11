<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Demo mode
    |--------------------------------------------------------------------------
    |
    | Demo mode is opt-in. Keep it disabled in normal environments so the
    | application retains its existing behaviour.
    |
    */
    'enabled' => filter_var(env('DEMO_MODE', false), FILTER_VALIDATE_BOOLEAN),
    // Server-only, opt-in. Public deployment is deliberately not enabled by this local guard.
    'entry' => [
        'enabled' => filter_var(env('DEMO_ENTRY_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
        'signing_key' => env('DEMO_ENTRY_SIGNING_KEY', ''),
        'database' => env('DEMO_ENTRY_DATABASE', ''),
        'frontend_origin' => env('DEMO_ENTRY_FRONTEND_ORIGIN', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Stateful requests required to access a demo account
    |--------------------------------------------------------------------------
    |
    | Use route names rather than URL comparisons so these exceptions stay
    | explicit and do not accidentally permit similarly shaped endpoints.
    |
    */
    'allowed_route_names' => [
        'login',
        'auth.logout',
        'demo.entry',
    ],
];
