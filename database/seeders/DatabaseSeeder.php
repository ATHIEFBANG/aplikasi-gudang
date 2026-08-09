<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Akun Admin Utama (Wajib untuk membuatkan akun staff lain)
        User::create([
            'name'     => 'Admin Utama',
            'email'    => 'admin@mitratel.co.id',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);

        // 2. Akun Contoh Staff Operasional
        User::create([
            'name'     => 'Staff Operasional',
            'email'    => 'staff@mitratel.co.id',
            'password' => Hash::make('password123'),
            'role'     => 'staff',
        ]);

        // 3. Akun Contoh Viewer / Management
        User::create([
            'name'     => 'Viewer Management',
            'email'    => 'viewer@mitratel.co.id',
            'password' => Hash::make('password123'),
            'role'     => 'view',
        ]);
    }
}