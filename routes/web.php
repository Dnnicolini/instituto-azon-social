<?php

use App\Http\Controllers\SitePageController;
use Illuminate\Support\Facades\Route;

Route::controller(SitePageController::class)->group(function (): void {
    Route::get('/', 'home')->name('home');
    Route::get('/eventos', 'events')->name('events');
    Route::get('/admin/login', 'adminLogin')->name('admin.login');
    Route::get('/admin', 'adminDashboard')->name('admin.dashboard');
    Route::get('/robots.txt', 'robots')->name('robots');
    Route::get('/sitemap.xml', 'sitemap')->name('sitemap');
});
