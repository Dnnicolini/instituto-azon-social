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
- `/calendario`: calendário mensal com detalhes e orientações de participação;
- `/midia`: biblioteca de vlogs, vídeos e podcasts;
- `/midia/{slug}`: conteúdo audiovisual;
- `/noticias/{slug}`: artigo institucional;
- `/podcast.xml`: feed RSS dos episódios publicados;
- `/pagina/{slug}`: páginas adicionais publicadas;
- `/robots.txt`, `/sitemap.xml` e `/llms.txt`: descoberta para buscadores e mecanismos de resposta com IA.

`/admin` e todas as rotas abaixo dele exigem autenticação, verificação de e-mail e permissão. Elas enviam `noindex, nofollow` e `X-Robots-Tag`; o público só consegue enviar o formulário de contato. Em produção, `admin.azonsocial.org.br` abre o CRM e o domínio público encaminha qualquer tentativa de acesso ao painel para esse subdomínio.

## Sincronização do Instagram

O feed oficial [@azon.social](https://www.instagram.com/azon.social/) pode ser conectado por um administrador em **Configurações → Instagram**. A integração usa a API oficial da Meta, salva o token criptografado, copia as imagens para o disco de mídia configurado e preserva o conteúdo anterior se a API estiver indisponível. O scheduler verifica novas publicações a cada dez minutos e renova semanalmente o token de longa duração.

Configuração inicial na Meta:

1. transforme `@azon.social` em conta profissional, se ainda for pessoal;
2. crie um aplicativo do tipo Business no [Meta for Developers](https://developers.facebook.com/apps/);
3. adicione o caso de uso da Instagram API com Instagram Login;
4. informe `https://admin.azonsocial.org.br/admin/integracoes/instagram/retorno` como URI OAuth válida;
5. coloque o Instagram App ID e o App Secret somente no arquivo protegido `/etc/azon/production.env`, como `INSTAGRAM_CLIENT_ID` e `INSTAGRAM_CLIENT_SECRET`;
6. habilite `INSTAGRAM_SYNC_ENABLED=true`, limpe/recrie o cache de configuração e use o botão **Conectar @azon.social** no CRM uma vez.

O aplicativo solicita apenas `instagram_business_basic`, suficiente para ler a mídia da própria conta. O App Secret e os tokens nunca devem ser enviados ao navegador, copiados para o Git ou incluídos em logs.

## Armazenamento de mídias no Cloudflare R2

O bucket privado `azon-social-media` foi criado na conta Cloudflare do Instituto. Imagens, documentos e mídias enviados pelo CMS ou sincronizados do Instagram usam o disco definido por `MEDIA_DISK`. O padrão continua sendo `public`, portanto o desenvolvimento local e uma produção ainda sem credenciais R2 não deixam de funcionar.

Para ativar o R2, crie no painel Cloudflare um token de API R2 limitado ao bucket `azon-social-media`, com leitura e gravação de objetos. Guarde a Access Key ID e a Secret Access Key somente no cofre/arquivo de ambiente protegido do servidor; nunca no Git. A configuração esperada é:

```dotenv
MEDIA_DISK=r2
MEDIA_TEMPORARY_URL_MINUTES=120
R2_ACCESS_KEY_ID=preencher-no-servidor
R2_SECRET_ACCESS_KEY=preencher-no-servidor
R2_REGION=auto
R2_BUCKET=azon-social-media
R2_ENDPOINT=https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
R2_URL=
```

O bucket permanece privado e o site gera links temporários para os arquivos. Depois de inserir as credenciais no servidor, valide a conexão e migre as mídias existentes sem apagar a cópia local:

```bash
php artisan config:clear
php artisan media:migrate-storage --from=public --to=r2
php artisan config:cache
```

O comando é idempotente: arquivos já enviados não são duplicados e o banco só passa a apontar para o R2 após o destino confirmar o objeto. Depois de conferir o site e possuir backup válido, uma segunda execução remove as antigas cópias públicas:

```bash
php artisan media:migrate-storage --from=public --to=r2 --delete-source
```

Quando `MEDIA_DISK=r2`, a rotina de deploy deixa de expor o link `public/storage`, impedindo acesso por URLs locais antigas. Ela também preserva as configurações R2 já existentes no arquivo protegido `/etc/azon/production.env`.

## Publicação agendada

O Laravel Scheduler executa `cms:publish-scheduled` a cada minuto, com proteção contra sobreposição. No servidor, configure um único cron para chamar o scheduler:

```cron
* * * * * cd /caminho/do/projeto && php artisan schedule:run >> /dev/null 2>&1
```

Mantenha também os processos de fila e `php artisan inertia:start-ssr` sob um supervisor. Em produção, use `APP_ENV=production`, `APP_DEBUG=false`, HTTPS, cookies seguros, backup do banco e armazenamento persistente. Enquanto `MEDIA_DISK=public`, preserve `storage/app/public`; com `MEDIA_DISK=r2`, mantenha backup e política de retenção também para o bucket. `APP_URL` deve apontar para o domínio canônico e `APP_TIMEZONE` para `America/Sao_Paulo`.

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

As páginas públicas definem título, descrição, termos institucionais, canonical, Open Graph, Twitter Card e JSON-LD com organização, endereço, área de atuação, contato, idealizador e temas de trabalho. O sitemap inclui somente conteúdo publicado; rascunhos, itens agendados para o futuro e páginas administrativas ficam de fora. O `robots.txt` permite a descoberta do conteúdo público pelo OAI-SearchBot e por outros mecanismos de resposta, mantendo todo o CRM bloqueado, enquanto o `llms.txt` oferece uma síntese institucional e aponta para as fontes oficiais.

O seed inicial preserva as informações institucionais conhecidas, não cria usuários nem credenciais e nunca sobrescreve textos alterados posteriormente no CRM. Contatos públicos atuais:

- `instituto.azonsocial@gmail.com`;
- `(21) 95101-5058`;
- Sepetiba, Rio de Janeiro — RJ;
- Instagram: [@azon.social](https://www.instagram.com/azon.social/).
