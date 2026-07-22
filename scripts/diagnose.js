const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { config } = require('../src/config');

console.log('🔍 Diagnóstico do Sistema de Tickets - Misaka Network\n');

let issues = 0;

function check(label, ok, detail) {
  if (ok) {
    console.log(`✅ ${label}`);
  } else {
    console.log(`❌ ${label}${detail ? ': ' + detail : ''}`);
    issues++;
  }
}

check('DISCORD_TOKEN configurado', !!config.token);
check('CLIENT_ID configurado', !!config.clientId);

const dataDir = path.join(__dirname, '..', 'data');
check('Diretório data existe', fs.existsSync(dataDir));
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const requiredFiles = ['guilds.json', 'panels.json', 'tickets.json', 'counters.json'];
for (const file of requiredFiles) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}', 'utf8');
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    check(`Arquivo ${file} válido`, true);
  } catch {
    check(`Arquivo ${file} válido`, false, 'JSON inválido');
  }
}

const srcPath = path.join(__dirname, '..', 'src');
const requiredDirs = ['commands', 'events', 'services', 'repositories', 'utils'];
for (const dir of requiredDirs) {
  check(`Diretório src/${dir} existe`, fs.existsSync(path.join(srcPath, dir)));
}

console.log(`\n📊 Resultado: ${issues === 0 ? 'Tudo OK!' : `${issues} problema(s) encontrado(s)`}`);
process.exit(issues === 0 ? 0 : 1);
