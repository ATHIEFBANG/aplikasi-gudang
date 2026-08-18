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

        // 👉 KODE WAJIB UNTUK VERCEL: KECUALIKAN CSRF UNTUK SEMUA API
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'track/*'
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if (in_array($response->getStatusCode(), [500, 503, 404, 403])) {
                if (! config('app.debug')) {
                    return Inertia::render('Error', ['status' => $response->getStatusCode()])
                        ->toResponse($request)
                        ->setStatusCode($response->getStatusCode());
                }
            } elseif ($response->getStatusCode() === 419) {
                return back()->with([
                    'message' => 'Sesi telah berakhir, silakan coba lagi.',
                ]);
            }
            return $response;
        });
    })->create();