import type { ScheduleBlockType, TaskType } from './types';
import {
  createClientId,
  deduplicateTasks,
  updateCache,
} from './offlineCacheCore';
export { reconcileRemoteData } from './offlineReconciliation';

export {
  getCachedCategories,
  getCachedSchedules,
  getCachedTasks,
  getPendingChanges,
  subscribeToLocalDataChanges,
} from './offlineCacheCore';
export type { PendingChanges } from './offlineCacheCore';

function formatScheduleTime(hour: number) {
  const minutes = Math.round(hour * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
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
