const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const panelRepository = require('../repositories/panelRepository');
const { createPanelEmbed } = require('../utils/embeds');
const { sanitizeChannelName, sanitizeUrl, sanitizeEmoji } = require('../utils/sanitize');
const { safeReply, safeDeferReply, safeEditReply } = require('../utils/interactionResponse');
const logger = require('../utils/logger');

async function publishPanel(client, panelId) {
  const panel = await panelRepository.getPanel(panelId);
  if (!panel) throw new Error('Painel não encontrado.');

  const guild = await client.guilds.fetch(panel.guildId);
  if (!guild) throw new Error('Servidor não encontrado.');

  const channel = await guild.channels.fetch(panel.channelId);
  if (!channel) throw new Error('Canal não encontrado.');

  const embed = createPanelEmbed(panel);

  const button = new ButtonBuilder()
    .setCustomId(`ticket_open_${panel.id}`)
    .setLabel(panel.buttonText || 'Abrir ticket')
    .setStyle(panel.buttonStyle || ButtonStyle.Primary);

  if (panel.buttonEmoji) {
    button.setEmoji(panel.buttonEmoji);
  }

  const row = new ActionRowBuilder().addComponents(button);

  let message;
  if (panel.messageId) {
    try {
      message = await channel.messages.fetch(panel.messageId);
      await message.edit({ embeds: [embed], components: [row] });
      logger.info(`Painel atualizado no canal ${channel.name}`);
    } catch {
      message = await channel.send({ embeds: [embed], components: [row] });
      logger.info(`Painel re-publicado no canal ${channel.name}`);
    }
  } else {
    message = await channel.send({ embeds: [embed], components: [row] });
    logger.info(`Painel publicado no canal ${channel.name}`);
  }

  await panelRepository.updatePanel(panelId, { messageId: message.id });
  return message;
}

async function handleTicketOpen(interaction, panelId) {
  const panel = await panelRepository.getPanel(panelId);
  if (!panel) {
    await safeReply(interaction, { content: '❌ Este painel não existe mais.', ephemeral: true });
    return;
  }

  if (!panel.enabled) {
    await safeReply(interaction, { content: '❌ Este painel está desativado.', ephemeral: true });
    return;
  }

  const ticketService = require('./ticketService');
  const openTickets = await ticketService.getOpenTicketsByUser(panel.guildId, interaction.user.id);
  if (openTickets.length >= panel.maxTicketsPerUser) {
    await safeReply(interaction, {
      content: `❌ Você já possui o máximo de tickets abertos permitido (${panel.maxTicketsPerUser}).`,
      ephemeral: true,
    });
    return;
  }

  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

  const modal = new ModalBuilder()
    .setCustomId(`ticket_form_${panel.id}`)
    .setTitle(`Abrir Ticket - ${panel.name}`);

  const questions = panel.questions || [];
  for (const question of questions.slice(0, 5)) {
    const input = new TextInputBuilder()
      .setCustomId(`q_${question.id}`)
      .setLabel(question.title)
      .setPlaceholder(question.placeholder)
      .setRequired(question.required)
      .setStyle(question.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short);

    if (question.minLength) input.setMinLength(question.minLength);
    if (question.maxLength) input.setMaxLength(Math.min(question.maxLength, 4000));

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);
  }

  await interaction.showModal(modal);
}

module.exports = { publishPanel, handleTicketOpen };
