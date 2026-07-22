const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Sistema de tickets para vendas')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('configurar')
      .setDescription('Abrir menu de configuração do sistema')
  )
  .addSubcommand(sub =>
    sub.setName('painel-criar')
      .setDescription('Criar um novo painel de tickets')
  )
  .addSubcommand(sub =>
    sub.setName('painel-editar')
      .setDescription('Editar um painel existente')
  )
  .addSubcommand(sub =>
    sub.setName('painel-publicar')
      .setDescription('Publicar ou atualizar um painel em um canal')
  )
  .addSubcommand(sub =>
    sub.setName('painel-listar')
      .setDescription('Listar os painéis existentes')
  )
  .addSubcommand(sub =>
    sub.setName('painel-excluir')
      .setDescription('Excluir uma configuração de painel')
  )
  .addSubcommand(sub =>
    sub.setName('formulario')
      .setDescription('Configurar as perguntas do formulário')
  )
  .addSubcommand(sub =>
    sub.setName('mensagem')
      .setDescription('Configurar a mensagem automática do ticket')
  )
  .addSubcommand(sub =>
    sub.setName('adicionar')
      .setDescription('Adicionar uma pessoa ao ticket atual')
      .addUserOption(opt =>
        opt.setName('usuario')
          .setDescription('Usuário para adicionar')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('remover')
      .setDescription('Remover uma pessoa do ticket atual')
      .addUserOption(opt =>
        opt.setName('usuario')
          .setDescription('Usuário para remover')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('renomear')
      .setDescription('Renomear o ticket atual')
      .addStringOption(opt =>
        opt.setName('nome')
          .setDescription('Novo nome do ticket')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('fechar')
      .setDescription('Fechar o ticket atual')
      .addStringOption(opt =>
        opt.setName('motivo')
          .setDescription('Motivo do fechamento')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub.setName('status')
      .setDescription('Mostrar configuração atual e diagnosticar permissões')
  )
  .addSubcommand(sub =>
    sub.setName('testar')
      .setDescription('Criar uma prévia do painel e da mensagem automática')
  );

module.exports = { data };
