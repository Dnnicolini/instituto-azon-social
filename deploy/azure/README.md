# Deploy do Azon no Microsoft Azure

Esta variante prepara uma VM **Ubuntu 24.04** criada com o usuário
`azonadmin`. Ela usa Nginx, PHP 8.4, Node.js 22, Inertia SSR e PostgreSQL
na própria VM, acessível somente por socket Unix. Não contém regras ou
dependências específicas da Oracle Cloud.

Os scripts não guardam senhas no Git. O único arquivo com segredos é
`/etc/azon/production.env`, com leitura limitada a `root` e `www-data`. O
`configure-application.sh` se recusa a continuar quando ele não existe e nunca
reescreve seu conteúdo.

## 1. Recursos no Azure

Antes do bootstrap:

1. mantenha o IP público da VM como **Standard/Static**;
2. no NSG, permita `80/tcp` e `443/tcp` da Internet, e `22/tcp` somente do
   mesmo `ADMIN_CIDR` usado no UFW;
3. não permita `5432/tcp` no NSG; o PostgreSQL local não escuta em TCP;
4. planeje uma cópia criptografada dos backups fora da VM. O backup local
   sozinho não protege contra perda da VM ou do disco.

O NSG e o UFW são camadas independentes: a porta precisa ser permitida nas duas,
mas o SSH nunca deve ficar aberto para `0.0.0.0/0`.

Envie este diretório para a VM e rode o bootstrap. Substitua o exemplo pelo IP
público atual do administrador:

```bash
scp -r deploy/azure azonadmin@IP_DA_VM:/tmp/
ssh azonadmin@IP_DA_VM
sudo bash /tmp/azure/bootstrap-ubuntu.sh 203.0.113.10/32
```

O bootstrap valida o instalador do Composer por SHA-384, instala PHP 8.4 com
`pgsql`, Node 22, PostgreSQL, Nginx, Certbot, fail2ban e atualizações de
segurança. O UFW libera HTTP/HTTPS publicamente e limita SSH ao `ADMIN_CIDR`.
Mantenha a sessão SSH atual aberta até confirmar uma segunda conexão. A área de
staging pertence somente a `azonadmin`; o processo web não pode alterá-la.

## 2. PostgreSQL local e ambiente de produção

Crie o banco vazio antes do primeiro deploy:

```bash
sudo bash /tmp/azure/setup-local-postgresql.sh
```

O script configura o cluster para **não escutar em TCP**, cria o banco `azon`
e uma role sem privilégios administrativos para o processo `www-data`. A
conexão usa autenticação `peer` pelo socket Unix, sem senha de banco no
ambiente. Ele verifica a conexão como `www-data` e se recusa a assumir controle
de um banco `azon` preexistente que pertença a outra role.

Copie o template no servidor apenas na primeira instalação:

```bash
sudo install -d -m 0750 -o root -g www-data /etc/azon
sudo install -m 0640 -o root -g www-data \
  /tmp/azure/production.env.example /etc/azon/production.env
sudoedit /etc/azon/production.env
```

Preencha `APP_KEY` e os demais segredos necessários somente no servidor. O
template já contém a configuração local do banco:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=/var/run/postgresql
DB_PORT=5432
DB_DATABASE=azon
DB_USERNAME=www-data
DB_PASSWORD=
DB_SSLMODE=disable
```

`DB_SSLMODE=disable` se aplica apenas ao socket Unix local: o tráfego não passa
pela rede. Se no futuro o banco mudar para um servidor remoto, use TLS com
`verify-full` e valide o certificado.

Gere a chave sem salvar sua saída em histórico ou Git:

```bash
cd /var/www/apps/azon/current
php artisan key:generate --show
sudoedit /etc/azon/production.env
```

No primeiro deploy ainda não existe `current`; nesse caso, gere a chave em uma
cópia local confiável com `php artisan key:generate --show` e cole somente no
arquivo protegido do servidor. Use a sintaxe dotenv normal e coloque entre
aspas valores com espaços ou caracteres especiais.

## 3. Azure Communication Services Email

No Azure Communication Services (ACS):

1. crie um recurso **Email Communication Services** e conecte-o ao ACS;
2. verifique o domínio `azonsocial.org.br` e publique no DNS os registros de
   verificação, SPF e DKIM exibidos pelo portal;
3. use o endereço padrão `DoNotReply@azonsocial.org.br`, criado automaticamente
   para o domínio verificado; o Laravel normaliza sua apresentação para
   `donotreply@azonsocial.org.br`, sem criar outro `MailFrom`;
4. em **SMTP usernames**, use o usuário SMTP vinculado ao aplicativo Entra.
   Crie um segredo de cliente para esse aplicativo e guarde-o somente em um
   cofre e no arquivo protegido do servidor. O valor é exibido uma vez e não
   deve ser enviado por mensagem;
5. coloque as credenciais somente em `/etc/azon/production.env`:

A caixa `sistema@azonsocial.org.br` continua recebendo pelo Microsoft 365.
O ACS envia as mensagens da aplicação como `donotreply@azonsocial.org.br`, mas esses envios
**não aparecem em Itens Enviados do Outlook**. Não habilite SMTP autenticado
na caixa nem use a senha dela na aplicação. Preserve o registro MX atual do
Microsoft 365. O domínio já tem um registro SPF; confira se o valor solicitado
pelo ACS coincide com ele e nunca publique um segundo registro `v=spf1` no
mesmo nome. Adicione apenas os registros de verificação e DKIM indicados pelo
recurso, após conferir nomes e valores exatos no portal.

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.azurecomm.net
MAIL_PORT=587
MAIL_USERNAME="credencial-smtp-do-acs"
MAIL_PASSWORD="senha-smtp-do-acs"
MAIL_REQUIRE_TLS=true
MAIL_EHLO_DOMAIN=azonsocial.org.br
MAIL_FROM_ADDRESS="donotreply@azonsocial.org.br"
MAIL_FROM_NAME="${APP_NAME}"
```

Depois de alterar o ambiente, recarregue a configuração e os processos:

```bash
cd /var/www/apps/azon/current
sudo -u www-data php artisan optimize:clear
sudo -u www-data php artisan config:cache
sudo systemctl restart azon-queue azon-ssr
```

Primeiro valide conectividade TLS, sem revelar credenciais:

```bash
openssl s_client -quiet -starttls smtp \
  -connect smtp.azurecomm.net:587 -servername smtp.azurecomm.net </dev/null
```

Para um envio real, abra `sudo -u www-data php artisan tinker` e execute,
substituindo apenas o destinatário:

```php
Mail::raw('Teste SMTP do Azon no Azure.', function ($message) {
    $message->to('destinatario@exemplo.org')->subject('Teste SMTP Azon');
});
```

Confirme o recebimento e os logs do ACS antes de ativar mensagens automáticas.
O remetente deve ser exatamente um endereço/domínio verificado no ACS.

## 4. Build e deploy manual

Não transfira `.env`, `vendor`, `node_modules`, dados de usuário nem a chave SSH.
Do diretório raiz do projeto, gere um nome de release e envie somente arquivos
rastreados pelo Git mais `deploy/azure/`, depois de revisar o diff. Isso evita
enviar diretórios locais não relacionados, como `portfolio-daniele/`:

```bash
RELEASE="$(date -u +%Y%m%dT%H%M%SZ)"
git ls-files -z | rsync -a0 --files-from=- \
  --exclude=.env --exclude=vendor --exclude=node_modules \
  ./ azonadmin@IP_DA_VM:/var/www/apps/azon/staging/$RELEASE/
rsync -az deploy/azure/ \
  azonadmin@IP_DA_VM:/var/www/apps/azon/staging/$RELEASE/deploy/azure/
ssh azonadmin@IP_DA_VM \
  "sudo bash /tmp/azure/deploy-release.sh /var/www/apps/azon/staging/$RELEASE"
```

No servidor, `deploy-release.sh` executa de forma reproduzível:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader
npm ci
npm run build:ssr
```

O script liga o release ao ambiente e ao `storage` persistente, faz backup antes
das migrations (a partir do segundo deploy), executa migrations, seeders
idempotentes e caches, troca o link `current` atomicamente e reinicia PHP, fila
e SSR. Uma trava impede deploys concorrentes; depois da troca, os serviços e o
endpoint `/up` precisam retornar saudáveis. Falhas de build anteriores às
migrations restauram a release anterior. Depois do início das migrations,
qualquer falha mantém o site em manutenção para evitar código antigo contra
schema novo; use migrations aditivas/expand-contract e faça a recuperação
manual. Ele mantém os cinco releases mais recentes. No primeiro deploy, instale
os serviços:

```bash
sudo bash /tmp/azure/configure-application.sh
systemctl status azon-queue azon-scheduler.timer azon-ssr azon-backup.timer
```

Verifique também:

```bash
sudo -u www-data php /var/www/apps/azon/current/artisan about
curl -I -H 'Host: azonsocial.org.br' http://127.0.0.1/
sudo nginx -t
sudo journalctl -u azon-queue -u azon-ssr --since '10 minutes ago'
```

### Entrega contínua pelo GitHub Actions

O workflow `.github/workflows/deploy-azure.yml` só inicia manualmente a partir de
`main`. Ele repete o CI para o mesmo commit, aguarda aprovação no ambiente
`production` e usa identidade federada OIDC para chamar o Azure Run Command na
VM, sem abrir o SSH para runners do GitHub e sem guardar uma chave SSH no GitHub.
O Run Command executa como root: a identidade Azure deve ter permissão de
execução limitada **somente** à VM `vm-azon-crm-prod-01`, e o ambiente GitHub
deve aceitar apenas a branch `main` com revisor obrigatório. Nunca execute jobs
de pull requests nessa identidade ou em um runner instalado na VM.

No ambiente `production` do GitHub, configure os segredos
`AZURE_CLIENT_ID`, `AZURE_TENANT_ID` e `AZURE_SUBSCRIPTION_ID` para a identidade
federada. Configure as variáveis `AZURE_RESOURCE_GROUP` e `AZURE_VM_NAME` com os
valores exatos da VM. A credencial federada no Microsoft Entra deve usar issuer
`https://token.actions.githubusercontent.com`, audience
`api://AzureADTokenExchange` e subject
`repo:Dnnicolini/instituto-azon-social:environment:production`.

Antes do primeiro acionamento, reconcilie e publique no Git todas as alterações
da release atualmente em produção, inclusive `deploy/azure/`. Um deploy do
`main` antigo substituiria as correções de segurança implantadas manualmente.
O script `deploy-from-github.sh` clona o `main` público, exige que seu SHA seja
o mesmo do workflow aprovado, monta uma release só com arquivos versionados e
usa `deploy-release.sh` para backup, migração, swap e health check. Se o `main`
avançar enquanto a execução aguarda aprovação, o deploy aborta sem tocar na
release ativa; execute o workflow novamente para o novo commit.

O ambiente protegido exige aprovação para **cada** execução. Nenhum push ou PR
publica automaticamente. Se migrations falharem após iniciar a fase de banco,
o script mantém o site em manutenção para revisão humana; não tente rollback
automático de schema. O mesmo `run_id` não pode ser usado novamente: se o
workflow falhar, inspecione a VM e o banco antes de iniciar uma nova execução;
não use “Re-run failed jobs” como recuperação automática. Confira a execução
do CI, o diff e o plano de migration antes de aprovar.

## 5. DNS e TLS

Crie registros `A` para `azonsocial.org.br`, `www.azonsocial.org.br` e
`admin.azonsocial.org.br`, todos apontando para o IP público estático da VM.
Espere a propagação e passe explicitamente o IP esperado; ele não é gravado no
script:

```bash
sudo bash /tmp/azure/enable-tls.sh IP_PUBLICO_ESTATICO instituto.azonsocial@gmail.com
```

Também é possível usar `EXPECTED_IP=... CONTACT_EMAIL=... sudo -E bash ...`.
O script exige que os três nomes resolvam exclusivamente para o IP informado,
emite o certificado Let's Encrypt, instala os redirecionamentos de `www` e
`/admin` e executa um teste de renovação.

## 6. Backup e rollback

`azon-backup.timer` produz diariamente um `pg_dump` verificado em
`/var/backups/azon/postgresql`, com retenção local de sete dias. Uma trava
impede que o timer, um backup manual e um deploy gravem o mesmo backup
simultaneamente. **A cópia local não é um backup de recuperação de desastre:**
envie-a para outro local criptografado e teste uma restauração em um banco
separado:

```bash
sudo /usr/local/sbin/azon-backup-database
pg_restore --list /var/backups/azon/postgresql/azon-TIMESTAMP.dump
```

Para voltar apenas o código, selecione um release anterior e troque o link:

```bash
sudo -u www-data php /var/www/apps/azon/current/artisan down --retry=60
sudo ln -sfn /var/www/apps/azon/releases/RELEASE_ANTERIOR \
  /var/www/apps/azon/current.rollback
sudo mv -Tf /var/www/apps/azon/current.rollback /var/www/apps/azon/current
sudo systemctl restart php8.4-fpm azon-queue azon-ssr
sudo -u www-data php /var/www/apps/azon/current/artisan up
```

Esse rollback não desfaz schema. Se uma migration incompatível chegou a rodar,
pare os processos, restaure o dump em um banco separado, valide-o e só então
altere a conexão. Nunca execute `migrate:rollback` às cegas em produção. Mídias
em `storage` ou R2 têm ciclo de backup próprio e não são removidas no rollback.

Os endpoints de redefinição e verificação de e-mail não são gravados nos access
logs do Nginx, evitando registrar tokens e assinaturas presentes na URL.
