<?php

namespace App\Http\Controllers;

use App\Models\Proyek;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProyekController extends Controller
{
    private function ensureCanWrite(Request $request): void
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'staff'], true), 403);
    }

    public function index(Request $request): Response
    {
        return Inertia::render('Proyek/Index', [
            'proyekData' => Proyek::query()->orderBy('kode_projek')->get([
                'id', 'kode_projek', 'nama_projek', 'nama_customer', 'lokasi', 'is_active',
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $this->ensureCanWrite($request);
        $request->merge(['kode_projek' => trim((string) $request->input('kode_projek', ''))]);
        $validated = $request->validate([
            'kode_projek' => ['required', 'string', 'max:100', 'unique:proyeks,kode_projek'],
            'nama_projek' => ['required', 'string', 'max:255'],
            'nama_customer' => ['nullable', 'string', 'max:255'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['kode_projek'] = trim($validated['kode_projek']);
        $validated['nama_projek'] = trim($validated['nama_projek']);
        $validated['nama_customer'] = isset($validated['nama_customer']) ? trim($validated['nama_customer']) : null;
        $validated['lokasi'] = isset($validated['lokasi']) ? trim($validated['lokasi']) : null;
        $validated['is_active'] = $request->boolean('is_active', true);

        Proyek::create($validated);

        return back()->with('success', 'Master Data Proyek berhasil ditambahkan.');
    }

    public function update(Request $request, Proyek $proyek)
    {
        $this->ensureCanWrite($request);
        $request->merge(['kode_projek' => trim((string) $request->input('kode_projek', ''))]);
        $validated = $request->validate([
            'kode_projek' => ['required', 'string', 'max:100', Rule::unique('proyeks', 'kode_projek')->ignore($proyek->id)],
            'nama_projek' => ['required', 'string', 'max:255'],
            'nama_customer' => ['nullable', 'string', 'max:255'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['kode_projek'] = trim($validated['kode_projek']);
        $validated['nama_projek'] = trim($validated['nama_projek']);
        $validated['nama_customer'] = isset($validated['nama_customer']) ? trim($validated['nama_customer']) : null;
        $validated['lokasi'] = isset($validated['lokasi']) ? trim($validated['lokasi']) : null;
        $validated['is_active'] = $request->boolean('is_active', true);

        // Perubahan kode, riwayat transaksi, dan lokasi SN diperbarui secara atomik.
        $oldCode = $proyek->kode_projek;
        $newCode = $validated['kode_projek'];
        DB::transaction(function () use ($proyek, $validated, $oldCode, $newCode) {
            $proyek->update($validated);
            if ($oldCode !== $newCode) {
                DB::table('transaksis')->where('kode_projek', $oldCode)->update(['kode_projek' => $newCode]);
                DB::table('barang_serials')->where('kode_projek', $oldCode)->update(['kode_projek' => $newCode]);
            }
        });

        return back()->with('success', 'Master Data Proyek berhasil diperbarui.');
    }

    public function destroy(Request $request, Proyek $proyek)
    {
        $this->ensureCanWrite($request);

        $hasTransactions = DB::table('transaksis')->where('kode_projek', $proyek->kode_projek)->exists();
        $hasSerials = DB::table('barang_serials')->where('kode_projek', $proyek->kode_projek)->exists();

        if ($hasTransactions || $hasSerials) {
            return back()->withErrors([
                'delete' => "Proyek {$proyek->kode_projek} tidak dapat dihapus karena sudah digunakan pada transaksi atau data serial. Ubah statusnya menjadi Nonaktif melalui Edit.",
            ]);
        }

        $proyek->delete();

        return back()->with('success', 'Data proyek berhasil dihapus.');
    }
}
