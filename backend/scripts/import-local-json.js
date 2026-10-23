const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Account = require('../models/Account');

async function importLocalData() {
  const connectionString = process.env.MONGODB_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Set MONGODB_CONNECTION_STRING in backend/.env before importing.');
  }

  const databaseName = process.env.MONGODB_DATABASE_NAME || 'CapstoneProject';
  const sourcePath = path.join(__dirname, '..', '..', 'database.json');
  const source = require(sourcePath);
  if (!Array.isArray(source.accounts)) {
    throw new Error('database.json must contain an accounts array.');
  }

  await mongoose.connect(connectionString, { dbName: databaseName });
  let imported = 0;
  let skipped = 0;

  for (const entry of source.accounts) {
    const email = entry.account?.email?.trim().toLowerCase();
    if (!email || !entry.account?.passwordHash) {
      skipped += 1;
      console.warn('Skipped an account without email or password hash.');
      continue;
    }

    const accountRecord = {
      ...entry,
      account: { ...entry.account, email },
      timer: entry.timer ?? { savedIntervals: [] },
      tasks: entry.tasks ?? [],
      categories: entry.categories ?? [],
    };
    const result = await Account.updateOne(
      { 'account.email': email },
      { $setOnInsert: accountRecord },
      { upsert: true, runValidators: true },
    );

    if (result.upsertedCount > 0) imported += 1;
    else skipped += 1;
  }

  console.log(`Import complete: ${imported} account(s) added, ${skipped} skipped.`);
  await mongoose.disconnect();
}

importLocalData().catch(async (error) => {
  console.error('Local JSON import failed:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
