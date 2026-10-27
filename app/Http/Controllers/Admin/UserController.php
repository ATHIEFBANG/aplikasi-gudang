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
     * Helper privat untuk proteksi role admin.
     */
    private function authorizeAdmin(Request $request): void
    {
        if (!$request->user()?->isAdmin()) {
            abort(403, 'Akses ditolak. Admin Panel hanya dapat diakses oleh Admin.');
        }
    }

    /**
     * Tampilkan daftar user + pencarian, filter role, sorting, dan pagination.
     */
    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $sort = in_array($request->input('sort'), ['asc', 'desc'], true)
            ? $request->input('sort')
            : 'asc';

        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

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
            ->paginate($perPage)
            ->withQueryString();

        $editingUser = $request->filled('edit')
            ? User::query()->find($request->integer('edit'))
            : null;

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search'   => $request->search ?? '',
                'role'     => $request->role ?? '',
                'sort'     => $sort,
                'per_page' => $perPage,
            ],
            'editingUser' => $editingUser,
        ]);
    }

    /**
     * Kompatibilitas GET /admin/users/{user}.
     */
    public function show(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        return redirect()->route('admin.users.index', array_merge(
            $request->query(),
            ['edit' => $user->id]
        ));
    }

    /**
     * Simpan user baru yang dibuat oleh Admin.
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Rules\Password::defaults()],
            'role'     => ['required', Rule::in(User::ROLES)],
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
     * Update data user / role / password.
     */
    public function update(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role'     => ['required', Rule::in(User::ROLES)],
            'password' => ['nullable', Rules\Password::defaults()],
        ]);

        $data = [
            'name'  => $validated['name'],
            'email' => $validated['email'],
            'role'  => $validated['role'],
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return redirect()->back()->with('success', 'Data user berhasil diperbarui.');
    }

    /**
     * Hapus akun user tunggal.
     */
    public function destroy(Request $request, User $user)
    {
        $this->authorizeAdmin($request);

        if ((int) $request->user()->id === (int) $user->id) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        User::destroy($user->id);

        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }

    /**
     * Hapus akun user secara massal (Bulk Delete).
     */
    public function bulkDelete(Request $request)
    {
        $this->authorizeAdmin($request);

        $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['exists:users,id'],
        ]);

        $ids = array_values(array_filter(
            $request->input('ids'),
            fn ($id) => (int) $id !== (int) $request->user()->id
        ));

        if (empty($ids)) {
            return redirect()->back()->with('error', 'Tidak ada user yang dihapus (Anda tidak dapat menghapus akun Anda sendiri).');
        }

        User::destroy($ids);

        return redirect()->back()->with('success', count($ids) . ' user terpilih berhasil dihapus.');
    }
}
