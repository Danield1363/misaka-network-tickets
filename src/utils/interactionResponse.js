const logger = require('./logger');

async function safeReply(interaction, options) {
  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(options);
    }
    return await interaction.reply(options);
  } catch (err) {
    if (err.code === 10062 || err.message?.includes('Unknown Interaction')) {
      logger.warn('Interação desconhecida, impossível responder.');
      return null;
    }
    if (err.code === 40060 || err.message?.includes('Interaction has already been replied to')) {
      try {
        return await interaction.followUp(options);
      } catch (followUpErr) {
        logger.error('Erro ao enviar followUp:', followUpErr.message);
        return null;
      }
    }
    logger.error('Erro ao responder interação:', err.message);
    return null;
  }
}

async function safeDeferReply(interaction, options = { ephemeral: true }) {
  try {
    if (interaction.replied || interaction.deferred) return true;
    await interaction.deferReply(options);
    return true;
  } catch (err) {
    if (err.code === 10062 || err.message?.includes('Unknown Interaction')) {
      logger.warn('Interação desconhecida ao deferir.');
      return false;
    }
    logger.error('Erro ao deferir interação:', err.message);
    return false;
  }
}

async function safeDeferUpdate(interaction) {
  try {
    if (interaction.replied || interaction.deferred) return true;
    await interaction.deferUpdate();
    return true;
  } catch (err) {
    if (err.code === 10062 || err.message?.includes('Unknown Interaction')) {
      logger.warn('Interação desconhecida ao deferir update.');
      return false;
    }
    logger.error('Erro ao deferir update:', err.message);
    return false;
  }
}

async function safeEditReply(interaction, options) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      return await interaction.reply(options);
    }
    return await interaction.editReply(options);
  } catch (err) {
    if (err.code === 10062 || err.message?.includes('Unknown Interaction')) {
      logger.warn('Interação desconhecida ao editar resposta.');
      return null;
    }
    logger.error('Erro ao editar resposta:', err.message);
    return null;
  }
}

module.exports = { safeReply, safeDeferReply, safeDeferUpdate, safeEditReply };
