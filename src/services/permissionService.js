const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { checkBotPermissions, TICKET_CLIENT_PERMISSIONS, TICKET_TEAM_PERMISSIONS } = require('../utils/permissions');
const logger = require('../utils/logger');

async function verifyGuildPermissions(guild) {
  const check = checkBotPermissions(guild);
  if (!check.hasAll) {
    logger.warn(`Permissões faltando no servidor ${guild.name}: ${check.missing.join(', ')}`);
  }
  return check;
}

async function setupTicketChannelPermissions(channel, userId, teamRoleId, specificUserId) {
  const permissionOverwrites = [
    {
      id: channel.guild.roles.everyone.id,
      allow: [],
      deny: [
        PermissionFlagsBits.ViewChannel,
      ],
    },
    {
      id: userId,
      allow: TICKET_CLIENT_PERMISSIONS,
      deny: [],
    },
    {
      id: channel.guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
      ],
      deny: [],
    },
  ];

  if (teamRoleId) {
    permissionOverwrites.push({
      id: teamRoleId,
      allow: TICKET_TEAM_PERMISSIONS,
      deny: [],
    });
  }

  if (specificUserId) {
    permissionOverwrites.push({
      id: specificUserId,
      allow: TICKET_TEAM_PERMISSIONS,
      deny: [],
    });
  }

  await channel.permissionOverwrites.set(permissionOverwrites);
}

async function lockTicketForClient(channel) {
  const everyoneOverwrite = channel.permissionOverwrites.cache.get(channel.guild.roles.everyone.id);
  const currentAllow = everyoneOverwrite ? everyoneOverwrite.allow : 0n;
  const currentDeny = everyoneOverwrite ? everyoneOverwrite.deny : 0n;

  const newDeny = currentDeny | PermissionFlagsBits.SendMessages;

  await channel.permissionOverwrites.edit(channel.guild.roles.everyone.id, {
    deny: newDeny,
  });
}

async function unlockTicketForClient(channel) {
  const everyoneOverwrite = channel.permissionOverwrites.cache.get(channel.guild.roles.everyone.id);
  if (!everyoneOverwrite) return;

  const newDeny = everyoneOverwrite.deny & ~PermissionFlagsBits.SendMessages;

  await channel.permissionOverwrites.edit(channel.guild.roles.everyone.id, {
    deny: newDeny,
  });
}

module.exports = {
  verifyGuildPermissions,
  setupTicketChannelPermissions,
  lockTicketForClient,
  unlockTicketForClient,
};
