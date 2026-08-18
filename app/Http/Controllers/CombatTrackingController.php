<?php

namespace App\Http\Controllers;

use App\Models\CombatTrip;
use App\Models\CombatTripCoordinate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CombatTrackingController extends Controller
{
    /**
     * 1. Render Tampilan Mobile HP Driver saat membuka link WhatsApp (/track/{token})
     */
    public function driverView(string $token)
    {
        $trip = CombatTrip::with(['combat'])->where('tracking_token', $token)->firstOrFail();

        return Inertia::render('Track/DriverPage', [
            'trip' => $trip,
        ]);
    }

    /**
     * 2. Ambil Status Terkini Trip Driver (Polling Sisi Driver)
     */
    public function getDriverTripStatus(string $token)
    {
        $trip = CombatTrip::with(['combat'])->where('tracking_token', $token)->firstOrFail();
        return response()->json(['data' => $trip]);
    }

    /**
     * 3. Driver Menekan Tombol "Mulai Perjalanan"
     */
    public function startTripByDriver(string $token)
    {
        $trip = CombatTrip::where('tracking_token', $token)->firstOrFail();

        if (in_array($trip->status, ['COMPLETED', 'CANCELLED'])) {
            return response()->json(['message' => 'Tugas perjalanan ini sudah selesai atau dibatalkan.'], 400);
        }

        DB::transaction(function () use ($trip) {
            $trip->update([
                'status'     => 'IN_TRANSIT',
                'started_at' => now(),
            ]);

            if ($trip->combat) {
                $trip->combat->update(['status_combat' => 'IN TRANSIT']);
            }
        });

        return response()->json([
            'message' => 'Perjalanan dimulai. GPS pelacakan aktif!',
            'data'    => $trip->fresh(['combat']),
        ]);
    }

    /**
     * 4. Menerima Ping Koordinat GPS dari HP Driver
     */
    public function pingGpsCoordinate(Request $request, string $token)
    {
        $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'speed'     => 'nullable|numeric',
            'accuracy'  => 'nullable|numeric',
        ]);

        $trip = CombatTrip::where('tracking_token', $token)->firstOrFail();

        // Hanya simpan koordinat jika statusnya sedang IN_TRANSIT
        if ($trip->status !== 'IN_TRANSIT') {
            return response()->json(['message' => 'Pelacakan tidak aktif untuk tugas ini.'], 400);
        }

        DB::transaction(function () use ($trip, $request) {
            // A. Simpan titik histori ke tabel rekam jejak
            CombatTripCoordinate::create([
                'combat_trip_id' => $trip->id,
                'latitude'       => $request->latitude,
                'longitude'      => $request->longitude,
                'speed'          => $request->speed,
                'accuracy'       => $request->accuracy,
                'recorded_at'    => now(),
            ]);

            // B. Update posisi live koordinat di tabel Master COMBAT (format: lat;lng)
            if ($trip->combat) {
                $trip->combat->update([
                    'long_lat' => $request->latitude . ';' . $request->longitude,
                ]);
            }
        });

        return response()->json(['status' => 'SUCCESS', 'message' => 'Koordinat tersimpan.']);
    }

    /**
     * 5. Driver Menekan Tombol "Tiba di Lokasi / Onsite"
     */
    public function completeTripByDriver(Request $request, string $token)
    {
        $request->validate([
            'final_latitude'  => 'required|numeric|between:-90,90',
            'final_longitude' => 'required|numeric|between:-180,180',
        ]);

        $trip = CombatTrip::where('tracking_token', $token)->firstOrFail();

        DB::transaction(function () use ($trip, $request) {
            // Selesaikan sesi trip
            $trip->update([
                'status'   => 'COMPLETED',
                'ended_at' => now(),
            ]);

            // Ubah status COMBAT menjadi ONSITE dan kunci lokasinya
            if ($trip->combat) {
                $trip->combat->update([
                    'long_lat'        => $request->final_latitude . ';' . $request->final_longitude,
                    'status_combat'   => 'ONSITE',
                    'lokasi_saat_ini' => $trip->destination_name,
                ]);
            }
        });

        return response()->json(['message' => 'Unit COMBAT telah tiba di lokasi. Tracking selesai!']);
    }
}