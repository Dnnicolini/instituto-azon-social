<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('cms:publish-scheduled')->everyMinute()->withoutOverlapping();
Schedule::command('instagram:sync')->everyTenMinutes()->withoutOverlapping(9);
Schedule::command('instagram:refresh-token')->weeklyOn(1, '03:30')->withoutOverlapping(30);
