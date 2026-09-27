<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dispatch_log_actions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->boolean('is_system_action')->default(false);
            $table->timestamps();
        });

        // Insert default actions
        $actions = [
            ['name' => 'Incident Created', 'is_system_action' => true],
            ['name' => 'Incident Updated', 'is_system_action' => false],
            ['name' => 'Incident Status Changed', 'is_system_action' => false],
            ['name' => 'Dispatch Created', 'is_system_action' => false],
            ['name' => 'Dispatch Status Changed', 'is_system_action' => false],
            ['name' => 'Unit Enroute', 'is_system_action' => false],
            ['name' => 'Unit Arrived', 'is_system_action' => false],
            ['name' => 'Unit Returning', 'is_system_action' => false],
            ['name' => 'Unit Available', 'is_system_action' => false],
            ['name' => 'Responder Assigned', 'is_system_action' => false],
            ['name' => 'Responder Removed', 'is_system_action' => false],
            ['name' => 'Ambulance Assigned', 'is_system_action' => false],
            ['name' => 'Patient Care Record Added', 'is_system_action' => false],
            ['name' => 'Note Added', 'is_system_action' => false],
        ];

        foreach ($actions as $action) {
            $action['created_at'] = now();
            $action['updated_at'] = now();
            DB::table('dispatch_log_actions')->insert($action);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('dispatch_log_actions');
    }
};
