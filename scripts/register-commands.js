const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const devGuildId = process.env.DEV_GUILD_ID;

if (!token) {
  console.error('DISCORD_TOKEN não configurado.');
  process.exit(1);
}
if (!clientId) {
  console.error('CLIENT_ID não configurado.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, '..', 'src', 'commands');
const commandDirs = fs.readdirSync(commandsPath);

for (const dir of commandDirs) {
  const dirPath = path.join(commandsPath, dir);
  if (!fs.statSync(dirPath).isDirectory()) continue;

  const commandFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(dirPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST({ version: '10' }).setToken(token);

async function deploy(isGlobal) {
  try {
    console.log(`Registrando ${commands.length} comandos...`);

    if (isGlobal) {
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );
      console.log(`${data.length} comandos registrados globalmente.`);
    } else {
      if (!devGuildId) {
        console.error('DEV_GUILD_ID não configurado para registro em guild.');
        process.exit(1);
      }
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, devGuildId),
        { body: commands },
      );
      console.log(`${data.length} comandos registrados no servidor de desenvolvimento.`);
    }
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
    process.exit(1);
  }
}

const type = process.argv[2];
if (type === 'global') {
  deploy(true);
} else {
  deploy(false);
}
