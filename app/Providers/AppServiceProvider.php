<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // KOSONGKAN/HAPUS:
        // $this->configureRateLimiting();
        // $this->routes(function () { ... });
    }
}
