const { PermissionFlagsBits } = require('discord.js');

const REQUIRED_BOT_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.ManageChannels,
];

const TICKET_CLIENT_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.ReadMessageHistory,
];

const TICKET_TEAM_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.ReadMessageHistory,
];

function hasGuildPermission(member, permissions) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (typeof permissions === 'string') {
    return member.permissions.has(PermissionFlagsBits[permissions]);
  }
  return member.permissions.has(permissions);
}

function checkBotPermissions(guild) {
  const botMember = guild.members.me;
  if (!botMember) return { missing: ['Bot não encontrado no servidor'] };

  const missing = REQUIRED_BOT_PERMISSIONS.filter(perm => !botMember.permissions.has(perm));

  return {
    hasAll: missing.length === 0,
    missing: missing.map(p => p.toString()),
  };
}

function checkTicketPermissions(guild) {
  const botMember = guild.members.me;
  if (!botMember) return { missing: ['Bot não encontrado no servidor'] };

  const missing = [
    ...TICKET_CLIENT_PERMISSIONS,
    ...TICKET_TEAM_PERMISSIONS,
  ].filter(perm => !botMember.permissions.has(perm));

  return {
    hasAll: missing.length === 0,
    missing: [...new Set(missing.map(p => p.toString()))],
  };
}

function isAdmin(member) {
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function isManageGuild(member) {
  if (!member) return false;
  return member.permissions.has(PermissionFlagsBits.ManageGuild);
}

function canManageTicket(member, teamRoleId) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  if (teamRoleId && member.roles.cache.has(teamRoleId)) return true;
  return false;
}

module.exports = {
  REQUIRED_BOT_PERMISSIONS,
  TICKET_CLIENT_PERMISSIONS,
  TICKET_TEAM_PERMISSIONS,
  hasGuildPermission,
  checkBotPermissions,
  checkTicketPermissions,
  isAdmin,
  isManageGuild,
  canManageTicket,
};
