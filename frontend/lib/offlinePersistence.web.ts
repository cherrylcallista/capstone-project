function storageKey(accountKey: string) {
  return `capstone-offline:${accountKey}`;
}

export async function readPersistedCache(accountKey: string) {
  return localStorage.getItem(storageKey(accountKey));
}

export async function writePersistedCache(accountKey: string, serialized: string) {
  localStorage.setItem(storageKey(accountKey), serialized);
}
