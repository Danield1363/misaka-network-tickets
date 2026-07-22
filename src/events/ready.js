const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`Bot conectado como ${client.user.tag}`);
    logger.info(`Servidores: ${client.guilds.cache.size}`);
    client.user.setActivity('Misaka Network | /ticket', { type: 3 });
  },
};
