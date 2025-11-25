<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transaction_photos', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number'); // Relasi ke transaction
            $table->string('file_path'); // Lokasi file disimpan (misal: photos/abc.jpg)
            $table->string('type')->default('photo'); // 'photo' atau 'gif'
            $table->timestamps();

            // Foreign key (opsional, tapi bagus untuk integritas data)
            $table->foreign('invoice_number')
                  ->references('invoice_number')
                  ->on('transactions')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_photos');
    }
};
