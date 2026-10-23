import type { ScheduleBlockType, TaskType } from './types';
import { readPersistedCache, writePersistedCache } from './offlinePersistence';

export type PendingChanges = {
  taskUpserts: TaskType[];
  categoryUpserts: string[];
  scheduleUpserts: ScheduleBlockType[];
};

type AccountCache = {
  tasks: TaskType[];
  categories: string[];
  pendingTasks: TaskType[];
  pendingCategories: string[];
  schedules: ScheduleBlockType[];
  pendingSchedules: ScheduleBlockType[];
};

type CacheListener = (accountKey: string) => void;

const listeners = new Set<CacheListener>();
const accountLocks = new Map<string, Promise<void>>();

function emptyCache(): AccountCache {
  return {
    tasks: [],
    categories: [],
    pendingTasks: [],
    pendingCategories: [],
    schedules: [],
    pendingSchedules: [],
  };
}

function normalizeAccountKey(accountKey: string) {
  return accountKey.trim().toLowerCase();
}

function createClientId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function formatScheduleTime(hour: number) {
  const minutes = Math.round(hour * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function taskIdentity(task: TaskType) {
  return task.clientId ? `client:${task.clientId}` : `id:${task.id}`;
}

function deduplicateTasks(tasks: TaskType[]) {
  const tasksByIdentity = new Map<string, TaskType>();
  tasks.forEach((task) => tasksByIdentity.set(taskIdentity(task), task));
  return [...tasksByIdentity.values()];
}

function notify(accountKey: string) {
  const normalizedKey = normalizeAccountKey(accountKey);
  listeners.forEach((listener) => listener(normalizedKey));
}

export function subscribeToLocalDataChanges(listener: CacheListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function readCache(accountKey: string): Promise<AccountCache> {
  const normalizedKey = normalizeAccountKey(accountKey);
  const stored = await readPersistedCache(normalizedKey);
  if (!stored) return emptyCache();

  const cache = JSON.parse(stored) as Partial<AccountCache>;
  return {
    ...emptyCache(),
    ...cache,
    tasks: deduplicateTasks(cache.tasks ?? []),
    pendingTasks: deduplicateTasks(cache.pendingTasks ?? []),
    schedules: cache.schedules ?? [],
    pendingSchedules: cache.pendingSchedules ?? [],
  };
}

async function writeCache(accountKey: string, cache: AccountCache) {
  const normalizedKey = normalizeAccountKey(accountKey);
  await writePersistedCache(normalizedKey, JSON.stringify(cache));
}

async function updateCache<T>(
  accountKey: string,
  update: (cache: AccountCache) => { cache: AccountCache; result: T },
): Promise<T> {
  const normalizedKey = normalizeAccountKey(accountKey);
  const previous = accountLocks.get(normalizedKey) ?? Promise.resolve();
  const operation = previous.then(async () => {
    const current = await readCache(normalizedKey);
    const { cache, result } = update(current);
    await writeCache(normalizedKey, cache);
    notify(normalizedKey);
    return result;
  });
  accountLocks.set(normalizedKey, operation.then(() => undefined, () => undefined));
  return operation;
}

export async function getCachedTasks(accountKey: string) {
  return deduplicateTasks((await readCache(accountKey)).tasks);
}

export async function getCachedCategories(accountKey: string) {
  return (await readCache(accountKey)).categories;
}

export async function getPendingChanges(accountKey: string): Promise<PendingChanges> {
  const cache = await readCache(accountKey);
  return {
    taskUpserts: cache.pendingTasks,
    categoryUpserts: cache.pendingCategories,
    scheduleUpserts: cache.pendingSchedules,
  };
}

export async function getCachedSchedules(accountKey: string) {
  return (await readCache(accountKey)).schedules.filter((block) => !block.deleted);
}

export async function saveLocalSchedule(
  accountKey: string,
  input: Omit<ScheduleBlockType, 'id' | 'clientId' | 'deleted'>,
) {
  if (!Number.isFinite(input.hour)
    || !Number.isInteger(input.hour * 2)
    || input.hour < 0
    || input.hour > 23.5
    || !Number.isFinite(input.durationHours)
    || !Number.isInteger(input.durationHours * 2)
    || input.durationHours < 0.5
    || input.hour + input.durationHours > 24) {
    throw new Error('Jadwal harus menggunakan kelipatan 30 menit dan berada dalam satu hari.');
  }

  return updateCache(accountKey, (cache) => {
    const existing = cache.schedules.find(
      (block) => block.date === input.date && block.hour === input.hour,
    );
    const schedule: ScheduleBlockType = {
      ...input,
      id: existing?.id ?? (cache.schedules.reduce((lowest, block) => Math.min(lowest, block.id), 0) - 1),
      clientId: existing?.clientId ?? createClientId(),
    };
    const conflictingBlock = cache.schedules.find((block) => (
      !block.deleted
      && block.date === schedule.date
      && block.clientId !== schedule.clientId
      && schedule.hour < block.hour + (block.durationHours ?? 1)
      && block.hour < schedule.hour + schedule.durationHours
    ));
    if (conflictingBlock) {
      throw new Error(`Jadwal bentrok dengan "${conflictingBlock.label}" pada pukul ${formatScheduleTime(conflictingBlock.hour)}.`);
    }

    const schedules = existing
      ? cache.schedules.map((block) => block.clientId === existing.clientId ? schedule : block)
      : [...cache.schedules, schedule];
    const pendingSchedules = cache.pendingSchedules.some((block) => block.clientId === schedule.clientId)
      ? cache.pendingSchedules.map((block) => block.clientId === schedule.clientId ? schedule : block)
      : [...cache.pendingSchedules, schedule];

    return { cache: { ...cache, schedules, pendingSchedules }, result: schedule };
  });
}

export async function deleteLocalSchedule(accountKey: string, clientId: string) {
  return updateCache(accountKey, (cache) => {
    const existing = cache.schedules.find((block) => block.clientId === clientId);
    if (!existing) return { cache, result: undefined };
    const deleted = { ...existing, deleted: true };
    const schedules = cache.schedules.map((block) => block.clientId === clientId ? deleted : block);
    const pendingSchedules = cache.pendingSchedules.some((block) => block.clientId === clientId)
      ? cache.pendingSchedules.map((block) => block.clientId === clientId ? deleted : block)
      : [...cache.pendingSchedules, deleted];
    return { cache: { ...cache, schedules, pendingSchedules }, result: undefined };
  });
}

function equalSchedule(left: ScheduleBlockType, right: ScheduleBlockType) {
  return left.clientId === right.clientId
    && left.date === right.date
    && left.hour === right.hour
    && left.durationHours === right.durationHours
    && left.label === right.label
    && left.color === right.color
    && Boolean(left.deleted) === Boolean(right.deleted);
}

export async function createLocalTask(
  accountKey: string,
  input: Omit<TaskType, 'id' | 'addedTime' | 'clientId'>,
) {
  return updateCache(accountKey, (cache) => {
    const lowestId = cache.tasks.reduce((lowest, task) => Math.min(lowest, task.id), 0);
    const task: TaskType = {
      ...input,
      id: lowestId < 0 ? lowestId - 1 : -1,
      clientId: createClientId(),
      addedTime: new Date().toISOString(),
    };
    return {
      cache: {
        ...cache,
        tasks: deduplicateTasks([...cache.tasks, task]),
        pendingTasks: deduplicateTasks([...cache.pendingTasks, task]),
      },
      result: task,
    };
  });
}

export async function updateLocalTask(
  accountKey: string,
  id: number,
  changes: Partial<TaskType>,
) {
  return updateCache(accountKey, (cache) => {
    const currentTask = cache.tasks.find((task) => task.id === id);
    if (!currentTask) {
      throw new Error('Task is not available in the local cache.');
    }

    const task: TaskType = {
      ...currentTask,
      ...changes,
      id: currentTask.id,
      clientId: currentTask.clientId ?? createClientId(),
      addedTime: currentTask.addedTime,
    };
    const tasks = cache.tasks.map((item) => item.id === id ? task : item);
    const pendingIndex = cache.pendingTasks.findIndex((item) => item.clientId === task.clientId);
    const pendingTasks = pendingIndex < 0
      ? [...cache.pendingTasks, task]
      : cache.pendingTasks.map((item, index) => index === pendingIndex ? task : item);

    return { cache: { ...cache, tasks, pendingTasks }, result: task };
  });
}

export async function createLocalCategory(accountKey: string, name: string) {
  return updateCache(accountKey, (cache) => {
    const category = name.trim();
    const existing = cache.categories.find((item) => item.toLowerCase() === category.toLowerCase());
    if (existing) {
      return { cache, result: existing };
    }

    return {
      cache: {
        ...cache,
        categories: [...cache.categories, category],
        pendingCategories: [...cache.pendingCategories, category],
      },
      result: category,
    };
  });
}

function equalExceptServerId(left: TaskType, right: TaskType) {
  const canonicalize = (task: TaskType) => ({
    clientId: task.clientId,
    detail: task.detail,
    addedTime: task.addedTime,
    dueDate: task.dueDate,
    markedAsFinished: task.markedAsFinished,
    repeatTask: task.repeatTask,
    repeatEvery: task.repeatEvery,
    category: task.category,
    matrix: task.matrix ?? null,
    isTodo: task.isTodo,
  });
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

export async function reconcileRemoteData(
  accountKey: string,
  remoteTasks: TaskType[],
  remoteCategories: string[],
  sentChanges: PendingChanges,
  remoteSchedules: ScheduleBlockType[] = [],
) {
  return updateCache(accountKey, (cache) => {
    const localById = new Map(cache.tasks.map((task) => [task.id, task]));
    const tasksFromServer = remoteTasks.map((task) => ({
      ...task,
      clientId: task.clientId ?? localById.get(task.id)?.clientId ?? createClientId(),
    }));
    const remoteByClientId = new Map(
      tasksFromServer.filter((task) => task.clientId).map((task) => [task.clientId as string, task]),
    );
    const sentByClientId = new Map(
      sentChanges.taskUpserts.map((task) => [task.clientId, task]),
    );

    const pendingTasks = cache.pendingTasks.flatMap((task) => {
      const remoteTask = task.clientId ? remoteByClientId.get(task.clientId) : undefined;
      const reconciledTask = remoteTask ? { ...task, id: remoteTask.id } : task;
      const sentTask = task.clientId ? sentByClientId.get(task.clientId) : undefined;
      return sentTask && equalExceptServerId(reconciledTask, sentTask) ? [] : [reconciledTask];
    });

    const tasksById = new Map<number, TaskType>(tasksFromServer.map((task) => [task.id, task]));
    for (const task of pendingTasks) {
      const matchingRemoteTask = task.clientId ? remoteByClientId.get(task.clientId) : undefined;
      tasksById.set(matchingRemoteTask?.id ?? task.id, task);
    }
    const tasks = deduplicateTasks([...tasksById.values()]);

    const sentCategories = new Set(sentChanges.categoryUpserts.map((item) => item.toLowerCase()));
    const pendingCategories = cache.pendingCategories.filter(
      (item) => !sentCategories.has(item.toLowerCase()),
    );
    const categories = [...new Set(
      [...remoteCategories, ...cache.categories, ...pendingCategories]
        .map((item) => item.trim())
        .filter(Boolean),
    )].filter((item, index, items) => (
      items.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index
    ));

    const localSchedulesById = new Map(cache.schedules.map((block) => [block.id, block]));
    const schedulesFromServer = remoteSchedules.map((block) => ({
      ...block,
      clientId: block.clientId ?? localSchedulesById.get(block.id)?.clientId ?? createClientId(),
    }));
    const remoteSchedulesByClientId = new Map(
      schedulesFromServer.map((block) => [block.clientId, block]),
    );
    const sentSchedulesByClientId = new Map(
      sentChanges.scheduleUpserts.map((block) => [block.clientId, block]),
    );
    const pendingSchedules = cache.pendingSchedules.flatMap((block) => {
      const remoteBlock = remoteSchedulesByClientId.get(block.clientId);
      const reconciledBlock = remoteBlock ? { ...block, id: remoteBlock.id } : block;
      const sentBlock = sentSchedulesByClientId.get(block.clientId);
      return sentBlock && equalSchedule(reconciledBlock, sentBlock)
        ? []
        : [reconciledBlock];
    });
    const schedulesById = new Map(schedulesFromServer.map((block) => [block.id, block]));
    for (const block of pendingSchedules) {
      const remoteBlock = remoteSchedulesByClientId.get(block.clientId);
      schedulesById.set(remoteBlock?.id ?? block.id, block);
    }

    return {
      cache: {
        tasks,
        categories,
        pendingTasks,
        pendingCategories,
        schedules: [...schedulesById.values()],
        pendingSchedules,
      },
      result: undefined,
    };
  });
}
