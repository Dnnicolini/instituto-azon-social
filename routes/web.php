<?php

use App\Http\Controllers\Admin\ContactMessageController as AdminContactMessageController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DocumentController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\InstagramIntegrationController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\SitePageController;
use Illuminate\Support\Facades\Route;

Route::controller(SitePageController::class)->group(function (): void {
    Route::get('/', 'home')->name('home');
    Route::get('/eventos', 'events')->name('events');
    Route::get('/midia', 'media')->name('media.index');
    Route::get('/midia/{post:slug}', 'mediaShow')->name('media.show');
    Route::get('/noticias/{post:slug}', 'articleShow')->name('articles.show');
    Route::get('/pagina/{slug}', 'page')->name('pages.show');
    Route::get('/podcast.xml', 'podcast')->name('podcast');
    Route::get('/robots.txt', 'robots')->name('robots');
    Route::get('/sitemap.xml', 'sitemap')->name('sitemap');
});
Route::post('/contato', [ContactController::class, 'store'])->middleware('throttle:5,10')->name('contact.store');

Route::prefix('admin')->middleware('noindex')->group(function (): void {
    Route::middleware('guest')->group(function (): void {
        Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('admin.login');
        Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('admin.login.store');
        Route::get('/esqueci-senha', [PasswordResetLinkController::class, 'create'])->name('admin.password.request');
        Route::post('/esqueci-senha', [PasswordResetLinkController::class, 'store'])->middleware('throttle:3,10')->name('admin.password.email');
        Route::get('/redefinir-senha/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
        Route::post('/redefinir-senha', [NewPasswordController::class, 'store'])->middleware('throttle:5,1')->name('password.store');
    });

    Route::get('/verificar-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])->middleware(['signed', 'throttle:6,1'])->name('verification.verify');

    Route::middleware(['auth', 'auth.session'])->group(function (): void {
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('admin.logout');
        Route::get('/verificar-email', [EmailVerificationController::class, 'notice'])->name('verification.notice');
        Route::post('/verificar-email/enviar', [EmailVerificationController::class, 'send'])->middleware('throttle:6,1')->name('verification.send');
    });

    Route::middleware(['auth', 'auth.session', 'verified', 'permission:access-admin'])->name('admin.')->group(function (): void {
        Route::get('/', DashboardController::class)->name('dashboard');
        Route::resource('posts', PostController::class)->except('show');
        Route::resource('projetos', ProjectController::class)->except('show')->parameters(['projetos' => 'project'])->names('projects');
        Route::resource('eventos', EventController::class)->except('show')->parameters(['eventos' => 'event'])->names('events');
        Route::resource('documentos', DocumentController::class)->except('show')->parameters(['documentos' => 'document'])->names('documents');
        Route::resource('paginas', PageController::class)->except('show')->parameters(['paginas' => 'page'])->names('pages');
        Route::get('/configuracoes', [SettingsController::class, 'edit'])->name('settings.edit');
        Route::put('/configuracoes', [SettingsController::class, 'update'])->name('settings.update');
        Route::get('/integracoes/instagram/conectar', [InstagramIntegrationController::class, 'connect'])->name('instagram.connect');
        Route::get('/integracoes/instagram/retorno', [InstagramIntegrationController::class, 'callback'])->name('instagram.callback');
        Route::post('/integracoes/instagram/sincronizar', [InstagramIntegrationController::class, 'sync'])->middleware('throttle:3,1')->name('instagram.sync');
        Route::delete('/integracoes/instagram', [InstagramIntegrationController::class, 'disconnect'])->name('instagram.disconnect');
        Route::resource('mensagens', AdminContactMessageController::class)->only(['index', 'update', 'destroy'])->parameters(['mensagens' => 'message'])->names('messages');
        Route::resource('usuarios', UserController::class)->only(['index', 'store', 'update', 'destroy'])->parameters(['usuarios' => 'user'])->names('users');
        Route::resource('grupos', RoleController::class)->only(['index', 'store', 'update', 'destroy'])->parameters(['grupos' => 'role'])->names('roles');
    });
});
