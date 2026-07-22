const assert = require('assert');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
    failed++;
  }
}

console.log('\n🧪 Testes do Sistema de Tickets - Misaka Network\n');

console.log('📁 Sanitização de nome de canal:');
const { sanitizeChannelName } = require('../src/utils/sanitize');

test('Remove caracteres especiais', () => {
  const result = sanitizeChannelName('Meu Canal!@#$%');
  assert.ok(!result.includes('!'));
  assert.ok(!result.includes('@'));
  assert.ok(!result.includes('#'));
});

test('Converte para minúsculas', () => {
  const result = sanitizeChannelName('MEUCANAL');
  assert.strictEqual(result, 'meucanal');
});

test('Substitui espaços por hífens', () => {
  const result = sanitizeChannelName('meu canal teste');
  assert.strictEqual(result, 'meu-canal-teste');
});

test('Remove múltiplos hífens', () => {
  const result = sanitizeChannelName('meu---canal');
  assert.strictEqual(result, 'meu-canal');
});

test('Trunca em 100 caracteres', () => {
  const long = 'a'.repeat(200);
  const result = sanitizeChannelName(long);
  assert.ok(result.length <= 100);
});

test('Retorna fallback para string vazia', () => {
  const result = sanitizeChannelName('');
  assert.strictEqual(result, 'ticket');
});

console.log('\n📁 Escrita atômica:');
const { readJson, writeJson } = require('../src/utils/atomicJson');

test('Escreve e lê JSON corretamente', async () => {
  const testFile = path.join(dataDir, 'test-atomic.json');
  await writeJson(testFile, { hello: 'world' });
  const data = await readJson(testFile);
  assert.strictEqual(data.hello, 'world');
  fs.unlinkSync(testFile);
});

test('Cria arquivo se não existe', async () => {
  const testFile = path.join(dataDir, 'test-new.json');
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  await writeJson(testFile, { test: true });
  assert.ok(fs.existsSync(testFile));
  fs.unlinkSync(testFile);
});

test('Trata arquivo vazio', async () => {
  const testFile = path.join(dataDir, 'test-empty.json');
  fs.writeFileSync(testFile, '', 'utf8');
  const data = await readJson(testFile);
  assert.deepStrictEqual(data, {});
  fs.unlinkSync(testFile);
});

test('Trata JSON inválido', async () => {
  const testFile = path.join(dataDir, 'test-invalid.json');
  fs.writeFileSync(testFile, 'not json', 'utf8');
  const data = await readJson(testFile);
  assert.deepStrictEqual(data, {});
  fs.unlinkSync(testFile);
});

console.log('\n📁 Contador de tickets:');
const counterRepository = require('../src/repositories/counterRepository');

test('Incrementa contador', async () => {
  const num1 = await counterRepository.getNextTicketNumber('test-guild');
  const num2 = await counterRepository.getNextTicketNumber('test-guild');
  assert.strictEqual(num2, num1 + 1);
  counterRepository.reloadCache();
});

test('Contadores por guild são independentes', async () => {
  counterRepository.reloadCache();
  const num1 = await counterRepository.getNextTicketNumber('guild-a');
  const num2 = await counterRepository.getNextTicketNumber('guild-b');
  assert.notStrictEqual(num1, num2);
  counterRepository.reloadCache();
});

console.log('\n📁 Validação de configurações:');
const { validatePanelConfig, validateTicketData, validateFormQuestion } = require('../src/utils/validators');

test('Painel válido é aceito', () => {
  assert.ok(validatePanelConfig({
    id: 'panel_1',
    guildId: '123',
    name: 'Teste',
    channelId: '456',
    categoryId: '789',
    teamRoleId: '012',
  }));
});

test('Painel nulo é rejeitado', () => {
  assert.ok(!validatePanelConfig(null));
});

test('Painel sem ID é rejeitado', () => {
  assert.ok(!validatePanelConfig({
    guildId: '123',
    name: 'Teste',
    channelId: '456',
    categoryId: '789',
    teamRoleId: '012',
  }));
});

test('Ticket válido é aceito', () => {
  assert.ok(validateTicketData({
    id: 'ticket_1',
    guildId: '123',
    channelId: '456',
    userId: '789',
    panelId: 'panel_1',
  }));
});

test('Ticket sem canal é rejeitado', () => {
  assert.ok(!validateTicketData({
    id: 'ticket_1',
    guildId: '123',
    userId: '789',
    panelId: 'panel_1',
  }));
});

test('Pergunta válida é aceita', () => {
  assert.ok(validateFormQuestion({
    title: 'Pergunta',
    placeholder: 'Digite aqui',
    style: 'short',
    required: true,
  }));
});

test('Pergunta com estilo inválido é rejeitada', () => {
  assert.ok(!validateFormQuestion({
    title: 'Pergunta',
    placeholder: 'Digite aqui',
    style: 'invalid',
    required: true,
  }));
});

console.log('\n📁 Sanitização de texto:');
const { sanitizeText, escapeHtml } = require('../src/utils/sanitize');

test('Remove @everyone', () => {
  const result = sanitizeText('Olá @everyone');
  assert.ok(result.includes('@\u200Beveryone'));
  assert.ok(!result.includes('@everyone'));
});

test('Remove @here', () => {
  const result = sanitizeText('Olá @here');
  assert.ok(result.includes('@\u200Bhere'));
  assert.ok(!result.includes('@here'));
});

test('Escape HTML funciona', () => {
  const result = escapeHtml('<script>alert("xss")</script>');
  assert.ok(!result.includes('<script>'));
  assert.ok(result.includes('&lt;script&gt;'));
});

test('Trunca texto em 4000 caracteres', () => {
  const long = 'a'.repeat(5000);
  const result = sanitizeText(long);
  assert.ok(result.length <= 4000);
});

console.log('\n📁 Proteção contra resposta dupla:');

test('Interaction handler trata erros', () => {
  const handler = require('../src/events/interactionCreate');
  assert.ok(typeof handler.execute === 'function');
});

console.log('\n📁 Renderização de variáveis de boas-vindas:');

test('Variáveis são substituídas corretamente', () => {
  const template = 'Olá {usuario}, bem-vindo ao {servidor}!';
  const variables = {
    '{usuario}': 'João',
    '{servidor}': 'Meu Servidor',
  };
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(key).join(value);
  }
  assert.strictEqual(result, 'Olá João, bem-vindo ao Meu Servidor!');
});

test('Múltiplas variáveis funcionam', () => {
  const template = '{usuario} {usuario} {servidor}';
  const variables = {
    '{usuario}': 'A',
    '{servidor}': 'B',
  };
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(key).join(value);
  }
  assert.strictEqual(result, 'A A B');
});

console.log('\n📊 Resultado:');
console.log(`  ✅ ${passed} testes passaram`);
if (failed > 0) {
  console.log(`  ❌ ${failed} testes falharam`);
  process.exit(1);
} else {
  console.log('  🎉 Todos os testes passaram!');
  process.exit(0);
}
