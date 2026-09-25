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
        return $this->canManageTarget($user, $target)
            && ($user->isNot($target) || $user->hasRole('administrator'));
    }

    public function delete(User $user, User $target): bool
    {
        return $this->canManageTarget($user, $target) && $user->isNot($target);
    }

    public function updateStatus(User $user, User $target): bool
    {
        return $this->canManageTarget($user, $target) && $user->isNot($target);
    }

    public function sendPasswordReset(User $user, User $target): bool
    {
        return $this->canManageTarget($user, $target);
    }

    private function canManageTarget(User $user, User $target): bool
    {
        if (! $user->hasPermission('users.manage')) {
            return false;
        }

        return $user->hasRole('administrator') || ! $target->hasRole('administrator');
    }
}
