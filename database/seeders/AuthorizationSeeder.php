<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class AuthorizationSeeder extends Seeder
{
    /** @var array<string, array{string, string}> */
    private array $permissions = [
        'access-admin' => ['Acessar painel', 'painel'],
        'content.view' => ['Ver conteúdos', 'conteúdo'],
        'content.create' => ['Criar conteúdos', 'conteúdo'],
        'content.update' => ['Editar conteúdos', 'conteúdo'],
        'content.publish' => ['Publicar e agendar conteúdos', 'conteúdo'],
        'content.delete' => ['Excluir conteúdos', 'conteúdo'],
        'media.manage' => ['Gerenciar mídia', 'mídia'],
        'users.manage' => ['Gerenciar usuários', 'acesso'],
        'roles.manage' => ['Gerenciar grupos e permissões', 'acesso'],
        'settings.manage' => ['Gerenciar configurações', 'configuração'],
        'instagram.manage' => ['Administrar contas do Instagram', 'integrações'],
        'instagram.sync' => ['Sincronizar contas do Instagram', 'integrações'],
        'instagram.curate' => ['Realizar curadoria do Instagram', 'integrações'],
        'messages.view' => ['Ver mensagens', 'mensagens'],
        'messages.manage' => ['Tratar e excluir mensagens', 'mensagens'],
        'applications.view' => ['Ver candidaturas', 'inscrições'],
        'applications.manage' => ['Gerenciar candidaturas', 'inscrições'],
    ];

    public function run(): void
    {
        foreach ($this->permissions as $slug => [$name, $group]) {
            Permission::query()->updateOrCreate(['slug' => $slug], compact('name', 'group'));
        }

        $roles = [
            'administrator' => ['Administrador', array_keys($this->permissions)],
            'editor' => ['Editor', ['access-admin', 'content.view', 'content.create', 'content.update', 'media.manage']],
            'publisher' => ['Publicador', ['access-admin', 'content.view', 'content.create', 'content.update', 'content.publish', 'content.delete', 'media.manage', 'instagram.curate']],
        ];

        foreach ($roles as $slug => [$name, $permissions]) {
            $role = Role::query()->updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'description' => "Grupo de sistema: {$name}", 'is_system' => true],
            );
            $role->permissions()->sync(Permission::query()->whereIn('slug', $permissions)->pluck('id'));
        }
    }
}
