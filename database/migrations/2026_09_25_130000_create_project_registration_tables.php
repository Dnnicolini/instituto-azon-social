<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->boolean('registration_enabled')->default(false)->after('body')->index();
            $table->string('registration_type', 20)->nullable()->after('registration_enabled');
            $table->string('registration_url', 2048)->nullable()->after('registration_type');
            $table->timestamp('registration_start_at')->nullable()->after('registration_url')->index();
            $table->timestamp('registration_end_at')->nullable()->after('registration_start_at')->index();
            $table->text('registration_instructions')->nullable()->after('registration_end_at');
            $table->string('registration_button_label', 80)->default('Inscreva-se')->after('registration_instructions');
        });

        Schema::create('project_registration_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->longText('instructions')->nullable();
            $table->unsignedInteger('max_applications')->nullable();
            $table->boolean('allow_editing')->default(false);
            $table->timestamp('edit_deadline')->nullable();
            $table->boolean('requires_authentication')->default(false);
            $table->boolean('one_per_user')->default(true);
            $table->text('success_message')->nullable();
            $table->text('confirmation_message')->nullable();
            $table->timestamps();
        });

        Schema::create('project_registration_forms', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
        });

        Schema::create('project_registration_fields', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('form_id')->constrained('project_registration_forms')->cascadeOnDelete();
            $table->string('type', 30);
            $table->string('label');
            $table->string('identifier', 80);
            $table->text('description')->nullable();
            $table->string('placeholder')->nullable();
            $table->boolean('required')->default(false);
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('options')->nullable();
            $table->json('validations')->nullable();
            $table->unsignedInteger('max_length')->nullable();
            $table->json('allowed_mime_types')->nullable();
            $table->unsignedInteger('max_file_size_kb')->nullable();
            $table->decimal('min_value', 15, 4)->nullable();
            $table->decimal('max_value', 15, 4)->nullable();
            $table->timestamps();
            $table->unique(['form_id', 'identifier']);
            $table->index(['form_id', 'sort_order']);
        });

        Schema::create('project_applications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('protocol', 32)->nullable()->unique();
            $table->string('status', 40)->default('draft')->index();
            $table->string('applicant_name')->nullable()->index();
            $table->string('applicant_email')->nullable()->index();
            $table->string('applicant_cpf', 14)->nullable()->index();
            $table->timestamp('submitted_at')->nullable()->index();
            $table->string('ip_hash', 64)->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['project_id', 'status', 'created_at']);
            $table->index(['project_id', 'user_id']);
        });

        Schema::create('project_application_answers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained('project_applications')->cascadeOnDelete();
            $table->foreignId('field_id')->constrained('project_registration_fields')->restrictOnDelete();
            $table->json('value')->nullable();
            $table->timestamps();
            $table->unique(['application_id', 'field_id']);
        });

        Schema::create('project_application_files', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained('project_applications')->cascadeOnDelete();
            $table->foreignId('field_id')->constrained('project_registration_fields')->restrictOnDelete();
            $table->string('disk')->default('local');
            $table->string('path')->unique();
            $table->string('original_name');
            $table->string('mime_type', 150);
            $table->unsignedBigInteger('size');
            $table->timestamps();
            $table->unique(['application_id', 'field_id']);
        });

        Schema::create('project_application_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('application_id')->constrained('project_applications')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event', 60)->index();
            $table->string('from_status', 40)->nullable();
            $table->string('to_status', 40)->nullable();
            $table->text('note')->nullable();
            $table->boolean('is_internal')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['application_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_application_histories');
        Schema::dropIfExists('project_application_files');
        Schema::dropIfExists('project_application_answers');
        Schema::dropIfExists('project_applications');
        Schema::dropIfExists('project_registration_fields');
        Schema::dropIfExists('project_registration_forms');
        Schema::dropIfExists('project_registration_settings');

        Schema::table('projects', function (Blueprint $table): void {
            $table->dropColumn([
                'registration_enabled', 'registration_type', 'registration_url', 'registration_start_at',
                'registration_end_at', 'registration_instructions', 'registration_button_label',
            ]);
        });
    }
};
