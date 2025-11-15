<?php

// app/Providers/RouteServiceProvider.php

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider; // Pastikan ini diimpor
use Illuminate\Support\Facades\Route;

// ... (Pastikan Anda menggunakan kelas RouteServiceProvider, bukan AppServiceProvider)

class RouteServiceProvider extends ServiceProvider
{
    // ... properti kelas

    // ... (Jika Laravel Anda versi lama, Anda mungkin perlu menambahkan namespace controller di sini)

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        // *** Ini adalah tempat untuk configureRateLimiting() ***
        $this->configureRateLimiting(); // Panggil fungsi yang ada di RouteServiceProvider

        $this->routes(function () {
            // Memuat Rute API
            Route::prefix('api')
                ->middleware('api')
                // Hapus ->namespace($this->namespace) jika menggunakan Controller modern
                ->group(base_path('routes/api.php'));

            // Memuat Rute Web
            Route::middleware('web')
                // Hapus ->namespace($this->namespace) jika menggunakan Controller modern
                ->group(base_path('routes/web.php'));
        });
    }

    // Pastikan metode configureRateLimiting() ada di file ini atau di trait yang digunakan
    protected function configureRateLimiting()
    {
        // Logika default rate limiting
        Illuminate\Support\Facades\RateLimiter::for('api', function (Illuminate\Http\Request $request) {
            return Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Pastikan Anda memindahkan semua helper method dari AppServiceProvider ke sini (jika ada)
    }
}
