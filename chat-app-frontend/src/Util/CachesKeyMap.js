const groupKeyCache = new Map();

export function getCachedKey(chatId) {
  return groupKeyCache.get(chatId);
}

export function setCachedKey(chatId, key) {
  groupKeyCache.set(chatId, key);
}