const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const locks = new Map();

async function acquireLock(key) {
  while (locks.get(key)) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  locks.set(key, true);
}

function releaseLock(key) {
  locks.delete(key);
}

async function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.trim()) {
      return {};
    }
    return JSON.parse(content);
  } catch (err) {
    logger.error(`Erro ao ler JSON ${filePath}:`, err.message);
    return {};
  }
}

async function writeJson(filePath, data) {
  const lockKey = filePath;
  await acquireLock(lockKey);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tmpPath = filePath + '.tmp';
    const content = JSON.stringify(data, null, 2);

    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);

    logger.debug(`JSON salvo: ${filePath}`);
  } catch (err) {
    logger.error(`Erro ao escrever JSON ${filePath}:`, err.message);
    throw err;
  } finally {
    releaseLock(lockKey);
  }
}

module.exports = { readJson, writeJson };
