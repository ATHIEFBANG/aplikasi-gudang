<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 🟢 Tambahkan kolom role dengan pilihan: admin, staff, view (default: view)
            $table->enum('role', ['admin', 'staff', 'view'])
                  ->default('view')
                  ->after('email'); // ditaruh persis setelah kolom email
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 🔴 Hapus kolom role jika migration di-rollback
            $table->dropColumn('role');
        });
    }
};