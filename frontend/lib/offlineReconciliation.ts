import type { ScheduleBlockType, TaskType } from './types';
import {
  createClientId,
  deduplicateTasks,
  updateCache,
  type PendingChanges,
} from './offlineCacheCore';

function equalSchedule(left: ScheduleBlockType, right: ScheduleBlockType) {
  return left.clientId === right.clientId
    && left.date === right.date
    && left.hour === right.hour
    && left.durationHours === right.durationHours
    && left.label === right.label
    && left.color === right.color
    && Boolean(left.deleted) === Boolean(right.deleted);
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
