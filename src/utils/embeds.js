const { EmbedBuilder } = require('discord.js');

function createPanelEmbed(panel) {
  const embed = new EmbedBuilder()
    .setTitle(panel.title || 'Área de Compras!')
    .setDescription(panel.description || 'Clique no botão abaixo para abrir um ticket.')
    .setColor(panel.color || '#2b2d31');

  if (panel.imageUrl) embed.setImage(panel.imageUrl);
  if (panel.thumbnailUrl) embed.setThumbnail(panel.thumbnailUrl);
  if (panel.footer) embed.setFooter({ text: panel.footer });

  return embed;
}

function createTicketWelcomeEmbed(ticket, panel, responses) {
  const embed = new EmbedBuilder()
    .setTitle(`Ticket #${ticket.number} - ${panel.ticketTitle || 'Novo Ticket'}`)
    .setColor(panel.ticketColor || '#2b2d31')
    .setDescription(panel.ticketDescription || 'Seu ticket foi aberto com sucesso.')
    .addFields(
      { name: 'Status', value: 'Aguardando atendimento', inline: true },
      { name: 'Criado em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      { name: 'Cliente', value: `<@${ticket.userId}>`, inline: true }
    )
    .setTimestamp();

  if (responses && responses.length > 0) {
    const responseText = responses
      .map((r, i) => `**${i + 1}. ${r.question}:**\n${r.answer || 'Não respondido'}`)
      .join('\n\n');

    if (responseText.length <= 4096) {
      embed.addFields({ name: 'Respostas do Formulário', value: responseText });
    } else {
      const chunks = [];
      let remaining = responseText;
      while (remaining.length > 0) {
        chunks.push(remaining.substring(0, 1024));
        remaining = remaining.substring(1024);
      }
      chunks.forEach((chunk, i) => {
        embed.addFields({ name: i === 0 ? 'Respostas do Formulário' : '\u200B', value: chunk });
      });
    }
  }

  if (panel.ticketImageUrl) embed.setImage(panel.ticketImageUrl);
  if (panel.ticketThumbnailUrl) embed.setThumbnail(panel.ticketThumbnailUrl);
  if (panel.ticketFooter) embed.setFooter({ text: panel.ticketFooter });

  return embed;
}

function createLogEmbed(action, data) {
  const colors = {
    ticket_opened: '#00ff00',
    ticket_claimed: '#0099ff',
    ticket_closed: '#ff9900',
    ticket_reopened: '#00ff99',
    ticket_deleted: '#ff0000',
    member_added: '#9900ff',
    member_removed: '#ff0099',
  };

  const embed = new EmbedBuilder()
    .setTitle(`📋 ${action}`)
    .setColor(colors[action] || '#2b2d31')
    .setTimestamp();

  if (data.user) embed.addFields({ name: 'Usuário', value: `<@${data.user}>`, inline: true });
  if (data.client) embed.addFields({ name: 'Cliente', value: `<@${data.client}>`, inline: true });
  if (data.ticket) embed.addFields({ name: 'Ticket', value: `#${data.ticket}`, inline: true });
  if (data.reason) embed.addFields({ name: 'Motivo', value: data.reason, inline: false });
  if (data.channel) embed.addFields({ name: 'Canal', value: `<#${data.channel}>`, inline: true });

  return embed;
}

module.exports = { createPanelEmbed, createTicketWelcomeEmbed, createLogEmbed };
