import type { TaskType } from './types';

export function upsertTask(tasks: TaskType[], updatedTask: TaskType) {
  const existingIndex = tasks.findIndex((task) => (
    (updatedTask.clientId && task.clientId === updatedTask.clientId)
    || task.id === updatedTask.id
  ));
  if (existingIndex < 0) return [...tasks, updatedTask];
  return tasks.map((task, index) => index === existingIndex ? updatedTask : task);
}
