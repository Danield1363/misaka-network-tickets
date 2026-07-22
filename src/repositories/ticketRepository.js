const path = require('path');
const { readJson, writeJson } = require('../utils/atomicJson');
const { config } = require('../config');
const logger = require('../utils/logger');

const FILE_PATH = path.join(config.dataDir, 'tickets.json');

let cache = null;

async function load() {
  if (!cache) {
    cache = await readJson(FILE_PATH);
    if (!cache.tickets) cache.tickets = {};
  }
  return cache;
}

async function save() {
  if (cache) {
    await writeJson(FILE_PATH, cache);
  }
}

async function getTicket(channelId) {
  const data = await load();
  return data.tickets[channelId] || null;
}

async function getTicketById(ticketId) {
  const data = await load();
  return Object.values(data.tickets).find(t => t.id === ticketId) || null;
}

async function getOpenTicketsByUser(guildId, userId) {
  const data = await load();
  return Object.values(data.tickets).filter(
    t => t.guildId === guildId && t.userId === userId && t.status === 'open'
  );
}

async function getOpenTicketsByChannel(channelId) {
  const data = await load();
  const ticket = data.tickets[channelId];
  if (ticket && ticket.status === 'open') return ticket;
  return null;
}

async function createTicket(ticketData) {
  const data = await load();
  const ticket = {
    id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    guildId: ticketData.guildId,
    channelId: ticketData.channelId,
    userId: ticketData.userId,
    panelId: ticketData.panelId,
    number: ticketData.number || 0,
    status: 'open',
    claimedBy: null,
    responses: ticketData.responses || [],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    closedAt: null,
    closedBy: null,
    closeReason: null,
    warningSent: false,
  };
  data.tickets[channelId] = ticket;
  await save();
  logger.info(`Ticket criado: #${ticket.number} por ${ticket.userId}`);
  return ticket;
}

async function updateTicket(channelId, updates) {
  const data = await load();
  if (!data.tickets[channelId]) return null;
  Object.assign(data.tickets[channelId], updates);
  data.tickets[channelId].lastActivity = new Date().toISOString();
  await save();
  return data.tickets[channelId];
}

async function closeTicket(channelId, closedBy, reason) {
  return updateTicket(channelId, {
    status: 'closed',
    closedBy,
    closeReason: reason || 'Sem motivo',
    closedAt: new Date().toISOString(),
  });
}

async function reopenTicket(channelId) {
  return updateTicket(channelId, {
    status: 'open',
    closedAt: null,
    closedBy: null,
    closeReason: null,
    warningSent: false,
  });
}

async function deleteTicket(channelId) {
  const data = await load();
  delete data.tickets[channelId];
  await save();
}

async function getAllOpenTickets() {
  const data = await load();
  return Object.values(data.tickets).filter(t => t.status === 'open');
}

function reloadCache() {
  cache = null;
}

module.exports = {
  getTicket,
  getTicketById,
  getOpenTicketsByUser,
  getOpenTicketsByChannel,
  createTicket,
  updateTicket,
  closeTicket,
  reopenTicket,
  deleteTicket,
  getAllOpenTickets,
  reloadCache,
};
