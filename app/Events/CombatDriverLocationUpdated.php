<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CombatDriverLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int|string $trip_id;
    public int|string|null $combat_master_id;
    public float $latitude;
    public float $longitude;
    public float $speed;
    public ?float $accuracy;
    public string $driver_name;
    public string $status;
    public string $recorded_at;

    public function __construct(mixed $trip, float $latitude, float $longitude, float $speed = 0, ?float $accuracy = null)
    {
        $this->trip_id          = $trip->id;
        $this->combat_master_id = $trip->combat_master_id;
        $this->latitude         = (float) $latitude;
        $this->longitude        = (float) $longitude;
        $this->speed            = (float) $speed;
        $this->accuracy         = $accuracy ? (float) $accuracy : null;
        $this->driver_name      = $trip->pic_name ?? 'Driver';
        $this->status           = $trip->status ?? 'IN_TRANSIT';
        $this->recorded_at      = now()->format('H:i:s');
    }

    /**
     * Nama Channel Publik WebSocket
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('combat-tracking'),
            new Channel('combat-trip.' . $this->trip_id),
        ];
    }

    /**
     * Nama Event yang didengar oleh React
     */
    public function broadcastAs(): string
    {
        return 'driver.location.updated';
    }
}