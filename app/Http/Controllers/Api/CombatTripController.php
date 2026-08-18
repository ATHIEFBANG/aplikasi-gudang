<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CombatMaster;
use App\Models\CombatTrip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CombatTripController extends Controller
{
    /**
     * 1. ADMIN/OPERATOR: Membuat Tugas Mobilisasi Baru (Dispatch)
     */
    public function createTrip(Request $request)
    {
        $combatId        = $request->input('combat_master_id') ?? $request->input('combat_id');
        $destinationName = $request->input('destination_name') ?? $request->input('destination');
        $originName      = $request->input('origin_name') ?? 'Gudang / Basecamp';

        $request->merge([
            'combat_master_id' => $combatId,
            'destination_name' => $destinationName,
        ]);

        $request->validate([
            'combat_master_id' => 'required|exists:combat_masters,id',
            'destination_name' => 'required|string|max:255',
            'pic_name'         => 'required|string|max:255',
            'pic_phone'        => 'nullable|string|max:50',
            'origin_name'      => 'nullable|string|max:255',
            'jenis_rute'       => 'nullable|string|max:100',
            'ip_gps'           => 'nullable|string|max:100',
            'destination_lat'  => 'nullable|numeric',
            'destination_lng'  => 'nullable|numeric',
        ]);

        $activeTrip = CombatTrip::where('combat_master_id', $combatId)
            ->whereIn('status', ['ASSIGNED', 'IN_TRANSIT'])
            ->first();

        if ($activeTrip) {
            return response()->json(['message' => 'Unit COMBAT ini sedang dalam status penugasan aktif!'], 400);
        }

        $trip = DB::transaction(function () use ($request, $combatId, $destinationName, $originName) {
            $newTrip = CombatTrip::create([
                'combat_master_id'   => $combatId,
                'pic_user_id'        => $request->user()?->id,
                'pic_name'           => $request->pic_name,
                'pic_phone'          => $request->input('pic_phone') ?? '-',
                'origin_name'        => $originName,
                'destination_name'   => $destinationName,
                'destination_lat'    => $request->destination_lat,
                'destination_lng'    => $request->destination_lng,
                'ip_gps'             => $request->input('jenis_rute') ?? $request->ip_gps ?? 'DEPLOY',
                'status'             => 'ASSIGNED',
            ]);

            return $newTrip;
        });

        $trackingUrl = url('/track/' . $trip->tracking_token);

        return response()->json([
            'message'      => 'Tugas mobilisasi berhasil dibuat untuk PIC Driver!',
            'data'         => $trip->load('combat'),
            'tracking_url' => $trackingUrl,
        ], 201);
    }

    /**
     * 2. DASHBOARD: Mengambil Informasi Trip Aktif Terkini
     */
    public function getActiveTrip(Request $request)
    {
        $activeTrip = CombatTrip::with(['combat', 'latestCoordinate'])
            ->whereIn('status', ['ASSIGNED', 'IN_TRANSIT'])
            ->latest('id')
            ->first();

        if ($activeTrip && $activeTrip->combat && $activeTrip->combat->long_lat && str_contains($activeTrip->combat->long_lat, ';')) {
            $coords = explode(';', $activeTrip->combat->long_lat);
            $activeTrip->combat->latitude = (float) trim($coords[0]);
            $activeTrip->combat->longitude = (float) trim($coords[1]);
        }

        return response()->json(['data' => $activeTrip]);
    }

    /**
     * 3. DASHBOARD: Endpoint Ringan untuk Polling Posisi Live di Peta
     */
    public function getLivePositions()
    {
        $activeTrip = CombatTrip::with(['combat:id,asset_name,sn,status_combat,long_lat', 'latestCoordinate'])
            ->where('status', 'IN_TRANSIT')
            ->latest('id')
            ->first();

        if (!$activeTrip) {
            return response()->json([
                'active_trip' => null,
                'combats'     => null,
            ]);
        }

        if ($activeTrip->combat && $activeTrip->combat->long_lat && str_contains($activeTrip->combat->long_lat, ';')) {
            $coords = explode(';', $activeTrip->combat->long_lat);
            $activeTrip->combat->latitude = (float) trim($coords[0]);
            $activeTrip->combat->longitude = (float) trim($coords[1]);
        }

        return response()->json([
            'active_trip'  => $activeTrip,
            'latest_coord' => $activeTrip->latestCoordinate,
        ]);
    }
    
    /**
     * 4. ADMIN: Membatalkan Penugasan Trip
     */
    public function cancelTrip($id)
    {
        $trip = CombatTrip::findOrFail($id);

        if (in_array($trip->status, ['ASSIGNED', 'IN_TRANSIT'])) {
            DB::transaction(function () use ($trip) {
                $trip->update([
                    'status'   => 'CANCELLED',
                    'ended_at' => now(),
                ]);

                if ($trip->combat) {
                    $trip->combat->update(['status_combat' => 'READY TO USE']);
                }
            });

            return response()->json([
                'message' => 'Penugasan berhasil dibatalkan dan status unit kembali READY TO USE.'
            ]);
        }

        return response()->json(['message' => 'Perjalanan sudah selesai atau telah dibatalkan sebelumnya.'], 400);
    }

    /**
     * 5. RIWAYAT: Mengambil Seluruh Histori Perjalanan (Query Cepat & Lengkap)
     */
    public function getAllTripsHistory(Request $request)
    {
        $search  = $request->input('search');
        $perPage = (int) $request->input('per_page', 50);

        $query = CombatTrip::with([
            'combat:id,asset_name,sn,type_combat,ketinggian_combat'
        ])
        ->select([
            'id', 'tracking_token', 'combat_master_id', 'pic_user_id',
            'pic_name', 'pic_phone', 'origin_name', 'destination_name',
            'destination_lat', 'destination_lng', 'ip_gps', 'status', 
            'started_at', 'ended_at', 'created_at'
        ])
        ->latest('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('combat', function ($qc) use ($search) {
                    $qc->where('asset_name', 'like', "%{$search}%")
                       ->orWhere('sn', 'like', "%{$search}%")
                       ->orWhere('type_combat', 'like', "%{$search}%");
                })
                ->orWhere('destination_name', 'like', "%{$search}%")
                ->orWhere('origin_name', 'like', "%{$search}%")
                ->orWhere('pic_name', 'like', "%{$search}%")
                ->orWhere('ip_gps', 'like', "%{$search}%");
            });
        }

        $trips = $query->paginate($perPage);

        return response()->json($trips);
    }

    /**
     * 6. PETA: Mengambil Seluruh Titik Koordinat Rute
     */
    public function getTripRoute($id)
    {
        $trip = CombatTrip::with(['combat', 'coordinates'])->findOrFail($id);

        $geoJsonCoords = $trip->coordinates->map(fn ($c) => [
            (float) $c->longitude, 
            (float) $c->latitude,  
        ])->values();

        return response()->json([
            'data' => [
                'trip'        => $trip,
                'coordinates' => $geoJsonCoords,
            ]
        ]);
    }

    /**
     * 7. ADMIN: Mengedit Data Penugasan / Perjalanan (MENYIMPAN SEMUA KOLOM TERMASUK ASAL & JENIS RUTE)
     */
    public function updateTrip(Request $request, $id)
    {
        $trip = CombatTrip::findOrFail($id);

        $request->validate([
            'destination_name' => 'required|string|max:255',
            'origin_name'      => 'nullable|string|max:255',
            'destination_lat'  => 'nullable|numeric',
            'destination_lng'  => 'nullable|numeric',
            'pic_name'         => 'required|string|max:255',
            'pic_phone'        => 'nullable|string|max:50',
            'jenis_rute'       => 'nullable|string|max:100',
            'ip_gps'           => 'nullable|string|max:100',
        ]);

        $trip->update([
            'origin_name'      => $request->origin_name ?? $trip->origin_name,
            'destination_name' => $request->destination_name,
            'destination_lat'  => $request->destination_lat,
            'destination_lng'  => $request->destination_lng,
            'pic_name'         => $request->pic_name,
            'pic_phone'        => $request->pic_phone ?? $trip->pic_phone ?? '-',
            'ip_gps'           => $request->input('jenis_rute') ?? $request->ip_gps ?? $trip->ip_gps ?? 'DEPLOY',
        ]);

        return response()->json([
            'message' => 'Data perjalanan berhasil diperbarui.',
            'data'    => $trip->fresh()->load('combat')
        ]);
    }

    /**
     * 8. ADMIN: Menghapus Riwayat Perjalanan
     */
    public function destroyTrip($id)
    {
        $trip = CombatTrip::findOrFail($id);

        if (in_array($trip->status, ['ASSIGNED', 'IN_TRANSIT']) && $trip->combat) {
            $trip->combat->update(['status_combat' => 'READY TO USE']);
        }

        $trip->delete();

        return response()->json(['message' => 'Riwayat perjalanan berhasil dihapus.']);
    }

    /**
     * 9. DRIVER: Memulai perjalanan
     */
    public function startTrip($token)
    {
        $trip = CombatTrip::where('tracking_token', $token)->firstOrFail();

        if ($trip->status !== 'ASSIGNED') {
            return response()->json(['message' => 'Trip ini sudah dimulai atau selesai.'], 400);
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

        return response()->json(['message' => 'Perjalanan berhasil dimulai.']);
    }

    /**
     * 10. DRIVER: Menerima Ping Koordinat GPS Berkala
     */
    public function ping(Request $request, $token)
    {
        $request->validate([
            'latitude'  => 'required|numeric',
            'longitude' => 'required|numeric',
            'speed'     => 'nullable|numeric',
            'accuracy'  => 'nullable|numeric',
        ]);

        $trip = CombatTrip::where('tracking_token', $token)
                          ->where('status', 'IN_TRANSIT')
                          ->firstOrFail();

        DB::transaction(function () use ($request, $trip) {
            $trip->coordinates()->create([
                'latitude'    => $request->latitude,
                'longitude'   => $request->longitude,
                'speed'       => $request->speed ?? 0,
                'accuracy'    => $request->accuracy,
            ]);

            if ($trip->combat) {
                $trip->combat->update([
                    'long_lat' => $request->latitude . ';' . $request->longitude,
                ]);
            }
        });

        return response()->json(['message' => 'Ping GPS diterima.']);
    }

    /**
     * 11. DRIVER: Menyelesaikan perjalanan tiba di lokasi
     */
    public function completeTrip(Request $request, $token)
    {
        $trip = CombatTrip::where('tracking_token', $token)
                          ->where('status', 'IN_TRANSIT')
                          ->firstOrFail();

        DB::transaction(function () use ($request, $trip) {
            $trip->update([
                'status'   => 'COMPLETED',
                'ended_at' => now(),
            ]);

            if ($trip->combat) {
                $destLower = strtolower($trip->destination_name);
                $finalStatus = 'ONSITE';

                if (str_contains($destLower, 'gudang') || str_contains($destLower, 'basecamp') || str_contains($destLower, 'wh')) {
                    $finalStatus = 'READY TO USE';
                } elseif (str_contains($destLower, 'workshop') || str_contains($destLower, 'repair') || str_contains($destLower, 'perbaikan')) {
                    $finalStatus = 'BROKEN';
                }

                $updateData = [
                    'status_combat'   => $finalStatus,
                    'nama_site'       => $trip->destination_name,
                    'lokasi_saat_ini' => $trip->destination_name,
                ];

                if ($request->has('final_latitude') && $request->has('final_longitude')) {
                    $updateData['long_lat'] = $request->final_latitude . ';' . $request->final_longitude;
                }

                $trip->combat->update($updateData);
            }
        });

        return response()->json(['message' => 'Perjalanan selesai.']);
    }
}