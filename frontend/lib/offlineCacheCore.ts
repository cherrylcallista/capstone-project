import type { ScheduleBlockType, TaskType } from './types';
import { readPersistedCache, writePersistedCache } from './offlinePersistence';

export type PendingChanges = {
  taskUpserts: TaskType[];
  categoryUpserts: string[];
  scheduleUpserts: ScheduleBlockType[];
};

export type AccountCache = {
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

export function createClientId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function taskIdentity(task: TaskType) {
  return task.clientId ? `client:${task.clientId}` : `id:${task.id}`;
}

export function deduplicateTasks(tasks: TaskType[]) {
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
  await writePersistedCache(normalizeAccountKey(accountKey), JSON.stringify(cache));
}

export async function updateCache<T>(
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
