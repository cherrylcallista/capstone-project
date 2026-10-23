const cors = require('cors');
const crypto = require('crypto');
const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();
const Account = require('./models/Account');

const app = express();
const port = Number(process.env.PORT) || 3000;
const mongoConnectionString = process.env.MONGODB_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGODB_DATABASE_NAME || 'Capstine';
const tokenSecret = process.env.AUTH_TOKEN_SECRET || 'capstone-project-development-token-secret';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createToken(accountId) {
  const payload = Buffer.from(JSON.stringify({
    accountId: String(accountId),
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
    if (typeof tokenData.accountId !== 'string' || tokenData.expiresAt <= Date.now()) return null;
    return tokenData;
  } catch {
    return null;
  }
}

function publicAccount(account) {
  const profile = typeof account?.toObject === 'function' ? account.toObject() : account;
  const { passwordHash, ...safeAccount } = profile;
  return safeAccount;
}

function normalizeTask(task, fallbackId) {
  return {
    id: task.id ?? fallbackId,
    ...(typeof task.clientId === 'string' ? { clientId: task.clientId } : {}),
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

function isValidDateKey(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }
  const parsedDate = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date;
}

function formatScheduleTime(hour) {
  const minutes = Math.round(hour * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
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
  if (!mongoose.isValidObjectId(tokenData.accountId)) {
    return response.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  request.accountId = tokenData.accountId;
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

    const accountRecord = await Account.create({
      account: newAccount,
      timer: { savedIntervals: [] },
      tasks: [],
      categories: [],
    });
    const token = createToken(accountRecord._id);
    return response.status(201).json({ token, account: publicAccount(accountRecord.account) });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ error: 'Email is already registered' });
    }
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
    const accountRecord = await Account.findOne({ 'account.email': normalizedEmail });
    const account = accountRecord?.account;

    if (!account || account.passwordHash !== hashPassword(password)) {
      return response.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken(accountRecord._id);
    return response.json({ token, account: publicAccount(account) });
  } catch (error) {
    console.error('Failed to login:', error);
    return response.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/profile', authenticate, async (request, response) => {
  try {
    const accountRecord = await Account.findById(request.accountId).select('account');
    const profile = accountRecord?.account;

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
    const accountRecord = await Account.findById(request.accountId).select('tasks');

    if (!accountRecord) {
      return response.status(404).json({ error: 'Profile account not found' });
    }

    return response.json(accountRecord.tasks.map((task, index) => normalizeTask(task.toObject(), index + 1)));
  } catch (error) {
    console.error('Failed to read tasks:', error);
    return response.status(500).json({ error: 'Failed to read tasks' });
  }
});

app.get('/api/categories', authenticate, async (request, response) => {
  try {
    const accountRecord = await Account.findById(request.accountId).select('categories tasks');

    if (!accountRecord) {
      return response.status(404).json({ error: 'Profile account not found' });
    }

    const taskCategories = accountRecord.tasks.map((task) => task.category);
    const categories = [...new Set([...accountRecord.categories, ...taskCategories])]
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
    const accountRecord = await Account.findById(request.accountId).select('categories');

    if (!accountRecord) {
      return response.status(404).json({ error: 'Profile account not found' });
    }

    const existingCategory = accountRecord.categories.find(
      (savedCategory) => savedCategory.toLowerCase() === category.toLowerCase(),
    );
    if (existingCategory) {
      return response.json({ category: existingCategory });
    }

    accountRecord.categories.push(category);
    await accountRecord.save();
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
    const accountRecord = await Account.findById(request.accountId);

    if (!accountRecord) {
      return response.status(404).json({ error: 'Profile account not found' });
    }

    const nextId = accountRecord.tasks.reduce(
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

    accountRecord.tasks.push(task);
    await accountRecord.save();
    return response.status(201).json(task);
  } catch (error) {
    console.error('Failed to create task:', error);
    return response.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:taskId', authenticate, async (request, response) => {
  const { dueDate, matrix, detail, category } = request.body;
  if (dueDate !== undefined && dueDate !== null && Number.isNaN(Date.parse(dueDate))) {
    return response.status(400).json({ error: 'dueDate must be a valid date' });
  }
  if (matrix !== undefined && matrix !== null && matrix !== '' && ![1, 2, 3, 4].includes(Number(matrix))) {
    return response.status(400).json({ error: 'matrix must be one of 1, 2, 3, or 4' });
  }
  if (detail !== undefined && (typeof detail !== 'string' || !detail.trim())) {
    return response.status(400).json({ error: 'Task detail is required' });
  }
  if (category !== undefined && (typeof category !== 'string' || category.trim().length > 30)) {
    return response.status(400).json({ error: 'Category must be 30 characters or fewer' });
  }

  try {
    const accountRecord = await Account.findById(request.accountId);
    const taskIndex = accountRecord?.tasks?.findIndex(
      (task) => String(task.id) === request.params.taskId,
    );

    if (!accountRecord || taskIndex === undefined || taskIndex < 0) {
      return response.status(404).json({ error: 'Task not found' });
    }

    const currentTask = accountRecord.tasks[taskIndex].toObject();
    const updatedTask = normalizeTask({ ...currentTask, ...request.body }, currentTask.id);
    accountRecord.tasks[taskIndex] = updatedTask;
    await accountRecord.save();
    return response.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task:', error);
    return response.status(500).json({ error: 'Failed to update task' });
  }
});

app.post('/api/sync', authenticate, async (request, response) => {
  const { taskUpserts = [], categoryUpserts = [] } = request.body ?? {};
  const scheduleUpserts = Array.isArray(request.body?.scheduleUpserts)
    ? request.body.scheduleUpserts.map((block) => (
      block && typeof block === 'object'
        ? { ...block, durationHours: block.durationHours ?? 1 }
        : block
    ))
    : request.body?.scheduleUpserts ?? [];
  if (!Array.isArray(taskUpserts) || taskUpserts.length > 500) {
    return response.status(400).json({ error: 'taskUpserts must be an array of at most 500 tasks' });
  }
  if (!Array.isArray(categoryUpserts) || categoryUpserts.length > 500) {
    return response.status(400).json({ error: 'categoryUpserts must be an array of at most 500 categories' });
  }
  if (!Array.isArray(scheduleUpserts) || scheduleUpserts.length > 500) {
    return response.status(400).json({ error: 'scheduleUpserts must be an array of at most 500 schedule blocks' });
  }

  for (const task of taskUpserts) {
    if (!task || typeof task.clientId !== 'string' || !task.clientId.trim()
      || typeof task.detail !== 'string' || !task.detail.trim()) {
      return response.status(400).json({ error: 'Each task must include a clientId and detail' });
    }
    if (task.dueDate !== null && task.dueDate !== undefined && Number.isNaN(Date.parse(task.dueDate))) {
      return response.status(400).json({ error: 'dueDate must be a valid date' });
    }
    if (task.matrix !== undefined && task.matrix !== null && task.matrix !== ''
      && ![1, 2, 3, 4].includes(Number(task.matrix))) {
      return response.status(400).json({ error: 'matrix must be one of 1, 2, 3, or 4' });
    }
  }
  if (categoryUpserts.some((category) => typeof category !== 'string'
    || !category.trim() || category.trim().length > 30 || category.trim().toLowerCase() === 'semua')) {
    return response.status(400).json({ error: 'Each category must be valid and 30 characters or fewer' });
  }
  if (scheduleUpserts.some((block) => (
    !block
    || typeof block.clientId !== 'string'
    || !block.clientId.trim()
    || !isValidDateKey(block.date)
    || !Number.isFinite(block.hour)
    || !Number.isInteger(block.hour * 2)
    || block.hour < 0
    || block.hour > 23.5
    || !Number.isFinite(block.durationHours)
    || !Number.isInteger(block.durationHours * 2)
    || block.durationHours < 0.5
    || block.hour + block.durationHours > 24
    || typeof block.label !== 'string'
    || !block.label.trim()
    || block.label.trim().length > 60
    || typeof block.color !== 'string'
    || !/^#[0-9A-Fa-f]{6}$/.test(block.color)
    || (block.deleted !== undefined && typeof block.deleted !== 'boolean')
  ))) {
    return response.status(400).json({ error: 'Each schedule block must include a valid date, hour, label, and color' });
  }

  try {
    const accountRecord = await Account.findById(request.accountId);
    if (!accountRecord) {
      return response.status(404).json({ error: 'Profile account not found' });
    }

    const prospectiveSchedules = accountRecord.schedules
      .filter((block) => !block.deleted)
      .map((block) => block.toObject());
    for (const incomingBlock of scheduleUpserts) {
      const existingIndex = prospectiveSchedules.findIndex((block) => (
        block.clientId === incomingBlock.clientId
        || (Number(incomingBlock.id) > 0 && Number(block.id) === Number(incomingBlock.id))
        || (block.date === incomingBlock.date && block.hour === incomingBlock.hour)
      ));
      if (existingIndex >= 0) {
        prospectiveSchedules.splice(existingIndex, 1);
      }
      if (!incomingBlock.deleted) {
        const conflict = prospectiveSchedules.find((block) => (
          block.date === incomingBlock.date
          && incomingBlock.hour < block.hour + (block.durationHours ?? 1)
          && block.hour < incomingBlock.hour + incomingBlock.durationHours
        ));
        if (conflict) {
          return response.status(409).json({
            error: `Schedule conflicts with "${conflict.label}" at ${formatScheduleTime(conflict.hour)}`,
          });
        }
        prospectiveSchedules.push(incomingBlock);
      }
    }

    for (const incomingTask of taskUpserts) {
      const taskIndex = accountRecord.tasks.findIndex((task) => (
        task.clientId === incomingTask.clientId
        || (Number(incomingTask.id) > 0 && Number(task.id) === Number(incomingTask.id))
      ));
      const previousTask = taskIndex >= 0 ? accountRecord.tasks[taskIndex].toObject() : null;
      const nextId = previousTask?.id ?? accountRecord.tasks.reduce(
        (highestId, task) => Math.max(highestId, Number(task.id) || 0),
        0,
      ) + 1;
      const task = normalizeTask({ ...previousTask, ...incomingTask, id: nextId }, nextId);

      if (taskIndex >= 0) {
        accountRecord.tasks[taskIndex] = task;
      } else {
        accountRecord.tasks.push(task);
      }
    }

    for (const incomingCategory of categoryUpserts) {
      const category = incomingCategory.trim();
      if (!accountRecord.categories.some((saved) => saved.toLowerCase() === category.toLowerCase())) {
        accountRecord.categories.push(category);
      }
    }

    for (const incomingBlock of scheduleUpserts) {
      const blockIndex = accountRecord.schedules.findIndex((block) => (
        block.clientId === incomingBlock.clientId
        || (Number(incomingBlock.id) > 0 && Number(block.id) === Number(incomingBlock.id))
        || (block.date === incomingBlock.date && block.hour === incomingBlock.hour)
      ));
      const previousBlock = blockIndex >= 0 ? accountRecord.schedules[blockIndex].toObject() : null;
      const nextId = previousBlock?.id ?? accountRecord.schedules.reduce(
        (highestId, block) => Math.max(highestId, Number(block.id) || 0),
        0,
      ) + 1;
      const scheduleBlock = {
        ...previousBlock,
        ...incomingBlock,
        id: nextId,
        durationHours: incomingBlock.durationHours ?? previousBlock?.durationHours ?? 1,
        deleted: Boolean(incomingBlock.deleted),
      };

      if (blockIndex >= 0) {
        accountRecord.schedules[blockIndex] = scheduleBlock;
      } else {
        accountRecord.schedules.push(scheduleBlock);
      }
    }

    await accountRecord.save();
    const taskCategories = accountRecord.tasks.map((task) => task.category);
    const categories = [...new Set([...accountRecord.categories, ...taskCategories])]
      .filter((category) => typeof category === 'string' && category.trim())
      .map((category) => category.trim());

    return response.json({
      tasks: accountRecord.tasks.map((task) => normalizeTask(task.toObject(), task.id)),
      categories,
      schedules: accountRecord.schedules.map((block) => block.toObject()),
    });
  } catch (error) {
    console.error('Failed to synchronize account data:', error);
    return response.status(500).json({ error: 'Failed to synchronize account data' });
  }
});

async function startServer() {
  if (!mongoConnectionString) {
    throw new Error('MONGODB_CONNECTION_STRING is required. Create backend/.env from .env.example.');
  }

  await mongoose.connect(mongoConnectionString, { dbName: mongoDatabaseName });
  await Account.init();
  console.log(`MongoDB connected to ${mongoDatabaseName}`);

  app.listen(port, '0.0.0.0', () => {
    console.log(`Backend listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend:', error.message);
  process.exit(1);
});