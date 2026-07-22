const { GatewayIntentBits, Partials } = require('discord.js');
const path = require('path');
require('dotenv').config();

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  devGuildId: process.env.DEV_GUILD_ID || null,
  enableWelcomeIntent: process.env.ENABLE_WELCOME_INTENT === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',

  dataDir: path.join(__dirname, '..', 'data'),

  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],

  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
  ],
};

if (config.enableWelcomeIntent) {
  config.intents.push(GatewayIntentBits.GuildMembers);
}

function validateConfig() {
  if (!config.token) {
    console.error('[FATAL] DISCORD_TOKEN não está configurado. Crie um arquivo .env com o token do bot.');
    process.exit(1);
  }
  if (!config.clientId) {
    console.error('[FATAL] CLIENT_ID não está configurado. Crie um arquivo .env com o Application ID.');
    process.exit(1);
  }
}

module.exports = { config, validateConfig };
