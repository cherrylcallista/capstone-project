import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('capstone-offline.db').then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS account_cache (
          account_key TEXT PRIMARY KEY NOT NULL,
          cache_json TEXT NOT NULL
        );
      `);
      return database;
    });
  }
  return databasePromise;
}

export async function readPersistedCache(accountKey: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ cache_json: string }>(
    'SELECT cache_json FROM account_cache WHERE account_key = ?',
    accountKey,
  );
  return row?.cache_json ?? null;
}

export async function writePersistedCache(accountKey: string, serialized: string) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO account_cache (account_key, cache_json) VALUES (?, ?)
     ON CONFLICT(account_key) DO UPDATE SET cache_json = excluded.cache_json`,
    accountKey,
    serialized,
  );
}
