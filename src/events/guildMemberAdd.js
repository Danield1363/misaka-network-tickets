const { Events } = require('discord.js');
const { handleWelcome } = require('../services/welcomeService');
const { config } = require('../config');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    if (!config.enableWelcomeIntent) return;
    try {
      await handleWelcome(member);
    } catch (err) {
      logger.error('Erro ao processar entrada de membro:', err.message);
    }
  },
};
