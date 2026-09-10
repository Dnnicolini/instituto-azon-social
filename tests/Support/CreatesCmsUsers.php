<?php

namespace Tests\Support;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\AuthorizationSeeder;

trait CreatesCmsUsers
{
    protected function cmsUser(string $role = 'administrator'): User
    {
        $this->seed(AuthorizationSeeder::class);
        $user = User::factory()->create();
        $user->roles()->attach(Role::query()->where('slug', $role)->firstOrFail());

        return $user;
    }
}
