<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('users.manage');
    }

    public function update(User $user, User $target): bool
    {
        return $user->hasPermission('users.manage') && ($user->isNot($target) || $user->hasRole('administrator'));
    }

    public function delete(User $user, User $target): bool
    {
        return $user->hasPermission('users.manage') && $user->isNot($target);
    }
}
