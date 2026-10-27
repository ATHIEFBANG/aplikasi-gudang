<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    public const ROLE_ADMIN = 'admin';
    public const ROLE_SUPERVISI = 'supervisi';
    public const ROLE_PELAKSANA = 'pelaksana';

    public const ROLES = [
        self::ROLE_ADMIN,
        self::ROLE_SUPERVISI,
        self::ROLE_PELAKSANA,
    ];

    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isSupervisi(): bool
    {
        return $this->role === self::ROLE_SUPERVISI;
    }

    public function isPelaksana(): bool
    {
        return $this->role === self::ROLE_PELAKSANA;
    }

    /**
     * Role staff/view adalah nilai lama yang perlu dipetakan secara eksplisit.
     * Jangan otomatis menaikkan hak akses akun lama tanpa keputusan Admin.
     */
    public function hasLegacyRole(): bool
    {
        return in_array($this->role, ['staff', 'view'], true);
    }

    public function transaksis(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'pic_user_id');
    }

    public function stockLogs(): HasMany
    {
        return $this->hasMany(StockLog::class);
    }
}