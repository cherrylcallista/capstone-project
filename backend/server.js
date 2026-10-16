const cors = require('cors');
const crypto = require('crypto');
const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const port = Number(process.env.PORT) || 3000;
const databasePath = path.join(__dirname, '..', 'database.json');
const tokenSecret = process.env.AUTH_TOKEN_SECRET || 'capstone-project-development-token-secret';

app.use(cors());
app.use(express.json());

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createToken(accountIndex) {
  const payload = Buffer.from(JSON.stringify({
    accountIndex,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readToken(token) {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expectedSignature = crypto.createHmac('sha256', tokenSecret).update(payload).digest();
  let receivedSignature;
  try {
    receivedSignature = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }

  if (receivedSignature.length !== expectedSignature.length
    || !crypto.timingSafeEqual(receivedSignature, expectedSignature)) {
    return null;
  }

  try {
    const tokenData = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isInteger(tokenData.accountIndex) || tokenData.expiresAt <= Date.now()) return null;
    return tokenData;
  } catch {
    return null;
  }
}

function publicAccount(account) {
  const { passwordHash, ...safeAccount } = account;
  return safeAccount;
}

async function readDatabase() {
  return JSON.parse(await fs.readFile(databasePath, 'utf8'));
}

async function writeDatabase(database) {
  await fs.writeFile(databasePath, `${JSON.stringify(database, null, 2)}\n`);
}

function normalizeTask(task, fallbackId) {
  return {
    id: task.id ?? fallbackId,
    detail: typeof task.detail === 'string' ? task.detail.trim() : '',
    addedTime: task.addedTime ?? new Date().toISOString(),
    dueDate: task.dueDate || null,
    markedAsFinished: Boolean(task.markedAsFinished),
    repeatTask: Boolean(task.repeatTask),
    repeatEvery: task.repeatEvery ?? null,
    category: typeof task.category === 'string' ? task.category.trim() : '',
    ...(task.matrix === undefined || task.matrix === null || task.matrix === ''
      ? {}
      : { matrix: Number(task.matrix) }),
    isTodo: task.isTodo !== false,
  };
}

function authenticate(request, response, next) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;
  const tokenData = token ? readToken(token) : null;

  if (!tokenData) {
    return response.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  request.accountIndex = tokenData.accountIndex;
  request.token = token;
  return next();
}

app.post('/api/auth/register', async (request, response) => {
  const { username, email, password } = request.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!username?.trim() || !normalizedEmail || !password) {
    return response.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (password.length < 6) {
    return response.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const database = await readDatabase();
    const accountExists = database.accounts?.some(
      (entry) => entry.account?.email?.toLowerCase() === normalizedEmail,
    );

    if (accountExists) {
      return response.status(409).json({ error: 'Email is already registered' });
    }

    const newAccount = {
      username: username.trim(),
      email: normalizedEmail,
      profilePicture: '',
      passwordHash: hashPassword(password),
      settings: {
        hideEmail: false,
        language: 'id',
        theme: 'light',
      },
    };

    database.accounts ??= [];
    database.accounts.push({
      account: newAccount,
      timer: { savedIntervals: [] },
      tasks: [],
    });
    await writeDatabase(database);

    const accountIndex = database.accounts.length - 1;
    const token = createToken(accountIndex);
    return response.status(201).json({ token, account: publicAccount(newAccount) });
  } catch (error) {
    console.error('Failed to register account:', error);
    return response.status(500).json({ error: 'Failed to register account' });
  }
});

app.post('/api/auth/login', async (request, response) => {
  const { email, password } = request.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || !password) {
    return response.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const database = await readDatabase();
    const accountIndex = database.accounts?.findIndex(
      (entry) => entry.account?.email?.toLowerCase() === normalizedEmail,
    );
    const account = accountIndex === undefined || accountIndex < 0
      ? null
      : database.accounts[accountIndex].account;

    if (!account || account.passwordHash !== hashPassword(password)) {
      return response.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken(accountIndex);
    return response.json({ token, account: publicAccount(account) });
  } catch (error) {
    console.error('Failed to login:', error);
    return response.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/profile', authenticate, async (request, response) => {
  try {
    const database = await readDatabase();
    const profile = database.accounts?.[request.accountIndex]?.account;

    if (!profile) {
      return response.status(404).json({ error: 'Profile account not found' });
    }

    return response.json(publicAccount(profile));
  } catch (error) {
    console.error('Failed to read database:', error);
    return response.status(500).json({ error: 'Failed to read database' });
  }
});

app.get('/api/tasks', authenticate, async (request, response) => {
  try {
    const database = await readDatabase();
    const accountEntry = database.accounts?.[request.accountIndex];

    if (!accountEntry) {
      return response.status(404).json({ error: 'Profile account not found' });
    }

    return response.json((accountEntry.tasks ?? []).map((task, index) => normalizeTask(task, index + 1)));
  } catch (error) {
    console.error('Failed to read tasks:', error);
    return response.status(500).json({ error: 'Failed to read tasks' });
  }
});

app.get('/api/categories', authenticate, async (request, response) => {
  try {
    const database = await readDatabase();
    const accountEntry = database.accounts?.[request.accountIndex];

    if (!accountEntry) {
      return response.status(404).json({ error: 'Profile account not found' });
    }

    const taskCategories = (accountEntry.tasks ?? []).map((task) => task.category);
    const categories = [...new Set([...(accountEntry.categories ?? []), ...taskCategories])]
      .filter((category) => typeof category === 'string' && category.trim())
      .map((category) => category.trim());
    return response.json(categories);
  } catch (error) {
    console.error('Failed to read categories:', error);
    return response.status(500).json({ error: 'Failed to read categories' });
  }
});

app.post('/api/categories', authenticate, async (request, response) => {
  const category = typeof request.body.name === 'string' ? request.body.name.trim() : '';

  if (!category) {
    return response.status(400).json({ error: 'Category name is required' });
  }
  if (category.length > 30) {
    return response.status(400).json({ error: 'Category name must be 30 characters or fewer' });
  }
  if (category.toLowerCase() === 'semua') {
    return response.status(400).json({ error: 'The category name "Semua" is reserved' });
  }

  try {
    const database = await readDatabase();
    const accountEntry = database.accounts?.[request.accountIndex];

    if (!accountEntry) {
      return response.status(404).json({ error: 'Profile account not found' });
    }

    accountEntry.categories ??= [];
    const existingCategory = accountEntry.categories.find(
      (savedCategory) => savedCategory.toLowerCase() === category.toLowerCase(),
    );
    if (existingCategory) {
      return response.json({ category: existingCategory });
    }

    accountEntry.categories.push(category);
    await writeDatabase(database);
    return response.status(201).json({ category });
  } catch (error) {
    console.error('Failed to create category:', error);
    return response.status(500).json({ error: 'Failed to create category' });
  }
});

app.post('/api/tasks', authenticate, async (request, response) => {
  const { detail, dueDate, markedAsFinished, repeatTask, repeatEvery, category, matrix, isTodo } = request.body;

  if (typeof detail !== 'string' || !detail.trim()) {
    return response.status(400).json({ error: 'Task detail is required' });
  }

  if (dueDate !== null && dueDate !== undefined && Number.isNaN(Date.parse(dueDate))) {
    return response.status(400).json({ error: 'dueDate must be a valid date' });
  }

  if (matrix !== undefined && matrix !== null && matrix !== '' && ![1, 2, 3, 4].includes(Number(matrix))) {
    return response.status(400).json({ error: 'matrix must be one of 1, 2, 3, or 4' });
  }

  try {
    const database = await readDatabase();
    const accountEntry = database.accounts?.[request.accountIndex];

    if (!accountEntry) {
      return response.status(404).json({ error: 'Profile account not found' });
    }

    accountEntry.tasks ??= [];
    const nextId = accountEntry.tasks.reduce(
      (highestId, task) => Math.max(highestId, Number(task.id) || 0),
      0,
    ) + 1;
    const task = normalizeTask({
      detail,
      dueDate: dueDate || null,
      markedAsFinished,
      repeatTask,
      repeatEvery,
      category,
      matrix,
      isTodo,
    }, nextId);

    accountEntry.tasks.push(task);
    await writeDatabase(database);
    return response.status(201).json(task);
  } catch (error) {
    console.error('Failed to create task:', error);
    return response.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:taskId', authenticate, async (request, response) => {
  try {
    const database = await readDatabase();
    const accountEntry = database.accounts?.[request.accountIndex];
    const taskIndex = accountEntry?.tasks?.findIndex(
      (task) => String(task.id) === request.params.taskId,
    );

    if (!accountEntry || taskIndex === undefined || taskIndex < 0) {
      return response.status(404).json({ error: 'Task not found' });
    }

    const currentTask = accountEntry.tasks[taskIndex];
    const updatedTask = normalizeTask({ ...currentTask, ...request.body }, currentTask.id);
    accountEntry.tasks[taskIndex] = updatedTask;
    await writeDatabase(database);
    return response.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task:', error);
    return response.status(500).json({ error: 'Failed to update task' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on port ${port}`);
});