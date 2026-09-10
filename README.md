# Instituto Azon Social

Site institucional do Instituto Azon Social, migrado para a stack oficial mais recente do Laravel com React e renderização preparada para SEO.

## Stack

- Laravel 13
- PHP 8.4.1 ou superior
- React 19 com TypeScript
- Inertia 3 com SSR
- Tailwind CSS 4
- Vite+ 0.3
- Pest 5, Pint e Larastan/PHPStan
- Node.js 22.13 ou superior

## Instalação local

```bash
composer setup
composer run dev
```

O comando de desenvolvimento inicia Laravel, filas, logs, Vite e o processo SSR do Inertia. A aplicação usa SQLite por padrão.

## Publicação

Configure o ambiente publicado com `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` apontando para o domínio definitivo e `APP_TIMEZONE=America/Sao_Paulo`. Depois do build SSR, mantenha `php artisan inertia:start-ssr` em execução por um supervisor de processos; sem esse processo, os metadados essenciais continuam no HTML, mas o corpo React não é pré-renderizado no servidor.

## Verificações

```bash
composer ci:check
npm run build:ssr
```

## Rotas

- `/`: página institucional
- `/eventos`: eventos, inscrições e oportunidades
- `/admin/login` e `/admin`: demonstração visual do futuro painel, sem autenticação, persistência ou dados reais
- `/robots.txt`: regras para mecanismos de busca
- `/sitemap.xml`: mapa das páginas públicas indexáveis

## SEO

Cada página pública define título, descrição, canonical, Open Graph, Twitter Card e JSON-LD. A home publica dados estruturados de organização e website; eventos publica dados de coleção e do Sabeje Sepetiba 2026. As rotas administrativas usam `noindex, nofollow` e são excluídas do sitemap.

`APP_URL` é a origem canônica. Atualize essa variável quando o Laravel for publicado em um domínio diferente.

## Conteúdo institucional

Os contatos usados no código são os mesmos da versão pública atual:

- `instituto.azonsocial@gmail.com`
- `(21) 95101-5058`
- Sepetiba, Rio de Janeiro — RJ
- Instagram: `@azon.social` e `@azonlegidan`

O formulário de contato ainda é apenas demonstrativo e não envia mensagens. As artes de eventos foram preservadas do projeto original.
