const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { config, validateConfig } = require('./config');
const logger = require('./utils/logger');

validateConfig();

const client = new Client({
  intents: config.intents,
  partials: config.partials,
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandDirs = fs.readdirSync(commandsPath);

for (const dir of commandDirs) {
  const dirPath = path.join(commandsPath, dir);
  if (!fs.statSync(dirPath).isDirectory()) continue;

  const commandFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(dirPath, file));
    if (command.data && command.data.name) {
      client.commands.set(command.data.name, command);
      logger.info(`Comando carregado: /${command.data.name}`);
    }
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  logger.info(`Evento carregado: ${event.name}`);
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  logger.error(err.stack);
});

client.login(config.token).catch(err => {
  logger.error('Erro ao conectar:', err.message);
  process.exit(1);
});
