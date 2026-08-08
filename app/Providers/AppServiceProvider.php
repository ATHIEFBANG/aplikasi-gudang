<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL; // <-- 1. Tambahkan baris ini

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // 2. Tambahkan baris ini untuk memaksa HTTPS di Vercel/Production
        if (config('app.env') !== 'local') {
            URL::forceScheme('https');
        }
    }
}