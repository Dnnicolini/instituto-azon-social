# Instituto Azon Social

Site institucional e CMS do Instituto Azon Social em Laravel, React e Inertia, com renderização SSR preparada para SEO. O painel é privado; não existe cadastro público.

## Stack

- Laravel 13 e PHP 8.4.1+
- React 19 e TypeScript
- Inertia 3 com SSR
- Tailwind CSS 4 e Vite+ 0.3
- Pest 5, Pint, Larastan/PHPStan e Playwright
- Node.js 22.13+

## Instalação local

```bash
composer setup
php artisan db:seed
php artisan azon:create-admin seu-email@exemplo.org
composer run dev
```

`composer setup` instala as dependências, cria o `.env` e o banco SQLite quando necessário, gera a chave da aplicação, executa as migrations, cria o link público de uploads e gera o build SSR. O comando `azon:create-admin` solicita nome e senha forte sem gravar a senha no repositório ou nos argumentos do processo.

## Conteúdo e acesso

O CMS administra:

- notícias, vlogs, vídeos e podcasts;
- projetos e eventos;
- documentos de transparência;
- páginas e seções estruturadas da página inicial;
- configurações e contatos institucionais;
- mensagens enviadas pelo formulário;
- usuários, grupos e permissões.

Os grupos de sistema são:

- `Administrador`: acesso total, inclusive CRM, usuários, grupos e configurações;
- `Editor`: cria e edita rascunhos, sem publicar;
- `Publicador`: publica, agenda e arquiva conteúdo, sem acesso ao CRM;

Grupos personalizados podem ser criados pelo administrador. O backend aplica todas as permissões por middleware e Policies; ocultar uma opção na interface não é usado como mecanismo de segurança. O último administrador não pode ser removido ou rebaixado, e gestores delegados não podem conceder o grupo Administrador.

## Rotas públicas

- `/`: página institucional dinâmica;
- `/eventos`: agenda e inscrições;
- `/midia`: biblioteca de vlogs, vídeos e podcasts;
- `/midia/{slug}`: conteúdo audiovisual;
- `/noticias/{slug}`: artigo institucional;
- `/podcast.xml`: feed RSS dos episódios publicados;
- `/pagina/{slug}`: páginas adicionais publicadas;
- `/robots.txt` e `/sitemap.xml`: descoberta para buscadores.

`/admin` e todas as rotas abaixo dele exigem autenticação, verificação de e-mail e permissão. Elas enviam `noindex, nofollow` e `X-Robots-Tag`; o público só consegue enviar o formulário de contato. O Instagram oficial é [@azon.social](https://www.instagram.com/azon.social/) e permanece apenas como link institucional, sem sincronização de posts, destaques ou API.

## Publicação agendada

O Laravel Scheduler executa `cms:publish-scheduled` a cada minuto, com proteção contra sobreposição. No servidor, configure um único cron para chamar o scheduler:

```cron
* * * * * cd /caminho/do/projeto && php artisan schedule:run >> /dev/null 2>&1
```

Mantenha também os processos de fila e `php artisan inertia:start-ssr` sob um supervisor. Em produção, use `APP_ENV=production`, `APP_DEBUG=false`, HTTPS, cookies seguros, backup do banco e armazenamento persistente para `storage/app/public`. `APP_URL` deve apontar para o domínio canônico e `APP_TIMEZONE` para `America/Sao_Paulo`.

## Verificações

```bash
composer test
npm run check
npm run types:check
npm run build:ssr
npm run test:e2e
composer validate --strict
composer audit
npm audit
```

Os testes de navegador usam Chromium. Em uma estação que já possua o Chrome, é possível apontar o executável:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npm run test:e2e
```

## SEO e dados

As páginas públicas definem título, descrição, canonical, Open Graph, Twitter Card e JSON-LD. O sitemap inclui somente conteúdo publicado; rascunhos, itens agendados para o futuro e páginas administrativas ficam de fora.

O seed inicial preserva as informações institucionais conhecidas e não cria usuários nem credenciais. Contatos públicos atuais:

- `instituto.azonsocial@gmail.com`;
- `(21) 95101-5058`;
- Sepetiba, Rio de Janeiro — RJ;
- Instagram: [@azon.social](https://www.instagram.com/azon.social/).
