const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const ticketRepository = require('../repositories/ticketRepository');
const panelRepository = require('../repositories/panelRepository');
const counterRepository = require('../repositories/counterRepository');
const { setupTicketChannelPermissions, lockTicketForClient, unlockTicketForClient } = require('./permissionService');
const { createTicketWelcomeEmbed, createLogEmbed } = require('../utils/embeds');
const { sanitizeChannelName, sanitizeText } = require('../utils/sanitize');
const { safeReply, safeDeferReply, safeEditReply } = require('../utils/interactionResponse');
const logger = require('../utils/logger');

async function createTicket(interaction, panelId, responses) {
  const panel = await panelRepository.getPanel(panelId);
  if (!panel) throw new Error('Painel não encontrado.');

  const guild = await interaction.client.guilds.fetch(panel.guildId);
  if (!guild) throw new Error('Servidor não encontrado.');

  const category = await guild.channels.fetch(panel.categoryId);
  if (!category || category.type !== ChannelType.GuildCategory) {
    throw new Error('A categoria configurada não existe mais ou não é uma categoria válida.');
  }

  const number = await counterRepository.getNextTicketNumber(panel.guildId);
  const username = sanitizeChannelName(interaction.user.username);
  const channelName = panel.channelNamePattern
    .replace('{numero}', String(number).padStart(4, '0'))
    .replace('{usuario}', username);

  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `Ticket #${number} | Cliente: ${interaction.user.tag}`,
  });

  await setupTicketChannelPermissions(ticketChannel, interaction.user.id, panel.teamRoleId, panel.specificUserId);

  const ticket = await ticketRepository.createTicket({
    guildId: panel.guildId,
    channelId: ticketChannel.id,
    userId: interaction.user.id,
    panelId: panel.id,
    number,
    responses,
  });

  const ticketEmbed = createTicketWelcomeEmbed(ticket, panel, responses);

  const mentionText = panel.ticketMessage
    .replace('{cliente}', `<@${interaction.user.id}>`)
    .replace('{servidor}', guild.name)
    .replace('{membros}', guild.memberCount.toString());

  const allowedMentions = {
    parse: ['users'],
    roles: panel.teamRoleId ? [panel.teamRoleId] : [],
    users: [interaction.user.id],
  };

  if (panel.specificUserId) {
    allowedMentions.users.push(panel.specificUserId);
  }

  const teamMention = panel.teamRoleId ? `<@&${panel.teamRoleId}>` : '';
  const specificMention = panel.specificUserId ? `<@${panel.specificUserId}>` : '';

  let contentText = sanitizeText(mentionText);
  if (teamMention) contentText += `\n${teamMention}`;
  if (specificMention) contentText += `\n${specificMention}`;

  await ticketChannel.send({
    content: contentText,
    embeds: [ticketEmbed],
    allowedMentions,
  });

  const controlRow = createControlRow(false);
  await ticketChannel.send({ components: [controlRow] });

  await safeReply(interaction, {
    content: `✅ Ticket aberto com sucesso! <#${ticketChannel.id}>`,
    ephemeral: true,
  });

  const guildData = await require('../repositories/guildRepository').getGuild(panel.guildId);
  if (guildData?.logChannelId) {
    try {
      const logChannel = await guild.channels.fetch(guildData.logChannelId);
      if (logChannel) {
        await logChannel.send({
          embeds: [createLogEmbed('Ticket Aberto', {
            client: interaction.user.id,
            ticket: String(number),
            channel: ticketChannel.id,
          })],
        });
      }
    } catch (err) {
      logger.error('Erro ao enviar log:', err.message);
    }
  }

  return ticket;
}

function createControlRow(claimed) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel(claimed ? 'Liberar atendimento' : 'Assumir atendimento')
      .setStyle(claimed ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setEmoji('👤'),
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Fechar')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId('ticket_reopen')
      .setLabel('Reabrir')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🔓')
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('ticket_transcript')
      .setLabel('Transcript')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📝'),
    new ButtonBuilder()
      .setCustomId('ticket_delete')
      .setLabel('Excluir')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️'),
  ];

  return new ActionRowBuilder().addComponents(buttons);
}

function createClosedRow() {
  const buttons = [
    new ButtonBuilder()
      .setCustomId('ticket_reopen')
      .setLabel('Reabrir')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🔓'),
    new ButtonBuilder()
      .setCustomId('ticket_transcript')
      .setLabel('Transcript')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📝'),
    new ButtonBuilder()
      .setCustomId('ticket_delete')
      .setLabel('Excluir')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️'),
  ];

  return new ActionRowBuilder().addComponents(buttons);
}

async function getOpenTicketsByUser(guildId, userId) {
  return ticketRepository.getOpenTicketsByUser(guildId, userId);
}

async function getTicket(channelId) {
  return ticketRepository.getTicket(channelId);
}

module.exports = { createTicket, createControlRow, createClosedRow, getOpenTicketsByUser, getTicket };
