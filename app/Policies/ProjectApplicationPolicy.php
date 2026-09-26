<?php

namespace App\Policies;

use App\Models\ProjectApplication;
use App\Models\User;

class ProjectApplicationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('applications.view');
    }

    public function view(User $user, ProjectApplication $application): bool
    {
        return $application->user_id === $user->id || $user->hasPermission('applications.view');
    }

    public function update(User $user, ProjectApplication $application): bool
    {
        return $user->hasPermission('applications.manage');
    }

    public function editOwn(User $user, ProjectApplication $application): bool
    {
        return $application->user_id === $user->id;
    }
}
