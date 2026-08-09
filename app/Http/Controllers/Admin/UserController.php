<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Helper privat untuk proteksi role admin
     */
    private function authorizeAdmin(Request $request): void
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Akses Ditolak. Halaman ini hanya untuk Administrator.');
        }
    }

    /**
     * Tampilkan daftar user + pencarian, filter role & sorting
     */
    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $sort = in_array($request->input('sort'), ['asc', 'desc']) ? $request->input('sort') : 'asc';

        $users = User::query()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($query, $role) {
                $query->where('role', $role);
            })
            ->orderBy('created_at', $sort)
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $request->search ?? '',
                'role'   => $request->role ?? '',
                'sort'   => $sort,
            ],
        ]);
    }

    /**
     * Simpan user baru yang dibuat oleh Admin
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Rules\Password::defaults()],
            'role'     => ['required', 'in:admin,staff,view'],
        ]);

        User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);

        return redirect()->back()->with('success', 'User baru berhasil ditambahkan.');
    }

    /**
     * Update data user / role / password
     */
    public function update(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role'     => ['required', 'in:admin,staff,view'],
            'password' => ['nullable', Rules\Password::defaults()],
        ]);

        $data = [
            'name'  => $validated['name'],
            'email' => $validated['email'],
            'role'  => $validated['role'],
        ];

        // Update password hanya jika diisi oleh Admin
        if ($request->filled('password')) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return redirect()->back()->with('success', 'Data user berhasil diperbarui.');
    }

    /**
     * Hapus akun user tunggal
     */
    public function destroy(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        if ($request->user()->id === $user->id) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        // 💡 Ganti $user->delete(); menjadi ini agar Intelephense tidak protes:
        User::destroy($user->id);

        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }

    /**
     * Hapus akun user secara massal (Bulk Delete)
     */
    public function bulkDelete(Request $request)
    {
        $this->authorizeAdmin($request);

        $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['exists:users,id'],
        ]);

        // Cegah admin menghapus akunnya sendiri jika ikut tercentang
        $ids = array_filter($request->ids, fn($id) => (int)$id !== (int)$request->user()->id);

        if (empty($ids)) {
            return redirect()->back()->with('error', 'Tidak ada user yang dihapus (Anda tidak dapat menghapus akun Anda sendiri).');
        }

        User::destroy($ids);

        return redirect()->back()->with('success', count($ids) . ' user terpilih berhasil dihapus.');
    }
}