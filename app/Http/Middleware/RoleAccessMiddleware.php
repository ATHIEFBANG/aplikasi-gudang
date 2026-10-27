<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleAccessMiddleware
{
    /**
     * Otorisasi role yang digunakan langsung pada definisi route.
     *
     * Rules:
     * - admin: hanya Admin.
     * - admin-supervisi: Admin dan Supervisi.
     * - no-pelaksana: Admin dan Supervisi; digunakan untuk edit/hapus.
     * - operational: hanya role aplikasi yang dikenal.
     * - inbound-create: role aplikasi yang dikenal, tetapi Pelaksana tidak
     *   boleh melakukan Pengembalian Manual.
     */
    public function handle(Request $request, Closure $next, string $rule): Response
    {
        $user = $request->user();

        abort_unless($user, 401, 'Silakan login terlebih dahulu.');

        $role = strtolower(trim((string) $user->role));

        $allowed = match ($rule) {
            'admin' => $role === 'admin',
            'admin-supervisi', 'no-pelaksana' => in_array($role, ['admin', 'supervisi'], true),
            'operational', 'inbound-create' => in_array($role, ['admin', 'supervisi', 'pelaksana'], true),
            default => false,
        };

        abort_unless($allowed, 403, $this->denialMessage($rule, $role));

        if ($rule === 'inbound-create' && $role === 'pelaksana' && $this->containsManualReturn($request)) {
            abort(403, 'Role Pelaksana tidak diizinkan menggunakan fitur Pengembalian Manual. Pilih sumber pengembalian dari Proyek.');
        }

        return $next($request);
    }

    private function containsManualReturn(Request $request): bool
    {
        $items = $request->input('items', []);

        if (!is_array($items)) {
            return false;
        }

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $subJenis = strtoupper(trim((string) ($item['sub_jenis'] ?? '')));
            if ($subJenis !== 'PENGEMBALIAN') {
                continue;
            }

            $returnSource = strtoupper(trim((string) ($item['return_source'] ?? '')));
            $kodeProjek = trim((string) ($item['kode_projek'] ?? ''));

            // Backend transaksi menganggap pengembalian sebagai pengembalian proyek
            // hanya jika kode_projek terisi. Maka ketiadaan kode proyek juga manual.
            if ($returnSource === 'MANUAL' || $kodeProjek === '') {
                return true;
            }
        }

        return false;
    }

    private function denialMessage(string $rule, string $role): string
    {
        if ($rule === 'admin') {
            return 'Akses ditolak. Fitur ini hanya dapat digunakan oleh Admin.';
        }

        if ($rule === 'admin-supervisi' || $rule === 'no-pelaksana') {
            return 'Akses ditolak. Role Pelaksana tidak diizinkan melakukan edit atau hapus.';
        }

        return 'Akses ditolak. Role akun tidak dikenal atau belum diperbarui.';
    }
}
