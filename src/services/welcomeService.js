const { EmbedBuilder } = require('discord.js');
const { safeReply, safeDeferReply } = require('../utils/interactionResponse');
const { sanitizeText, sanitizeUrl } = require('../utils/sanitize');
const logger = require('../utils/logger');

function getWelcomeConfig(guildId) {
  const guildRepository = require('../repositories/guildRepository');
  return guildRepository.getGuild(guildId);
}

async function handleWelcome(member) {
  try {
    const guildRepository = require('../repositories/guildRepository');
    const guildData = await guildRepository.getGuild(member.guild.id);

    if (!guildData?.welcome) return;
    if (!guildData.welcome.enabled) return;

    const welcome = guildData.welcome;
    const channel = await member.guild.channels.fetch(welcome.channelId);
    if (!channel) return;

    const variables = {
      '{usuario}': member.user.tag,
      '{usuario_mencao}': `<@${member.id}>`,
      '{servidor}': member.guild.name,
      '{membros}': member.guild.memberCount.toString(),
      '{data}': new Date().toLocaleDateString('pt-BR'),
    };

    let text = welcome.text || '';
    for (const [key, value] of Object.entries(variables)) {
      text = text.split(key).join(value);
    }

    const allowedMentions = {
      parse: welcome.mentionUser ? ['users'] : [],
    };

    if (welcome.useEmbed) {
      const embed = new EmbedBuilder()
        .setColor(welcome.color || '#2b2d31')
        .setTimestamp();

      if (welcome.title) embed.setTitle(welcome.title);
      if (text) embed.setDescription(sanitizeText(text));
      if (welcome.imageUrl) embed.setImage(welcome.imageUrl);
      if (welcome.thumbnailUrl) embed.setThumbnail(welcome.thumbnailUrl);
      if (welcome.footer) embed.setFooter({ text: welcome.footer });

      const components = [];
      if (welcome.buttonUrl && welcome.buttonText) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel(welcome.buttonText)
            .setURL(welcome.buttonUrl)
            .setStyle(ButtonStyle.Link)
        );
        components.push(row);
      }

      await channel.send({
        embeds: [embed],
        content: welcome.mentionUser ? `<@${member.id}>` : undefined,
        allowedMentions,
        components,
      });
    } else {
      await channel.send({
        content: text,
        allowedMentions,
      });
    }

    if (welcome.autoRoleId) {
      try {
        const role = await member.guild.roles.fetch(welcome.autoRoleId);
        if (role) {
          await member.roles.add(role);
          logger.debug(`Cargo automático adicionado a ${member.user.tag}`);
        }
      } catch (err) {
        logger.error('Erro ao adicionar cargo automático:', err.message);
      }
    }
  } catch (err) {
    logger.error('Erro ao processar boas-vindas:', err.message);
  }
}

module.exports = { handleWelcome, getWelcomeConfig };
