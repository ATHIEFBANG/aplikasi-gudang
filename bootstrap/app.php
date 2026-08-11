<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Percayai Reverse Proxy dari Vercel
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // 🟢 HANDLER CUSTOM ERROR UNTUK INERTIA
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            // Cek jika status code termasuk HTTP Error (404, 500, 503, 403)
            if (in_array($response->getStatusCode(), [500, 503, 404, 403])) {
                // Di mode local & APP_DEBUG=true, biarkan Laravel Ignition/Whoops tampil untuk debugging.
                // Tapi jika di production (atau APP_DEBUG=false), tampilkan halaman Error.jsx buatan kita.
                if (! config('app.debug')) {
                    return Inertia::render('Error', ['status' => $response->getStatusCode()])
                        ->toResponse($request)
                        ->setStatusCode($response->getStatusCode());
                }
            } elseif ($response->getStatusCode() === 419) {
                // Error CSRF / Session Expired
                return back()->with([
                    'message' => 'Sesi telah berakhir, silakan coba lagi.',
                ]);
            }

            return $response;
        });
    })->create();