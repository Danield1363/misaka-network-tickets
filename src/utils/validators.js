function validateGuildConfig(guildData) {
  if (!guildData) return false;
  if (!guildData.guildId || typeof guildData.guildId !== 'string') return false;
  return true;
}

function validatePanelConfig(panel) {
  if (!panel) return false;
  if (!panel.id || typeof panel.id !== 'string') return false;
  if (!panel.guildId || typeof panel.guildId !== 'string') return false;
  if (!panel.name || typeof panel.name !== 'string') return false;
  if (!panel.channelId || typeof panel.channelId !== 'string') return false;
  if (!panel.categoryId || typeof panel.categoryId !== 'string') return false;
  if (!panel.teamRoleId || typeof panel.teamRoleId !== 'string') return false;
  return true;
}

function validateTicketData(ticket) {
  if (!ticket) return false;
  if (!ticket.id || typeof ticket.id !== 'string') return false;
  if (!ticket.guildId || typeof ticket.guildId !== 'string') return false;
  if (!ticket.channelId || typeof ticket.channelId !== 'string') return false;
  if (!ticket.userId || typeof ticket.userId !== 'string') return false;
  if (!ticket.panelId || typeof ticket.panelId !== 'string') return false;
  return true;
}

function validateFormQuestion(question) {
  if (!question) return false;
  if (!question.title || typeof question.title !== 'string') return false;
  if (!question.placeholder || typeof question.placeholder !== 'string') return false;
  if (!['short', 'paragraph'].includes(question.style)) return false;
  if (typeof question.required !== 'boolean') return false;
  if (question.minLength !== undefined && typeof question.minLength !== 'number') return false;
  if (question.maxLength !== undefined && typeof question.maxLength !== 'number') return false;
  return true;
}

module.exports = { validateGuildConfig, validatePanelConfig, validateTicketData, validateFormQuestion };
