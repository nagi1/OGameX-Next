<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('module_entity_data', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 32);
            $table->unsignedBigInteger('entity_id');
            $table->string('module', 32);
            $table->string('key', 64);
            $table->json('value')->nullable();
            $table->timestamps();

            $table->unique(['entity_type', 'entity_id', 'module', 'key'], 'module_entity_data_unique');
            $table->index(['entity_type', 'entity_id', 'module']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_entity_data');
    }
};
