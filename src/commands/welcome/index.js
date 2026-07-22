const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('boas-vindas')
  .setDescription('Sistema de mensagens de boas-vindas')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('configurar')
      .setDescription('Configurar a mensagem de boas-vindas')
  )
  .addSubcommand(sub =>
    sub.setName('testar')
      .setDescription('Testar a mensagem de boas-vindas')
  )
  .addSubcommand(sub =>
    sub.setName('desativar')
      .setDescription('Desativar o sistema de boas-vindas')
  )
  .addSubcommand(sub =>
    sub.setName('status')
      .setDescription('Ver status do sistema de boas-vindas')
  );

module.exports = { data };
