<?php

use App\Models\ResponderProfile;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

ResponderProfile::where('availability', 'busy')->update(['availability' => 'available']);
echo "Updated all responders to available.\n";
