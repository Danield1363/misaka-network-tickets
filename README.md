# Misaka Network - Bot de Tickets para Vendas

Bot profissional de tickets para vendas de serviços de Genshin Impact. Sistema completo com painéis configuráveis, formulários, transcripts e mensagens de boas-vindas.

## Funcionalidades

- **Sistema de Painéis**: Múltiplos painéis por servidor com configuração visual completa
- **Formulários Personalizáveis**: Até 5 perguntas por painel com validação
- **Tickets Persistentes**: Botões funcionam após reinicialização do bot
- **Transcripts**: Geração de HTML legível com todas as mensagens
- **Logs**: Canal de logs com embeds organizados
- **Inatividade**: Fechamento automático opcional por inatividade
- **Boas-Vindas**: Sistema de mensagens de entrada configurável
- **Armazenamento Local**: JSON atômico sem banco de dados externo

## Pré-requisitos

- Node.js 18+ (LTS recomendado)
- Conta no Discord Developer Portal
- Bot com permissões adequadas

## Configuração

### 1. Criar Aplicação no Discord Developer Portal

1. Acesse https://discord.com/developers/applications
2. Clique em "New Application"
3. Digite "Misaka Network" e confirme
4. Vá em "Bot" no menu lateral
5. Clique em "Reset Token" para gerar um token
6. Copie o token (será mostrado apenas uma vez)
7. Em "Privileged Gateway Intents", ative:
   - **Message Content Intent** (necessário para transcripts)
   - **Server Members Intent** (necessário para boas-vindas, opcional)

### 2. Copiar Application ID

1. Vá em "General Information"
2. Copie o "Application ID"
3. Este será o `CLIENT_ID` no arquivo `.env`

### 3. Adicionar Bot ao Servidor

1. Vá em "OAuth2" > "URL Generator"
2. Em "Scopes", marque `bot` e `applications.commands`
3. Em "Bot Permissions", marque:
   - View Channels
   - Send Messages
   - Embed Links
   - Attach Files
   - Read Message History
   - Manage Channels
   - Manage Roles (apenas se usar cargo automático)
4. Copie a URL gerada e abra no navegador
5. Selecione o servidor e autorize

### 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```
DISCORD_TOKEN=seu_token_aqui
CLIENT_ID=seu_application_id_aqui
DEV_GUILD_ID=id_do_servidor_de_dev
ENABLE_WELCOME_INTENT=false
LOG_LEVEL=info
```

### 5. Instalar e Registrar Comandos

```bash
# Instalar dependências
npm install

# Registrar comandos no servidor de desenvolvimento
npm run deploy:commands

# Ou registrar globalmente (demora até 1 hora para propagar)
npm run deploy:global
```

### 6. Iniciar o Bot

```bash
npm start
```

## Hospedagem na Discloud

### 1. Compactar o Projeto

Compacte os seguintes arquivos e pastas em um ZIP:

```
discloud.config
package.json
package-lock.json
.env
src/
data/
```

**Importante**: O arquivo `.env` NÃO deve ser incluído no ZIP por segurança. Configure as variáveis de ambiente na Discloud.

### 2. Enviar para a Discloud

1. Acesse https://discloudbot.com
2. Faça login com sua conta do Discord
3. Clique em "New App"
4. Selecione "Upload ZIP"
5. Envie o arquivo ZIP
6. Configure as variáveis de ambiente:
   - `DISCORD_TOKEN`: Token do bot
   - `CLIENT_ID`: Application ID
   - `DEV_GUILD_ID`: ID do servidor (opcional)
   - `ENABLE_WELCOME_INTENT`: `true` ou `false`
   - `LOG_LEVEL`: `info`, `debug`, `warn` ou `error`

### 3. Consultar Logs

1. Na Discloud, vá em "Logs"
2. Selecione o bot
3. Visualize os logs em tempo real

### 4. Alterar RAM

1. Na Discloud, vá em "Settings"
2. Altere o valor de RAM conforme seu plano
3. Reinicie o bot

## Comandos

### Comandos de Administração

| Comando | Descrição |
|---------|-----------|
| `/ticket configurar` | Abrir menu de configuração |
| `/ticket painel-criar` | Criar novo painel |
| `/ticket painel-editar` | Editar painel existente |
| `/ticket painel-publicar` | Publicar painel em canal |
| `/ticket painel-listar` | Listar painéis |
| `/ticket painel-excluir` | Excluir painel |
| `/ticket formulario` | Configurar perguntas |
| `/ticket mensagem` | Configurar mensagem automática |
| `/ticket adicionar` | Adicionar pessoa ao ticket |
| `/ticket remover` | Remover pessoa do ticket |
| `/ticket renomear` | Renomear ticket |
| `/ticket fechar` | Fechar ticket |
| `/ticket status` | Ver status e diagnosticar |
| `/ticket testar` | Criar prévia |

### Comandos de Boas-Vindas

| Comando | Descrição |
|---------|-----------|
| `/boas-vindas configurar` | Configurar mensagem |
| `/boas-vindas testar` | Testar mensagem |
| `/boas-vindas desativar` | Desativar sistema |
| `/boas-vindas status` | Ver status |

## Variáveis da Mensagem de Boas-Vindas

- `{usuario}` - Nome do usuário
- `{usuario_mencao}` - Menção ao usuário
- `{servidor}` - Nome do servidor
- `{membros}` - Total de membros
- `{data}` - Data atual

## Estrutura do Projeto

```
src/
  index.js              # Ponto de entrada
  config.js             # Configuração
  commands/
    ticket/             # Comandos de tickets
    welcome/            # Comandos de boas-vindas
  interactions/
    buttons/            # Handlers de botões
    modals/             # Handlers de modais
    selectMenus/        # Handlers de menus
  events/
    ready.js            # Evento de prontidão
    interactionCreate.js # Handler de interações
    guildMemberAdd.js   # Evento de entrada
  services/
    ticketService.js    # Lógica de tickets
    panelService.js     # Lógica de painéis
    welcomeService.js   # Lógica de boas-vindas
    transcriptService.js # Geração de transcripts
    permissionService.js # Gerenciamento de permissões
  repositories/
    guildRepository.js  # Dados do servidor
    panelRepository.js  # Dados dos painéis
    ticketRepository.js # Dados dos tickets
    counterRepository.js # Contadores
  utils/
    logger.js           # Sistema de logs
    interactionResponse.js # Resposta segura
    atomicJson.js       # Escrita atômica
    validators.js       # Validações
    sanitize.js         # Sanitização
    embeds.js           # Embeds
    permissions.js      # Permissões
data/
  guilds.json           # Configurações dos servidores
  panels.json           # Dados dos painéis
  tickets.json          # Dados dos tickets
  counters.json         # Contadores
```

## Solução de Problemas

### "O aplicativo não respondeu"

O bot utiliza `deferReply` em todas as interações que realizam operações demoradas. Verifique:

1. Se o bot está online
2. Se o token está correto
3. Se as intents estão habilitadas

### Botões não funcionam após reinício

Os botões são persistentes. Verifique:

1. Se o `messageId` está salvo no painel
2. Se o canal do painel ainda existe
3. Se o bot tem permissão para ler mensagens

### Transcript não mostra mensagens

Verifique se o **Message Content Intent** está habilitado no Discord Developer Portal.

### Boas-vindas não funciona

Verifique se o **Server Members Intent** está habilitado e `ENABLE_WELCOME_INTENT=true` no `.env`.

## Licença

MIT
