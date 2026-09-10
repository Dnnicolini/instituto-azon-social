<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AuthorizationSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class CreateAdminCommand extends Command
{
    protected $signature = 'azon:create-admin {email? : E-mail do administrador}';

    protected $description = 'Cria ou promove o primeiro administrador sem versionar credenciais';

    public function handle(): int
    {
        $this->call('db:seed', ['--class' => AuthorizationSeeder::class, '--force' => true]);

        $email = Str::lower((string) ($this->argument('email') ?: $this->ask('E-mail')));
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Informe um e-mail válido.');

            return self::FAILURE;
        }

        $user = User::query()->where('email', $email)->first();
        if (! $user) {
            $name = (string) $this->ask('Nome');
            $password = (string) $this->secret('Senha forte');
            $validator = validator(['name' => $name, 'password' => $password], [
                'name' => ['required', 'string', 'max:255'],
                'password' => ['required', Password::min(12)->mixedCase()->numbers()->symbols()],
            ]);
            if ($validator->fails()) {
                $this->error($validator->errors()->first());

                return self::FAILURE;
            }

            $user = new User([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        $role = Role::query()->where('slug', 'administrator')->firstOrFail();
        $user->roles()->syncWithoutDetaching([$role->id]);

        $this->info("Administrador pronto: {$email}");

        return self::SUCCESS;
    }
}
