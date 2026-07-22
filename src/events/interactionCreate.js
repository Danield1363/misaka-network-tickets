const { Events } = require('discord.js');
const logger = require('../utils/logger');
const { safeReply, safeDeferReply, safeEditReply } = require('../utils/interactionResponse');
const ticketService = require('../services/ticketService');
const panelService = require('../services/panelService');
const panelRepository = require('../repositories/panelRepository');
const ticketRepository = require('../repositories/ticketRepository');
const { canManageTicket, isAdmin } = require('../utils/permissions');
const { createControlRow, createClosedRow } = require('../services/ticketService');
const { lockTicketForClient, unlockTicketForClient } = require('../services/permissionService');
const { createLogEmbed } = require('../utils/embeds');
const transcriptService = require('../services/transcriptService');
const { config } = require('../config');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction);
      } else if (interaction.isButton()) {
        await handleButton(interaction);
      } else if (interaction.isModalSubmit()) {
        await handleModal(interaction);
      } else if (interaction.isStringSelectMenu() || interaction.isRoleSelectMenu() || interaction.isChannelSelectMenu() || interaction.isUserSelectMenu()) {
        await handleSelectMenu(interaction);
      }
    } catch (err) {
      logger.error('Erro não tratado na interação:', err.message);
      try {
        const content = '❌ Ocorreu um erro inesperado. Tente novamente.';
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content, ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ content, ephemeral: true }).catch(() => {});
        }
      } catch {
        // Ignorar erros de resposta
      }
    }
  },
};

async function handleCommand(interaction) {
  const { commandName } = interaction;

  if (commandName === 'ticket') {
    const subcommand = interaction.options.getSubcommand();
    await handleTicketCommand(interaction, subcommand);
  } else if (commandName === 'boas-vindas') {
    const subcommand = interaction.options.getSubcommand();
    await handleWelcomeCommand(interaction, subcommand);
  }
}

async function handleTicketCommand(interaction, subcommand) {
  switch (subcommand) {
    case 'configurar':
      await handleTicketConfigurar(interaction);
      break;
    case 'painel-criar':
      await handlePainelCriar(interaction);
      break;
    case 'painel-editar':
      await handlePainelEditar(interaction);
      break;
    case 'painel-publicar':
      await handlePainelPublicar(interaction);
      break;
    case 'painel-listar':
      await handlePainelListar(interaction);
      break;
    case 'painel-excluir':
      await handlePainelExcluir(interaction);
      break;
    case 'formulario':
      await handleFormulario(interaction);
      break;
    case 'mensagem':
      await handleMensagem(interaction);
      break;
    case 'adicionar':
      await handleAdicionar(interaction);
      break;
    case 'remover':
      await handleRemover(interaction);
      break;
    case 'renomear':
      await handleRenomear(interaction);
      break;
    case 'fechar':
      await handleFechar(interaction);
      break;
    case 'status':
      await handleStatus(interaction);
      break;
    case 'testar':
      await handleTestar(interaction);
      break;
  }
}

async function handleTicketConfigurar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_config_menu')
    .setPlaceholder('Selecione uma opção de configuração')
    .addOptions([
      { label: 'Canal de logs', value: 'log_channel', description: 'Configurar canal de logs' },
      { label: 'Cargo de admin', value: 'admin_role', description: 'Configurar cargo de administrador' },
      { label: 'Cargo automático (boas-vindas)', value: 'auto_role', description: 'Configurar cargo automático' },
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await safeEditReply(interaction, {
    content: '⚙️ **Configuração do Sistema de Tickets**\n\nSelecione uma opção abaixo:',
    components: [row],
  });
}

async function handlePainelCriar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

  const modal = new ModalBuilder()
    .setCustomId('panel_create_modal')
    .setTitle('Criar Novo Painel');

  const nameInput = new TextInputBuilder()
    .setCustomId('panel_name')
    .setLabel('Nome interno do painel')
    .setPlaceholder('Ex.: Painel Principal')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const titleInput = new TextInputBuilder()
    .setCustomId('panel_title')
    .setLabel('Título do embed')
    .setPlaceholder('Área de Compras!')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(256);

  const descInput = new TextInputBuilder()
    .setCustomId('panel_description')
    .setLabel('Descrição do embed')
    .setPlaceholder('Clique no botão abaixo para abrir um ticket.')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000);

  const colorInput = new TextInputBuilder()
    .setCustomId('panel_color')
    .setLabel('Cor do embed (hex)')
    .setPlaceholder('#2b2d31')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(7);

  const buttonInput = new TextInputBuilder()
    .setCustomId('panel_button_text')
    .setLabel('Texto do botão')
    .setPlaceholder('Abrir ticket')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(80);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(buttonInput),
  );

  await interaction.showModal(modal);
}

async function handlePainelEditar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const panels = await panelRepository.getPanelsByGuild(interaction.guild.id);
  if (panels.length === 0) {
    return safeEditReply(interaction, { content: '❌ Nenhum painel encontrado. Use /ticket painel-criar primeiro.' });
  }

  const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

  const options = panels.map(p => ({
    label: p.name,
    value: p.id,
    description: p.enabled ? 'Ativado' : 'Desativado',
  })).slice(0, 25);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('panel_edit_select')
    .setPlaceholder('Selecione o painel para editar')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await safeEditReply(interaction, {
    content: '📋 **Selecione o painel para editar:**',
    components: [row],
  });
}

async function handlePainelPublicar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const panels = await panelRepository.getPanelsByGuild(interaction.guild.id);
  if (panels.length === 0) {
    return safeEditReply(interaction, { content: '❌ Nenhum painel encontrado. Use /ticket painel-criar primeiro.' });
  }

  const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

  const options = panels.map(p => ({
    label: p.name,
    value: p.id,
    description: p.channelId ? `Canal: #${p.channelId}` : 'Sem canal configurado',
  })).slice(0, 25);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('panel_publish_select')
    .setPlaceholder('Selecione o painel para publicar')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await safeEditReply(interaction, {
    content: '📢 **Selecione o painel para publicar:**',
    components: [row],
  });
}

async function handlePainelListar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const panels = await panelRepository.getPanelsByGuild(interaction.guild.id);
  if (panels.length === 0) {
    return safeEditReply(interaction, { content: '📋 Nenhum painel configurado.' });
  }

  const list = panels.map((p, i) => {
    const status = p.enabled ? '🟢 Ativado' : '🔴 Desativado';
    return `**${i + 1}. ${p.name}**\nStatus: ${status}\nCanal: ${p.channelId ? `<#${p.channelId}>` : 'Não configurado'}\nCategoria: ${p.categoryId ? `<#${p.categoryId}>` : 'Não configurado'}\nCargo: ${p.teamRoleId ? `<@&${p.teamRoleId}>` : 'Não configurado'}`;
  }).join('\n\n');

  await safeEditReply(interaction, { content: `📋 **Painéis:**\n\n${list}` });
}

async function handlePainelExcluir(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const panels = await panelRepository.getPanelsByGuild(interaction.guild.id);
  if (panels.length === 0) {
    return safeEditReply(interaction, { content: '❌ Nenhum painel encontrado.' });
  }

  const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

  const options = panels.map(p => ({
    label: p.name,
    value: p.id,
    description: 'Excluir este painel',
  })).slice(0, 25);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('panel_delete_select')
    .setPlaceholder('Selecione o painel para excluir')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await safeEditReply(interaction, {
    content: '⚠️ **Selecione o painel para excluir:**',
    components: [row],
  });
}

async function handleFormulario(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const panels = await panelRepository.getPanelsByGuild(interaction.guild.id);
  if (panels.length === 0) {
    return safeEditReply(interaction, { content: '❌ Nenhum painel encontrado. Use /ticket painel-criar primeiro.' });
  }

  const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

  const options = panels.map(p => ({
    label: p.name,
    value: p.id,
    description: `${p.questions?.length || 0} perguntas configuradas`,
  })).slice(0, 25);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('form_select_panel')
    .setPlaceholder('Selecione o painel para configurar o formulário')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await safeEditReply(interaction, {
    content: '📝 **Selecione o painel para configurar o formulário:**',
    components: [row],
  });
}

async function handleMensagem(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const panels = await panelRepository.getPanelsByGuild(interaction.guild.id);
  if (panels.length === 0) {
    return safeEditReply(interaction, { content: '❌ Nenhum painel encontrado.' });
  }

  const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

  const options = panels.map(p => ({
    label: p.name,
    value: p.id,
    description: 'Configurar mensagem automática',
  })).slice(0, 25);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('msg_select_panel')
    .setPlaceholder('Selecione o painel para configurar a mensagem')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await safeEditReply(interaction, {
    content: '💬 **Selecione o painel para configurar a mensagem automática:**',
    components: [row],
  });
}

async function handleAdicionar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada pela equipe responsável.',
      ephemeral: true,
    });
  }

  const channel = interaction.channel;
  const ticket = await ticketService.getTicket(channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  const user = interaction.options.getUser('usuario');
  if (!user) {
    return safeReply(interaction, { content: '❌ Usuário não especificado.', ephemeral: true });
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    SendMessages: true,
    AttachFiles: true,
    EmbedLinks: true,
    ReadMessageHistory: true,
  });

  await safeReply(interaction, {
    content: `✅ <@${user.id}> foi adicionado ao ticket.`,
    allowedMentions: { parse: [] },
  });
}

async function handleRemover(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada pela equipe responsável.',
      ephemeral: true,
    });
  }

  const channel = interaction.channel;
  const ticket = await ticketService.getTicket(channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  const user = interaction.options.getUser('usuario');
  if (!user) {
    return safeReply(interaction, { content: '❌ Usuário não especificado.', ephemeral: true });
  }

  await channel.permissionOverwrites.delete(user.id);

  await safeReply(interaction, {
    content: `✅ <@${user.id}> foi removido do ticket.`,
    allowedMentions: { parse: [] },
  });
}

async function handleRenomear(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada pela equipe responsável.',
      ephemeral: true,
    });
  }

  const channel = interaction.channel;
  const ticket = await ticketService.getTicket(channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  const novoNome = interaction.options.getString('nome');
  if (!novoNome) {
    return safeReply(interaction, { content: '❌ Nome não especificado.', ephemeral: true });
  }

  const { sanitizeChannelName } = require('../utils/sanitize');
  await channel.setName(sanitizeChannelName(novoNome));

  await safeReply(interaction, { content: `✅ Ticket renomeado para: ${novoNome}` });
}

async function handleFechar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada pela equipe responsável.',
      ephemeral: true,
    });
  }

  const channel = interaction.channel;
  const ticket = await ticketService.getTicket(channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  const motivo = interaction.options.getString('motivo') || 'Sem motivo especificado';

  await safeDeferReply(interaction);

  await ticketRepository.closeTicket(channel.id, interaction.user.id, motivo);
  await lockTicketForClient(channel);

  const closedRow = createClosedRow();
  await channel.send({
    embeds: [{
      color: 0xff9900,
      title: '🔒 Ticket Fechado',
      description: `Este ticket foi fechado por <@${interaction.user.id}>.\n\n**Motivo:** ${motivo}`,
      timestamp: new Date().toISOString(),
    }],
    components: [closedRow],
  });

  const panel = await panelRepository.getPanel(ticket.panelId);
  const guildData = await require('../repositories/guildRepository').getGuild(interaction.guild.id);

  if (guildData?.logChannelId) {
    try {
      const logChannel = await interaction.guild.channels.fetch(guildData.logChannelId);
      if (logChannel) {
        await logChannel.send({
          embeds: [createLogEmbed('Ticket Fechado', {
            user: interaction.user.id,
            client: ticket.userId,
            ticket: String(ticket.number),
            reason: motivo,
          })],
        });
      }
    } catch (err) {
      logger.error('Erro ao enviar log:', err.message);
    }
  }

  await safeEditReply(interaction, { content: '✅ Ticket fechado com sucesso.' });
}

async function handleStatus(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const guildData = await require('../repositories/guildRepository').getGuild(interaction.guild.id);
  const panels = await panelRepository.getPanelsByGuild(interaction.guild.id);

  const botMember = interaction.guild.members.me;
  const permissions = botMember ? botMember.permissions.toArray() : [];

  let status = `# 📊 Status do Sistema - ${interaction.guild.name}\n\n`;

  status += `## Permissões do Bot\n`;
  status += `- ViewChannel: ${permissions.includes('ViewChannel') ? '✅' : '❌'}\n`;
  status += `- SendMessages: ${permissions.includes('SendMessages') ? '✅' : '❌'}\n`;
  status += `- EmbedLinks: ${permissions.includes('EmbedLinks') ? '✅' : '❌'}\n`;
  status += `- AttachFiles: ${permissions.includes('AttachFiles') ? '✅' : '❌'}\n`;
  status += `- ReadMessageHistory: ${permissions.includes('ReadMessageHistory') ? '✅' : '❌'}\n`;
  status += `- ManageChannels: ${permissions.includes('ManageChannels') ? '✅' : '❌'}\n\n`;

  status += `## Configurações\n`;
  status += `- Canal de logs: ${guildData?.logChannelId ? `<#${guildData.logChannelId}>` : '❌ Não configurado'}\n`;
  status += `- Cargo de admin: ${guildData?.adminRoleId ? `<@&${guildData.adminRoleId}>` : '❌ Não configurado'}\n`;
  status += `- Cargo automático: ${guildData?.autoRoleId ? `<@&${guildData.autoRoleId}>` : '❌ Não configurado'}\n\n`;

  status += `## Painéis (${panels.length})\n`;
  if (panels.length === 0) {
    status += 'Nenhum painel configurado.\n';
  } else {
    for (const panel of panels) {
      status += `- **${panel.name}**: ${panel.enabled ? '🟢' : '🔴'} | Canal: ${panel.channelId ? `<#${panel.channelId}>` : '❌'}\n`;
    }
  }

  await safeEditReply(interaction, { content: status });
}

async function handleTestar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const panels = await panelRepository.getPanelsByGuild(interaction.guild.id);
  if (panels.length === 0) {
    return safeEditReply(interaction, { content: '❌ Nenhum painel encontrado.' });
  }

  const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

  const options = panels.map(p => ({
    label: p.name,
    value: p.id,
    description: 'Criar prévia deste painel',
  })).slice(0, 25);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('panel_test_select')
    .setPlaceholder('Selecione o painel para testar')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await safeEditReply(interaction, {
    content: '🧪 **Selecione o painel para criar uma prévia:**',
    components: [row],
  });
}

async function handleButton(interaction) {
  const customId = interaction.customId;

  if (customId.startsWith('ticket_open_')) {
    const panelId = customId.replace('ticket_open_', '');
    await panelService.handleTicketOpen(interaction, panelId);
    return;
  }

  if (customId === 'ticket_claim') {
    await handleClaimTicket(interaction);
    return;
  }

  if (customId === 'ticket_close') {
    await handleCloseTicket(interaction);
    return;
  }

  if (customId === 'ticket_reopen') {
    await handleReopenTicket(interaction);
    return;
  }

  if (customId === 'ticket_transcript') {
    await handleTranscript(interaction);
    return;
  }

  if (customId === 'ticket_delete') {
    await handleDeleteTicket(interaction);
    return;
  }

  if (customId === 'ticket_confirm_close') {
    await handleConfirmClose(interaction);
    return;
  }

  if (customId === 'ticket_cancel_close') {
    await safeReply(interaction, { content: '❌ Fechamento cancelado.', ephemeral: true });
    return;
  }

  if (customId === 'ticket_confirm_delete') {
    await handleConfirmDelete(interaction);
    return;
  }

  if (customId === 'ticket_cancel_delete') {
    await safeReply(interaction, { content: '❌ Exclusão cancelada.', ephemeral: true });
    return;
  }

  if (customId.startsWith('panel_confirm_delete_')) {
    const panelId = customId.replace('panel_confirm_delete_', '');
    await panelRepository.deletePanel(panelId);
    await interaction.update({ content: '✅ Painel excluído com sucesso.', components: [] });
    return;
  }

  if (customId === 'panel_cancel_delete') {
    await interaction.update({ content: '❌ Exclusão cancelada.', components: [] });
    return;
  }
}

async function handleClaimTicket(interaction) {
  const ticket = await ticketService.getTicket(interaction.channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  const panel = await panelRepository.getPanel(ticket.panelId);
  if (!panel) {
    return safeReply(interaction, { content: '❌ Configuração do painel não encontrada.', ephemeral: true });
  }

  if (!canManageTicket(interaction.member, panel.teamRoleId)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada pela equipe responsável.',
      ephemeral: true,
    });
  }

  if (ticket.claimedBy && ticket.claimedBy !== interaction.user.id) {
    return safeReply(interaction, {
      content: `❌ Este ticket já está sendo atendido por <@${ticket.claimedBy}>.`,
      ephemeral: true,
    });
  }

  if (ticket.claimedBy === interaction.user.id) {
    await ticketRepository.updateTicket(interaction.channel.id, { claimedBy: null });
    const row = createControlRow(false);
    await interaction.message.edit({ components: [row] });
    return safeReply(interaction, { content: '✅ Você liberou o atendimento.', ephemeral: true });
  }

  await ticketRepository.updateTicket(interaction.channel.id, { claimedBy: interaction.user.id });
  const row = createControlRow(true);
  await interaction.message.edit({ components: [row] });

  await interaction.channel.send({
    embeds: [{
      color: 0x0099ff,
      title: '👤 Atendimento Assumido',
      description: `<@${interaction.user.id}> assumiu o atendimento deste ticket.`,
      timestamp: new Date().toISOString(),
    }],
  });

  const guildData = await require('../repositories/guildRepository').getGuild(interaction.guild.id);
  if (guildData?.logChannelId) {
    try {
      const logChannel = await interaction.guild.channels.fetch(guildData.logChannelId);
      if (logChannel) {
        await logChannel.send({
          embeds: [createLogEmbed('Ticket Assumido', {
            user: interaction.user.id,
            client: ticket.userId,
            ticket: String(ticket.number),
          })],
        });
      }
    } catch (err) {
      logger.error('Erro ao enviar log:', err.message);
    }
  }

  await safeReply(interaction, { content: '✅ Você assumiu o atendimento.', ephemeral: true });
}

async function handleCloseTicket(interaction) {
  const ticket = await ticketService.getTicket(interaction.channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  const panel = await panelRepository.getPanel(ticket.panelId);
  if (!panel) {
    return safeReply(interaction, { content: '❌ Configuração do painel não encontrada.', ephemeral: true });
  }

  if (!canManageTicket(interaction.member, panel.teamRoleId)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada pela equipe responsável.',
      ephemeral: true,
    });
  }

  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

  const confirmRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_confirm_close')
      .setLabel('Sim, fechar')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('ticket_cancel_close')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary),
  );

  await safeReply(interaction, {
    content: '⚠️ Tem certeza que deseja fechar este ticket?',
    components: [confirmRow],
    ephemeral: true,
  });
}

async function handleConfirmClose(interaction) {
  const ticket = await ticketService.getTicket(interaction.channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  await safeDeferReply(interaction);

  await ticketRepository.closeTicket(interaction.channel.id, interaction.user.id, 'Fechado via botão');
  await lockTicketForClient(interaction.channel);

  const closedRow = createClosedRow();
  await interaction.channel.send({
    embeds: [{
      color: 0xff9900,
      title: '🔒 Ticket Fechado',
      description: `Este ticket foi fechado por <@${interaction.user.id}>.`,
      timestamp: new Date().toISOString(),
    }],
    components: [closedRow],
  });

  const guildData = await require('../repositories/guildRepository').getGuild(interaction.guild.id);
  if (guildData?.logChannelId) {
    try {
      const logChannel = await interaction.guild.channels.fetch(guildData.logChannelId);
      if (logChannel) {
        await logChannel.send({
          embeds: [createLogEmbed('Ticket Fechado', {
            user: interaction.user.id,
            client: ticket.userId,
            ticket: String(ticket.number),
          })],
        });
      }
    } catch (err) {
      logger.error('Erro ao enviar log:', err.message);
    }
  }

  await safeEditReply(interaction, { content: '✅ Ticket fechado com sucesso.' });
}

async function handleReopenTicket(interaction) {
  const ticket = await ticketService.getTicket(interaction.channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  const panel = await panelRepository.getPanel(ticket.panelId);
  if (!panel) {
    return safeReply(interaction, { content: '❌ Configuração do painel não encontrada.', ephemeral: true });
  }

  if (!canManageTicket(interaction.member, panel.teamRoleId)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada pela equipe responsável.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  await ticketRepository.reopenTicket(interaction.channel.id);
  await unlockTicketForClient(interaction.channel);

  const row = createControlRow(!!ticket.claimedBy);
  await interaction.channel.send({
    embeds: [{
      color: 0x00ff99,
      title: '🔓 Ticket Reaberto',
      description: `Este ticket foi reaberto por <@${interaction.user.id}>.`,
      timestamp: new Date().toISOString(),
    }],
    components: [row],
  });

  const guildData = await require('../repositories/guildRepository').getGuild(interaction.guild.id);
  if (guildData?.logChannelId) {
    try {
      const logChannel = await interaction.guild.channels.fetch(guildData.logChannelId);
      if (logChannel) {
        await logChannel.send({
          embeds: [createLogEmbed('Ticket Reaberto', {
            user: interaction.user.id,
            client: ticket.userId,
            ticket: String(ticket.number),
          })],
        });
      }
    } catch (err) {
      logger.error('Erro ao enviar log:', err.message);
    }
  }

  await safeEditReply(interaction, { content: '✅ Ticket reaberto com sucesso.' });
}

async function handleTranscript(interaction) {
  const ticket = await ticketService.getTicket(interaction.channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  await safeDeferReply(interaction);

  try {
    const { attachment, messageCount } = await transcriptService.generateTranscript(interaction.channel, ticket);

    const guildData = await require('../repositories/guildRepository').getGuild(interaction.guild.id);
    if (guildData?.logChannelId) {
      try {
        const logChannel = await interaction.guild.channels.fetch(guildData.logChannelId);
        if (logChannel) {
          await logChannel.send({
            content: `📝 Transcript do ticket #${ticket.number} (${messageCount} mensagens)`,
            files: [attachment],
          });
        }
      } catch (err) {
        logger.error('Erro ao enviar transcript para logs:', err.message);
      }
    }

    await safeEditReply(interaction, {
      content: `✅ Transcript gerado com ${messageCount} mensagens. Arquivo enviado no canal de logs.`,
      files: [attachment],
    });
  } catch (err) {
    logger.error('Erro ao gerar transcript:', err.message);
    await safeEditReply(interaction, { content: '❌ Erro ao gerar transcript.' });
  }
}

async function handleDeleteTicket(interaction) {
  const ticket = await ticketService.getTicket(interaction.channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores ou membros da equipe.',
      ephemeral: true,
    });
  }

  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

  const confirmRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_confirm_delete')
      .setLabel('Sim, excluir')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('ticket_cancel_delete')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary),
  );

  await safeReply(interaction, {
    content: '⚠️ Tem certeza que deseja excluir este ticket? Esta ação não pode ser desfeita.',
    components: [confirmRow],
    ephemeral: true,
  });
}

async function handleConfirmDelete(interaction) {
  const ticket = await ticketService.getTicket(interaction.channel.id);
  if (!ticket) {
    return safeReply(interaction, { content: '❌ Este canal não é um ticket.', ephemeral: true });
  }

  await safeDeferReply(interaction);

  try {
    const { attachment } = await transcriptService.generateTranscript(interaction.channel, ticket);

    const guildData = await require('../repositories/guildRepository').getGuild(interaction.guild.id);
    if (guildData?.logChannelId) {
      try {
        const logChannel = await interaction.guild.channels.fetch(guildData.logChannelId);
        if (logChannel) {
          await logChannel.send({
            content: `🗑️ Ticket #${ticket.number} excluído por <@${interaction.user.id}>`,
            files: [attachment],
          });
        }
      } catch (err) {
        logger.error('Erro ao enviar log:', err.message);
      }
    }
  } catch (err) {
    logger.error('Erro ao gerar transcript antes de excluir:', err.message);
  }

  await ticketRepository.deleteTicket(interaction.channel.id);

  await safeEditReply(interaction, { content: '🗑️ Este canal será excluído em 5 segundos...' });

  setTimeout(async () => {
    try {
      await interaction.channel.delete();
    } catch (err) {
      logger.error('Erro ao excluir canal:', err.message);
    }
  }, 5000);
}

async function handleModal(interaction) {
  const customId = interaction.customId;

  if (customId.startsWith('ticket_form_')) {
    const panelId = customId.replace('ticket_form_', '');
    await handleTicketFormSubmit(interaction, panelId);
    return;
  }

  if (customId === 'panel_create_modal') {
    await handlePanelCreateSubmit(interaction);
    return;
  }

  if (customId.startsWith('panel_edit_modal_')) {
    const panelId = customId.replace('panel_edit_modal_', '');
    await handlePanelEditSubmit(interaction, panelId);
    return;
  }

  if (customId.startsWith('form_edit_modal_')) {
    const panelId = customId.replace('form_edit_modal_', '');
    await handleFormEditSubmit(interaction, panelId);
    return;
  }

  if (customId.startsWith('msg_edit_modal_')) {
    const panelId = customId.replace('msg_edit_modal_', '');
    await handleMessageEditSubmit(interaction, panelId);
    return;
  }
}

async function handleTicketFormSubmit(interaction, panelId) {
  await safeDeferReply(interaction);

  const panel = await panelRepository.getPanel(panelId);
  if (!panel) {
    return safeEditReply(interaction, { content: '❌ Painel não encontrado.' });
  }

  const responses = [];
  for (const question of panel.questions) {
    const value = interaction.fields.getTextInputValue(`q_${question.id}`) || '';
    responses.push({
      question: question.title,
      answer: value,
    });
  }

  try {
    await ticketService.createTicket(interaction, panelId, responses);
  } catch (err) {
    logger.error('Erro ao criar ticket:', err.message);
    await safeEditReply(interaction, { content: `❌ Erro ao criar ticket: ${err.message}` });
  }
}

async function handlePanelCreateSubmit(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Sem permissão.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const name = interaction.fields.getTextInputValue('panel_name');
  const title = interaction.fields.getTextInputValue('panel_title');
  const description = interaction.fields.getTextInputValue('panel_description');
  const color = interaction.fields.getTextInputValue('panel_color') || '#2b2d31';
  const buttonText = interaction.fields.getTextInputValue('panel_button_text') || 'Abrir ticket';

  const panel = await panelRepository.createPanel({
    guildId: interaction.guild.id,
    name,
    title,
    description,
    color,
    buttonText,
    channelId: interaction.channelId,
  });

  const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder } = require('discord.js');

  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId(`panel_config_channel_${panel.id}`)
    .setPlaceholder('Selecione a categoria para tickets')
    .setChannelTypes(ChannelType.GuildCategory);

  const roleSelect = new RoleSelectMenuBuilder()
    .setCustomId(`panel_config_role_${panel.id}`)
    .setPlaceholder('Selecione o cargo da equipe');

  const channelRow = new ActionRowBuilder().addComponents(channelSelect);
  const roleRow = new ActionRowBuilder().addComponents(roleSelect);

  await safeEditReply(interaction, {
    content: `✅ Painel **${name}** criado!\n\nAgora configure a categoria e o cargo da equipe:`,
    components: [channelRow, roleRow],
  });
}

async function handlePanelEditSubmit(interaction, panelId) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Sem permissão.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const updates = {};
  const name = interaction.fields.getTextInputValue('panel_name');
  const title = interaction.fields.getTextInputValue('panel_title');
  const description = interaction.fields.getTextInputValue('panel_description');
  const color = interaction.fields.getTextInputValue('panel_color');
  const buttonText = interaction.fields.getTextInputValue('panel_button_text');

  if (name) updates.name = name;
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (color) updates.color = color;
  if (buttonText) updates.buttonText = buttonText;

  await panelRepository.updatePanel(panelId, updates);

  await safeEditReply(interaction, { content: '✅ Painel atualizado com sucesso!' });
}

async function handleFormEditSubmit(interaction, panelId) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Sem permissão.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const title = interaction.fields.getTextInputValue('question_title');
  const placeholder = interaction.fields.getTextInputValue('question_placeholder');
  const required = interaction.fields.getTextInputValue('question_required') === 'sim';
  const style = interaction.fields.getTextInputValue('question_style') === 'paragrafo' ? 'paragraph' : 'short';

  const panel = await panelRepository.getPanel(panelId);
  if (!panel) {
    return safeEditReply(interaction, { content: '❌ Painel não encontrado.' });
  }

  const questions = panel.questions || [];
  const newQuestion = {
    id: `q${Date.now()}`,
    title,
    placeholder,
    style,
    required,
    minLength: 0,
    maxLength: 1000,
  };

  questions.push(newQuestion);
  await panelRepository.updatePanel(panelId, { questions });

  await safeEditReply(interaction, { content: `✅ Pergunta "${title}" adicionada ao formulário.` });
}

async function handleMessageEditSubmit(interaction, panelId) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Sem permissão.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const ticketMessage = interaction.fields.getTextInputValue('ticket_message');
  const ticketTitle = interaction.fields.getTextInputValue('ticket_title');

  await panelRepository.updatePanel(panelId, { ticketMessage, ticketTitle });

  await safeEditReply(interaction, { content: '✅ Mensagem automática atualizada!' });
}

async function handleSelectMenu(interaction) {
  const customId = interaction.customId;

  try {
    await interaction.deferUpdate();
  } catch {
    // Já respondido ou interação expirada
    return;
  }

  if (customId === 'ticket_config_menu') {
    await handleTicketConfigSelect(interaction);
    return;
  }

  if (customId === 'panel_edit_select') {
    await handlePanelEditSelect(interaction);
    return;
  }

  if (customId === 'panel_publish_select') {
    await handlePanelPublishSelect(interaction);
    return;
  }

  if (customId === 'panel_delete_select') {
    await handlePanelDeleteSelect(interaction);
    return;
  }

  if (customId === 'form_select_panel') {
    await handleFormSelectPanel(interaction);
    return;
  }

  if (customId === 'msg_select_panel') {
    await handleMessageSelectPanel(interaction);
    return;
  }

  if (customId === 'panel_test_select') {
    await handlePanelTestSelect(interaction);
    return;
  }

  if (customId.startsWith('panel_config_channel_')) {
    const panelId = customId.replace('panel_config_channel_', '');
    await handlePanelConfigChannel(interaction, panelId);
    return;
  }

  if (customId.startsWith('panel_config_role_')) {
    const panelId = customId.replace('panel_config_role_', '');
    await handlePanelConfigRole(interaction, panelId);
    return;
  }

  if (customId === 'config_log_channel') {
    const channelId = interaction.values[0];
    const guildRepository = require('../repositories/guildRepository');
    await guildRepository.updateGuild(interaction.guild.id, { logChannelId: channelId });
    await interaction.editReply({ content: `✅ Canal de logs configurado: <#${channelId}>`, components: [] });
    return;
  }

  if (customId === 'config_admin_role') {
    const roleId = interaction.values[0];
    const guildRepository = require('../repositories/guildRepository');
    await guildRepository.updateGuild(interaction.guild.id, { adminRoleId: roleId });
    await interaction.editReply({ content: `✅ Cargo de admin configurado: <@&${roleId}>`, components: [] });
    return;
  }

  if (customId === 'config_auto_role') {
    const roleId = interaction.values[0];
    const guildRepository = require('../repositories/guildRepository');
    await guildRepository.updateGuild(interaction.guild.id, { autoRoleId: roleId });
    await interaction.editReply({ content: `✅ Cargo automático configurado: <@&${roleId}>`, components: [] });
    return;
  }
}

async function handleTicketConfigSelect(interaction) {
  const value = interaction.values[0];

  if (value === 'log_channel') {
    const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');
    const select = new ChannelSelectMenuBuilder()
      .setCustomId('config_log_channel')
      .setPlaceholder('Selecione o canal de logs')
      .setChannelTypes(ChannelType.GuildText);
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.editReply({ content: '📋 Selecione o canal de logs:', components: [row] });
  } else if (value === 'admin_role') {
    const { ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
    const select = new RoleSelectMenuBuilder()
      .setCustomId('config_admin_role')
      .setPlaceholder('Selecione o cargo de administrador');
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.editReply({ content: '👑 Selecione o cargo de administrador:', components: [row] });
  } else if (value === 'auto_role') {
    const { ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
    const select = new RoleSelectMenuBuilder()
      .setCustomId('config_auto_role')
      .setPlaceholder('Selecione o cargo automático');
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.editReply({ content: '🎁 Selecione o cargo automático para novos membros:', components: [row] });
  }
}

async function handlePanelEditSelect(interaction) {
  const panelId = interaction.values[0];
  const panel = await panelRepository.getPanel(panelId);
  if (!panel) {
    return interaction.update({ content: '❌ Painel não encontrado.', components: [] });
  }

  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

  const modal = new ModalBuilder()
    .setCustomId(`panel_edit_modal_${panelId}`)
    .setTitle(`Editar - ${panel.name}`);

  const nameInput = new TextInputBuilder()
    .setCustomId('panel_name')
    .setLabel('Nome interno')
    .setValue(panel.name)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const titleInput = new TextInputBuilder()
    .setCustomId('panel_title')
    .setLabel('Título do embed')
    .setValue(panel.title)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const descInput = new TextInputBuilder()
    .setCustomId('panel_description')
    .setLabel('Descrição do embed')
    .setValue(panel.description)
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const colorInput = new TextInputBuilder()
    .setCustomId('panel_color')
    .setLabel('Cor (hex)')
    .setValue(panel.color || '#2b2d31')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const buttonInput = new TextInputBuilder()
    .setCustomId('panel_button_text')
    .setLabel('Texto do botão')
    .setValue(panel.buttonText || 'Abrir ticket')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(buttonInput),
  );

  await interaction.showModal(modal);
}

async function handlePanelPublishSelect(interaction) {
  const panelId = interaction.values[0];

  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

  const modal = new ModalBuilder()
    .setCustomId(`panel_publish_channel_${panelId}`)
    .setTitle('Publicar Painel');

  const channelInput = new TextInputBuilder()
    .setCustomId('publish_channel_id')
    .setLabel('ID do canal onde publicar')
    .setPlaceholder('Cole o ID do canal')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(channelInput));

  await interaction.showModal(modal);
}

async function handlePanelDeleteSelect(interaction) {
  const panelId = interaction.values[0];
  const panel = await panelRepository.getPanel(panelId);
  if (!panel) {
    return interaction.update({ content: '❌ Painel não encontrado.', components: [] });
  }

  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`panel_confirm_delete_${panelId}`)
      .setLabel('Sim, excluir')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('panel_cancel_delete')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({
    content: `⚠️ Tem certeza que deseja excluir o painel **${panel.name}**?`,
    components: [row],
  });
}

async function handleFormSelectPanel(interaction) {
  const panelId = interaction.values[0];
  const panel = await panelRepository.getPanel(panelId);
  if (!panel) {
    return interaction.editReply({ content: '❌ Painel não encontrado.', components: [] });
  }

  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

  const modal = new ModalBuilder()
    .setCustomId(`form_edit_modal_${panelId}`)
    .setTitle(`Adicionar Pergunta - ${panel.name}`);

  const titleInput = new TextInputBuilder()
    .setCustomId('question_title')
    .setLabel('Título da pergunta')
    .setPlaceholder('Ex.: Qual seu nome?')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const placeholderInput = new TextInputBuilder()
    .setCustomId('question_placeholder')
    .setLabel('Placeholder')
    .setPlaceholder('Ex.: Digite seu nome')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const requiredInput = new TextInputBuilder()
    .setCustomId('question_required')
    .setLabel('Obrigatória? (sim/não)')
    .setValue('sim')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const styleInput = new TextInputBuilder()
    .setCustomId('question_style')
    .setLabel('Estilo (curto/paragrafo)')
    .setValue('curto')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(placeholderInput),
    new ActionRowBuilder().addComponents(requiredInput),
    new ActionRowBuilder().addComponents(styleInput),
  );

  await interaction.showModal(modal);
}

async function handleMessageSelectPanel(interaction) {
  const panelId = interaction.values[0];
  const panel = await panelRepository.getPanel(panelId);
  if (!panel) {
    return interaction.update({ content: '❌ Painel não encontrado.', components: [] });
  }

  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

  const modal = new ModalBuilder()
    .setCustomId(`msg_edit_modal_${panelId}`)
    .setTitle(`Mensagem - ${panel.name}`);

  const messageInput = new TextInputBuilder()
    .setCustomId('ticket_message')
    .setLabel('Mensagem automática')
    .setValue(panel.ticketMessage || '')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Use {cliente} para mencionar o cliente');

  const titleInput = new TextInputBuilder()
    .setCustomId('ticket_title')
    .setLabel('Título do embed')
    .setValue(panel.ticketTitle || 'Novo Ticket')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(messageInput),
    new ActionRowBuilder().addComponents(titleInput),
  );

  await interaction.showModal(modal);
}

async function handlePanelTestSelect(interaction) {
  const panelId = interaction.values[0];
  const panel = await panelRepository.getPanel(panelId);
  if (!panel) {
    return interaction.update({ content: '❌ Painel não encontrado.', components: [] });
  }

  const { createPanelEmbed } = require('../utils/embeds');
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

  const embed = createPanelEmbed(panel);
  const button = new ButtonBuilder()
    .setCustomId('ticket_open_test')
    .setLabel(panel.buttonText || 'Abrir ticket')
    .setStyle(ButtonStyle.Primary);

  if (panel.buttonEmoji) button.setEmoji(panel.buttonEmoji);

  const row = new ActionRowBuilder().addComponents(button);

  await interaction.editReply({
    content: '🧪 **Prévia do Painel:**',
    embeds: [embed],
    components: [row],
  });
}

async function handlePanelConfigChannel(interaction, panelId) {
  const channelId = interaction.values[0];
  await panelRepository.updatePanel(panelId, { categoryId: channelId });
  await interaction.editReply({ content: `✅ Categoria configurada: <#${channelId}>`, components: [] });
}

async function handlePanelConfigRole(interaction, panelId) {
  const roleId = interaction.values[0];
  await panelRepository.updatePanel(panelId, { teamRoleId: roleId });
  await interaction.editReply({ content: `✅ Cargo da equipe configurado: <@&${roleId}>`, components: [] });
}

async function handlePanelConfigSelect(interaction) {
  const value = interaction.values[0];

  if (value === 'log_channel') {
    const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');
    const select = new ChannelSelectMenuBuilder()
      .setCustomId('config_log_channel')
      .setPlaceholder('Selecione o canal de logs')
      .setChannelTypes(ChannelType.GuildText);
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.editReply({ content: '📋 Selecione o canal de logs:', components: [row] });
  } else if (value === 'admin_role') {
    const { ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
    const select = new RoleSelectMenuBuilder()
      .setCustomId('config_admin_role')
      .setPlaceholder('Selecione o cargo de administrador');
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.editReply({ content: '👑 Selecione o cargo de administrador:', components: [row] });
  } else if (value === 'auto_role') {
    const { ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
    const select = new RoleSelectMenuBuilder()
      .setCustomId('config_auto_role')
      .setPlaceholder('Selecione o cargo automático');
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.editReply({ content: '🎁 Selecione o cargo automático para novos membros:', components: [row] });
  }
}

async function handlePanelConfigAction(interaction) {
  const customId = interaction.customId;

  if (customId.startsWith('panel_publish_channel_')) {
    const panelId = customId.replace('panel_publish_channel_', '');
    const channelId = interaction.fields.getTextInputValue('publish_channel_id');

    try {
      const channel = await interaction.guild.channels.fetch(channelId);
      if (!channel) {
        return interaction.reply({ content: '❌ Canal não encontrado.', ephemeral: true });
      }

      await panelRepository.updatePanel(panelId, { channelId });
      await panelService.publishPanel(interaction.client, panelId);

      await interaction.reply({ content: `✅ Painel publicado em <#${channelId}>`, ephemeral: true });
    } catch (err) {
      logger.error('Erro ao publicar painel:', err.message);
      await interaction.reply({ content: `❌ Erro: ${err.message}`, ephemeral: true });
    }
    return;
  }
}

async function handleWelcomeCommand(interaction, subcommand) {
  switch (subcommand) {
    case 'configurar':
      await handleWelcomeConfigurar(interaction);
      break;
    case 'testar':
      await handleWelcomeTestar(interaction);
      break;
    case 'desativar':
      await handleWelcomeDesativar(interaction);
      break;
    case 'status':
      await handleWelcomeStatus(interaction);
      break;
  }
}

async function handleWelcomeConfigurar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Esta ação só pode ser utilizada por administradores.',
      ephemeral: true,
    });
  }

  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

  const modal = new ModalBuilder()
    .setCustomId('welcome_config_modal')
    .setTitle('Configurar Mensagem de Boas-Vindas');

  const channelInput = new TextInputBuilder()
    .setCustomId('welcome_channel')
    .setLabel('ID do canal de boas-vindas')
    .setPlaceholder('Cole o ID do canal')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const titleInput = new TextInputBuilder()
    .setCustomId('welcome_title')
    .setLabel('Título do embed')
    .setPlaceholder('Bem-vindo(a)!')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const textInput = new TextInputBuilder()
    .setCustomId('welcome_text')
    .setLabel('Texto da mensagem')
    .setPlaceholder('Olá {usuario_mencao}, bem-vindo ao {servidor}!')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const colorInput = new TextInputBuilder()
    .setCustomId('welcome_color')
    .setLabel('Cor (hex)')
    .setPlaceholder('#2b2d31')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(channelInput),
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(textInput),
    new ActionRowBuilder().addComponents(colorInput),
  );

  await interaction.showModal(modal);
}

async function handleWelcomeTestar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Sem permissão.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const guildRepository = require('../repositories/guildRepository');
  const guildData = await guildRepository.getGuild(interaction.guild.id);

  if (!guildData?.welcome?.enabled) {
    return safeEditReply(interaction, { content: '❌ Sistema de boas-vindas não está configurado.' });
  }

  const { EmbedBuilder } = require('discord.js');
  const welcome = guildData.welcome;

  const variables = {
    '{usuario}': interaction.user.tag,
    '{usuario_mencao}': `<@${interaction.user.id}>`,
    '{servidor}': interaction.guild.name,
    '{membros}': interaction.guild.memberCount.toString(),
    '{data}': new Date().toLocaleDateString('pt-BR'),
  };

  let text = welcome.text || '';
  for (const [key, value] of Object.entries(variables)) {
    text = text.split(key).join(value);
  }

  const embed = new EmbedBuilder()
    .setColor(welcome.color || '#2b2d31')
    .setTitle(welcome.title || 'Bem-vindo(a)!')
    .setDescription(text)
    .setTimestamp();

  if (welcome.imageUrl) embed.setImage(welcome.imageUrl);
  if (welcome.thumbnailUrl) embed.setThumbnail(welcome.thumbnailUrl);
  if (welcome.footer) embed.setFooter({ text: welcome.footer });

  await safeEditReply(interaction, {
    content: '🧪 **Prévia da mensagem de boas-vindas:**',
    embeds: [embed],
  });
}

async function handleWelcomeDesativar(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Sem permissão.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const guildRepository = require('../repositories/guildRepository');
  const guildData = await guildRepository.getGuild(interaction.guild.id);

  if (!guildData?.welcome) {
    return safeEditReply(interaction, { content: '❌ Sistema de boas-vindas não está configurado.' });
  }

  guildData.welcome.enabled = false;
  await guildRepository.updateGuild(interaction.guild.id, { welcome: guildData.welcome });

  await safeEditReply(interaction, { content: '✅ Sistema de boas-vindas desativado.' });
}

async function handleWelcomeStatus(interaction) {
  if (!canManageTicket(interaction.member)) {
    return safeReply(interaction, {
      content: '❌ Sem permissão.',
      ephemeral: true,
    });
  }

  await safeDeferReply(interaction);

  const guildRepository = require('../repositories/guildRepository');
  const guildData = await guildRepository.getGuild(interaction.guild.id);
  const welcome = guildData?.welcome;

  let status = '# 📋 Status - Boas-Vindas\n\n';

  if (!welcome || !welcome.enabled) {
    status += 'Sistema **desativado** ou não configurado.\n';
    status += 'Use `/boas-vindas configurar` para ativar.';
  } else {
    status += `**Status:** 🟢 Ativado\n`;
    status += `**Canal:** ${welcome.channelId ? `<#${welcome.channelId}>` : '❌ Não configurado'}\n`;
    status += `**Título:** ${welcome.title || 'Não configurado'}\n`;
    status += `**Cor:** ${welcome.color || 'Padrão'}\n`;
    status += `**Embed:** ${welcome.useEmbed ? 'Sim' : 'Não'}\n`;
    status += `**Cargo automático:** ${welcome.autoRoleId ? `<@&${welcome.autoRoleId}>` : 'Não configurado'}\n`;
    status += `**Mencionar usuário:** ${welcome.mentionUser ? 'Sim' : 'Não'}\n`;
  }

  await safeEditReply(interaction, { content: status });
}
