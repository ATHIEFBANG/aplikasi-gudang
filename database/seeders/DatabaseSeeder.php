<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Gudang;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Pengguna
        User::create([
            'name'     => 'Admin Utama',
            'email'    => 'admin@ppl.com',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);
        User::create([
            'name'     => 'Staff Operasional',
            'email'    => 'staff@ppl.com',
            'password' => Hash::make('password123'),
            'role'     => 'staff',
        ]);
        User::create([
            'name'     => 'Viewer Management',
            'email'    => 'viewer@ppl.com',
            'password' => Hash::make('password123'),
            'role'     => 'view',
        ]);

        // 2. Data Master 8 Gudang PPL
        $gudangs = [
            [
                'kode_gudang' => 'GDR-001',
                'nama_gudang' => 'Gudang Jambi (Muara Rupit)',
                'lokasi'      => 'Muara Rupit, Musi Rawas Utara, Sumatera Selatan',
                'lat_long'    => '-2.8012, 102.8123',
                'is_active'   => true,
            ],
            [
                'kode_gudang' => 'GDR-002',
                'nama_gudang' => 'Gudang SBS (Muara Enim Sumsel)',
                'lokasi'      => 'Muara Enim, Sumatera Selatan',
                'lat_long'    => '-3.6521, 103.7765',
                'is_active'   => true,
            ],
            [
                'kode_gudang' => 'GDR-003',
                'nama_gudang' => 'Gudang HO (Cinangka)',
                'lokasi'      => 'Cinangka, Sawangan, Jawa Barat',
                'lat_long'    => '-6.3612, 106.7482',
                'is_active'   => true,
            ],
            [
                'kode_gudang' => 'GDR-004',
                'nama_gudang' => 'Gudang BIS (Kalimantan Tengah)',
                'lokasi'      => 'Provinsi Kalimantan Tengah',
                'lat_long'    => '-2.2102, 113.9182',
                'is_active'   => true,
            ],
            [
                'kode_gudang' => 'GDR-005',
                'nama_gudang' => 'Gudang KM 13 (Karang Joang)',
                'lokasi'      => 'Karang Joang, Balikpapan Utara, Kalimantan Timur',
                'lat_long'    => '-1.1641, 116.8717',
                'is_active'   => true,
            ],
            [
                'kode_gudang' => 'GDR-006',
                'nama_gudang' => 'Gudang SJR (Ranan Sumbawa)',
                'lokasi'      => 'Ranan, Kabupaten Sumbawa, Nusa Tenggara Barat',
                'lat_long'    => '-8.5012, 117.4211',
                'is_active'   => true,
            ],
            [
                'kode_gudang' => 'GDR-007',
                'nama_gudang' => 'Gudang Labangka (Sumbawa)',
                'lokasi'      => 'Labangka, Kabupaten Sumbawa, Nusa Tenggara Barat',
                'lat_long'    => '-8.8012, 117.5523',
                'is_active'   => true,
            ],
            [
                'kode_gudang' => 'GDR-008',
                'nama_gudang' => 'Gudang Balikpapan',
                'lokasi'      => 'Jl. Persatuan Gg. Kencana III No. 186, Balikpapan Timur, Kalimantan Timur',
                'lat_long'    => '-1.2109, 116.9649',
                'is_active'   => true,
            ],
        ];

        foreach ($gudangs as $g) {
            Gudang::create($g);
        }
    }
}