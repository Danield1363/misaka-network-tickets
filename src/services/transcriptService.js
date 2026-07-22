const { AttachmentBuilder } = require('discord.js');
const ticketRepository = require('../repositories/ticketRepository');
const panelRepository = require('../repositories/panelRepository');
const { escapeHtml, sanitizeFileName } = require('../utils/sanitize');
const logger = require('../utils/logger');

async function generateTranscript(channel, ticketData) {
  try {
    const messages = [];
    let lastId = null;
    let fetchMore = true;

    while (fetchMore) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;

      const fetched = await channel.messages.fetch(options);
      if (fetched.size === 0) {
        fetchMore = false;
        break;
      }

      fetched.forEach(msg => messages.push(msg));
      lastId = fetched.last()?.id;

      if (fetched.size < 100) fetchMore = false;
    }

    messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const panel = await panelRepository.getPanel(ticketData?.panelId);
    const ticketNumber = ticketData?.number || '0000';

    let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Transcript - Ticket #${ticketNumber}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1a1a2e; color: #e0e0e0; padding: 20px; }
.container { max-width: 900px; margin: 0 auto; }
.header { background: #16213e; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #0f3460; }
.header h1 { color: #e94560; margin-bottom: 10px; }
.header p { color: #a0a0a0; margin: 5px 0; }
.message { background: #16213e; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 3px solid #0f3460; }
.message:hover { background: #1a2744; }
.author { font-weight: bold; color: #e94560; margin-bottom: 4px; }
.author img { width: 20px; height: 20px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
.timestamp { color: #666; font-size: 0.85em; }
.content { margin-top: 6px; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word; }
.attachment { margin-top: 8px; padding: 8px; background: #0f3460; border-radius: 6px; }
.attachment a { color: #4fc3f7; text-decoration: none; }
.footer { text-align: center; color: #666; margin-top: 20px; padding: 10px; border-top: 1px solid #333; }
.embed { background: #2f3136; border-radius: 8px; padding: 12px; margin-top: 8px; border-left: 4px solid #5865f2; }
.embed-title { font-weight: bold; color: #fff; margin-bottom: 6px; }
.embed-desc { color: #b9bbbe; }
.embed-field { margin-top: 6px; }
.embed-field-name { font-weight: bold; color: #b9bbbe; }
.embed-field-value { color: #dcddde; }
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>📋 Transcript - Ticket #${ticketNumber}</h1>
<p><strong>Servidor:</strong> ${escapeHtml(channel.guild.name)}</p>
<p><strong>Canal:</strong> ${escapeHtml(channel.name)}</p>
<p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
${ticketData ? `<p><strong>Cliente:</strong> &lt;@${escapeHtml(ticketData.userId)}&gt;</p>` : ''}
${ticketData?.claimedBy ? `<p><strong>Atendente:</strong> &lt;@${escapeHtml(ticketData.claimedBy)}&gt;</p>` : ''}
</div>`;

    for (const msg of messages) {
      const authorName = escapeHtml(msg.author.tag || msg.author.username);
      const avatarUrl = msg.author.displayAvatarURL({ size: 32 });
      const timestamp = new Date(msg.createdTimestamp).toLocaleString('pt-BR');
      const content = escapeHtml(msg.content || '');

      html += `
<div class="message">
<div class="author">
<img src="${escapeHtml(avatarUrl)}" alt="avatar">
${authorName}
<span class="timestamp"> - ${timestamp}</span>
</div>`;

      if (content) {
        html += `<div class="content">${content}</div>`;
      }

      if (msg.embeds.length > 0) {
        for (const embed of msg.embeds) {
          html += `<div class="embed">`;
          if (embed.title) html += `<div class="embed-title">${escapeHtml(embed.title)}</div>`;
          if (embed.description) html += `<div class="embed-desc">${escapeHtml(embed.description)}</div>`;
          if (embed.fields) {
            for (const field of embed.fields) {
              html += `<div class="embed-field"><div class="embed-field-name">${escapeHtml(field.name)}</div><div class="embed-field-value">${escapeHtml(field.value)}</div></div>`;
            }
          }
          html += `</div>`;
        }
      }

      if (msg.attachments.size > 0) {
        for (const [, attachment] of msg.attachments) {
          html += `<div class="attachment">📎 <a href="${escapeHtml(attachment.url)}" target="_blank">${escapeHtml(attachment.name)}</a></div>`;
        }
      }

      html += `</div>`;
    }

    html += `
<div class="footer">
<p>Transcript gerado em ${new Date().toLocaleString('pt-BR')}</p>
<p>Misaka Network - Sistema de Tickets</p>
</div>
</div>
</body>
</html>`;

    const fileName = `transcript-ticket-${String(ticketNumber).padStart(4, '0')}-${sanitizeFileName(channel.name)}.html`;
    const buffer = Buffer.from(html, 'utf8');
    const attachment = new AttachmentBuilder(buffer, { name: fileName });

    return { attachment, messageCount: messages.length };
  } catch (err) {
    logger.error('Erro ao gerar transcript:', err.message);
    throw err;
  }
}

module.exports = { generateTranscript };
