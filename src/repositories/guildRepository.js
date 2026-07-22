const path = require('path');
const { readJson, writeJson } = require('../utils/atomicJson');
const { config } = require('../config');
const logger = require('../utils/logger');

const FILE_PATH = path.join(config.dataDir, 'guilds.json');

let cache = null;

async function load() {
  if (!cache) {
    cache = await readJson(FILE_PATH);
  }
  return cache;
}

async function save() {
  if (cache) {
    await writeJson(FILE_PATH, cache);
  }
}

async function getGuild(guildId) {
  const data = await load();
  return data[guildId] || null;
}

async function getOrCreateGuild(guildId) {
  const data = await load();
  if (!data[guildId]) {
    data[guildId] = {
      guildId,
      logChannelId: null,
      adminRoleId: null,
      autoRoleId: null,
      createdAt: new Date().toISOString(),
    };
    await save();
  }
  return data[guildId];
}

async function updateGuild(guildId, updates) {
  const data = await load();
  if (!data[guildId]) {
    data[guildId] = { guildId, createdAt: new Date().toISOString() };
  }
  Object.assign(data[guildId], updates);
  await save();
  return data[guildId];
}

async function deleteGuild(guildId) {
  const data = await load();
  delete data[guildId];
  await save();
}

function reloadCache() {
  cache = null;
}

module.exports = { getGuild, getOrCreateGuild, updateGuild, deleteGuild, reloadCache };
