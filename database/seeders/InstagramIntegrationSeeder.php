<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\SocialIntegration;
use App\Support\ChannelCatalog;
use Illuminate\Database\Seeder;

class InstagramIntegrationSeeder extends Seeder
{
    public function run(): void
    {
        foreach (ChannelCatalog::all() as $slug => $profile) {
            $integration = $this->findOrCreate(
                $profile['title'],
                $profile['username'],
                $profile['group_key'],
                $profile['sort_order'],
                $profile['description'],
                ['home', 'social_feed', $profile['display_location']],
            );

            Page::query()
                ->where('slug', $slug)
                ->whereNull('social_integration_id')
                ->update(['social_integration_id' => $integration->id]);
        }

        $this->findOrCreate(
            'Instituto Azon Social',
            'azon.social',
            'instituto-azon-social',
            50,
            'Perfil institucional do Instituto Azon Social.',
            ['home', 'social_feed'],
        );
    }

    /** @param list<string> $locations */
    private function findOrCreate(
        string $displayName,
        string $username,
        string $groupKey,
        int $sortOrder,
        string $description,
        array $locations = ['home', 'social_feed'],
    ): SocialIntegration {
        $integration = SocialIntegration::query()
            ->where('provider', 'instagram')
            ->where(function ($query) use ($username): void {
                $query->where('expected_username', $username)->orWhere('username', $username);
            })
            ->first();

        $values = [
            'display_name' => $displayName,
            'expected_username' => $username,
            'description' => $description,
            'group_key' => $groupKey,
            'sort_order' => $sortOrder,
        ];

        if ($integration) {
            $integration->fill(array_filter(
                $values,
                fn (mixed $value, string $key): bool => blank($integration->{$key}),
                ARRAY_FILTER_USE_BOTH,
            ));
            if (blank($integration->display_locations)) {
                $integration->display_locations = $locations;
            }
            $integration->save();

            return $integration;
        }

        return SocialIntegration::query()->create([
            'provider' => 'instagram',
            ...$values,
            'display_locations' => $locations,
            'public_enabled' => true,
            'auto_publish' => false,
        ]);
    }
}
