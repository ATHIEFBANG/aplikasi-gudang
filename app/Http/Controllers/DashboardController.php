<?php

namespace App\Http\Controllers;

use App\Models\RpmMaster;
use App\Models\SmartkeyMaster;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Halaman Utama / Home (/home)
     * Menampilkan Dashboard Monitoring Utama
     */
    public function index(): Response
    {
        return Inertia::render('Dashboard'); // 👈 Render file Dashboard.jsx
    }

    /**
     * Halaman Dashboard Maintenance (/maintenance/dashboard)
     */
    public function maintenance(): Response
    {
        $rpmData = RpmMaster::select([
            'id', 'tahun', 'rtp', 'bulan', 'approve', 'site_id', 'mitra', 'rpm_id',
        ])->get();

        $smartkeyData = SmartkeyMaster::select([
            'id', 'infrako', 'status', 'status_aktifitas', 'ksm', 'posisi_unit', 
            'batch', 'site_name', 'tower_id', 'serial_number', 'long_lat',
        ])->get();

        return Inertia::render('Maintenance/Dashboard/Index', [
            'rpmData'      => $rpmData,
            'smartkeyData' => $smartkeyData,
        ]);
    }
}