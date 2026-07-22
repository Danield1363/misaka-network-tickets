const path = require('path');
const { readJson, writeJson } = require('../utils/atomicJson');
const { config } = require('../config');
const logger = require('../utils/logger');

const FILE_PATH = path.join(config.dataDir, 'panels.json');

let cache = null;

async function load() {
  if (!cache) {
    cache = await readJson(FILE_PATH);
    if (!cache.panels) cache.panels = {};
  }
  return cache;
}

async function save() {
  if (cache) {
    await writeJson(FILE_PATH, cache);
  }
}

async function getPanel(panelId) {
  const data = await load();
  return data.panels[panelId] || null;
}

async function getPanelsByGuild(guildId) {
  const data = await load();
  return Object.values(data.panels).filter(p => p.guildId === guildId);
}

async function createPanel(panelData) {
  const data = await load();
  const id = `panel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const panel = {
    id,
    guildId: panelData.guildId,
    name: panelData.name || 'Painel',
    title: panelData.title || 'Área de Compras!',
    description: panelData.description || 'Clique no botão abaixo para abrir um ticket.',
    color: panelData.color || '#2b2d31',
    imageUrl: panelData.imageUrl || null,
    thumbnailUrl: panelData.thumbnailUrl || null,
    footer: panelData.footer || null,
    buttonText: panelData.buttonText || 'Abrir ticket',
    buttonEmoji: panelData.buttonEmoji || '🎫',
    buttonStyle: panelData.buttonStyle || 1,
    channelId: panelData.channelId || null,
    categoryId: panelData.categoryId || null,
    teamRoleId: panelData.teamRoleId || null,
    specificUserId: panelData.specificUserId || null,
    logChannelId: panelData.logChannelId || null,
    maxTicketsPerUser: panelData.maxTicketsPerUser || 1,
    ticketMessage: panelData.ticketMessage || 'Olá, {cliente}! Seu ticket foi aberto com sucesso.',
    ticketImageUrl: panelData.ticketImageUrl || null,
    ticketThumbnailUrl: panelData.ticketThumbnailUrl || null,
    ticketTitle: panelData.ticketTitle || 'Novo Ticket',
    ticketDescription: panelData.ticketDescription || 'Aguardando atendimento.',
    ticketColor: panelData.ticketColor || '#2b2d31',
    ticketFooter: panelData.ticketFooter || null,
    channelNamePattern: panelData.channelNamePattern || 'ticket-{numero}-{usuario}',
    enabled: panelData.enabled !== undefined ? panelData.enabled : true,
    questions: panelData.questions || getDefaultQuestions(),
    inactivity: {
      enabled: false,
      hours: 24,
      warningMessage: '⚠️ Este ticket está inativo há mais de 24 horas. Responda para mantê-lo aberto.',
      closeAfterWarning: true,
      warningDelayHours: 1,
    },
    messageId: null,
    createdAt: new Date().toISOString(),
  };
  data.panels[id] = panel;
  await save();
  logger.info(`Painel criado: ${panel.name} (${id})`);
  return panel;
}

async function updatePanel(panelId, updates) {
  const data = await load();
  if (!data.panels[panelId]) return null;
  Object.assign(data.panels[panelId], updates);
  await save();
  logger.info(`Painel atualizado: ${panelId}`);
  return data.panels[panelId];
}

async function deletePanel(panelId) {
  const data = await load();
  const panel = data.panels[panelId];
  if (!panel) return false;
  delete data.panels[panelId];
  await save();
  logger.info(`Painel excluído: ${panelId}`);
  return true;
}

function getDefaultQuestions() {
  return [
    {
      id: 'q1',
      title: 'Qual serviço você gostaria?',
      placeholder: 'Ex.: exploração de mapa, farm, missão ou outro serviço',
      style: 'paragraph',
      required: true,
      minLength: 5,
      maxLength: 1000,
    },
    {
      id: 'q2',
      title: 'Qual seu AR? (Rank de Aventura)',
      placeholder: 'Ex.: AR 57',
      style: 'short',
      required: true,
      minLength: 1,
      maxLength: 100,
    },
    {
      id: 'q3',
      title: 'Como está sua exploração?',
      placeholder: 'Baixa, média ou alta',
      style: 'short',
      required: true,
      minLength: 1,
      maxLength: 100,
    },
    {
      id: 'q4',
      title: 'Qual o servidor da sua conta?',
      placeholder: 'Ex.: América',
      style: 'short',
      required: true,
      minLength: 1,
      maxLength: 100,
    },
    {
      id: 'q5',
      title: 'Observações adicionais',
      placeholder: 'Prazo, detalhes ou informações importantes',
      style: 'paragraph',
      required: false,
      minLength: 0,
      maxLength: 1000,
    },
  ];
}

function reloadCache() {
  cache = null;
}

module.exports = { getPanel, getPanelsByGuild, createPanel, updatePanel, deletePanel, getDefaultQuestions, reloadCache };
