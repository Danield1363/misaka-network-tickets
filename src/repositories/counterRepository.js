const path = require('path');
const { readJson, writeJson } = require('../utils/atomicJson');
const { config } = require('../config');

const FILE_PATH = path.join(config.dataDir, 'counters.json');

let cache = null;

async function load() {
  if (!cache) {
    cache = await readJson(FILE_PATH);
    if (!cache.counters) cache.counters = {};
  }
  return cache;
}

async function save() {
  if (cache) {
    await writeJson(FILE_PATH, cache);
  }
}

async function getNextTicketNumber(guildId) {
  const data = await load();
  if (!data.counters[guildId]) {
    data.counters[guildId] = 0;
  }
  data.counters[guildId] += 1;
  await save();
  return data.counters[guildId];
}

async function getCurrentNumber(guildId) {
  const data = await load();
  return data.counters[guildId] || 0;
}

function reloadCache() {
  cache = null;
}

module.exports = { getNextTicketNumber, getCurrentNumber, reloadCache };
