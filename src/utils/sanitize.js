function sanitizeChannelName(name) {
  let sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);

  if (!sanitized) sanitized = 'ticket';
  return sanitized;
}

function sanitizeFileName(name) {
  return name
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}

function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/@everyone/g, '@\u200Beveryone')
    .replace(/@here/g, '@\u200Bhere')
    .substring(0, 4000);
}

function sanitizeEmbedText(text) {
  if (typeof text !== 'string') return '';
  return text.substring(0, 4096);
}

function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

function sanitizeId(id) {
  if (typeof id !== 'string') return null;
  if (!/^\d{17,20}$/.test(id)) return null;
  return id;
}

function sanitizeEmoji(emoji) {
  if (typeof emoji !== 'string') return '🎫';
  const customEmoji = emoji.match(/^<a?:\w+:(\d+)>$/);
  if (customEmoji) return emoji;
  if (/\p{Emoji}/u.test(emoji)) return emoji.substring(0, 20);
  return '🎫';
}

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  sanitizeChannelName,
  sanitizeFileName,
  sanitizeText,
  sanitizeEmbedText,
  sanitizeUrl,
  sanitizeId,
  sanitizeEmoji,
  escapeHtml,
};
