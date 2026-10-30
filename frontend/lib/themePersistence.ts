import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('capstone-offline.db').then(async (database) => {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS app_preferences (
          preference_key TEXT PRIMARY KEY NOT NULL,
          preference_value TEXT NOT NULL
        );
      `);
      return database;
    });
  }
  return databasePromise;
}

export async function readThemePreference() {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ preference_value: string }>(
    'SELECT preference_value FROM app_preferences WHERE preference_key = ?',
    'color-scheme',
  );
  return row?.preference_value ?? null;
}

export async function writeThemePreference(theme: 'light' | 'dark') {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO app_preferences (preference_key, preference_value) VALUES (?, ?)
     ON CONFLICT(preference_key) DO UPDATE SET preference_value = excluded.preference_value`,
    'color-scheme',
    theme,
  );
}
