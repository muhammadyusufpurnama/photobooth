<?php

return [
    /*
     * The paths for which the CORS headers are set.
     */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    /*
     * The allowed origins with a wildcard (*) as default.
     */
    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8000', // <-- Masuk jika React/View di localhost:8000
        'http://127.0.0.1:8000', // <-- WAJIB MASUK jika React/View di 127.0.0.1:8000
        env('APP_URL', 'http://localhost'),
    ],

    /*
     * The allowed headers with a wildcard (*) as default.
     */
    'allowed_headers' => ['*'],

    /*
     * The allowed methods with a wildcard (*) as default.
     */
    'allowed_methods' => ['*'],

    /*
     * The maximum age for the preflight request.
     */
    'max_age' => 0,

    /*
     * Dll...
     */
];
