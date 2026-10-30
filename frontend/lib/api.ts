import type { TaskType } from './types';
import {
  createLocalCategory,
  createLocalTask,
  deleteLocalSchedule,
  getCachedCategories,
  getCachedSchedules,
  getCachedTasks,
  saveLocalSchedule,
  subscribeToLocalDataChanges,
  updateLocalTask,
} from './offlineStore';
import { getStoredAuth } from './api/auth';
import { synchronizeInBackgroundIfPossible } from './api/offlineSync';

export {
  clearStoredLogin,
  fetchProfile,
  hasStoredLogin,
  login,
  register,
  validateStoredLogin,
} from './api/auth';
export { startOfflineSync, synchronize } from './api/offlineSync';
export { subscribeToLocalDataChanges };

export async function loadCachedTasks() {
  const auth = await getStoredAuth();
  return auth ? getCachedTasks(auth.account.email) : [];
}

export async function fetchTasks() {
  const tasks = await loadCachedTasks();
  synchronizeInBackgroundIfPossible();
  return tasks;
}

export async function loadCachedCategories() {
  const auth = await getStoredAuth();
  return auth ? getCachedCategories(auth.account.email) : [];
}

export async function fetchTaskCategories() {
  const categories = await loadCachedCategories();
  synchronizeInBackgroundIfPossible();
  return categories;
}

export async function loadCachedScheduleBlocks() {
  const auth = await getStoredAuth();
  return auth ? getCachedSchedules(auth.account.email) : [];
}

export async function fetchScheduleBlocks() {
  const schedules = await loadCachedScheduleBlocks();
  synchronizeInBackgroundIfPossible();
  return schedules;
}

export async function saveScheduleBlock(input: {
  date: string;
  hour: number;
  durationHours: number;
  label: string;
  color: string;
}) {
  const auth = await getStoredAuth();
  if (!auth) {
    throw new Error('Sesi login tidak tersedia. Silakan login kembali.');
  }

  const block = await saveLocalSchedule(auth.account.email, input);
  synchronizeInBackgroundIfPossible();
  return block;
}

export async function removeScheduleBlock(clientId: string) {
  const auth = await getStoredAuth();
  if (!auth) {
    throw new Error('Sesi login tidak tersedia. Silakan login kembali.');
  }

  await deleteLocalSchedule(auth.account.email, clientId);
  synchronizeInBackgroundIfPossible();
}

export async function createTaskCategory(name: string) {
  const auth = await getStoredAuth();
  if (!auth) {
    throw new Error('Sesi login tidak tersedia. Silakan login kembali.');
  }
  if (!name.trim() || name.trim().length > 30 || name.trim().toLowerCase() === 'semua') {
    throw new Error('Nama kategori tidak valid.');
  }

  const category = await createLocalCategory(auth.account.email, name);
  synchronizeInBackgroundIfPossible();
  return { category };
}

export async function createTask(task: Omit<TaskType, 'id' | 'addedTime' | 'clientId'>) {
  const auth = await getStoredAuth();
  if (!auth) {
    throw new Error('Sesi login tidak tersedia. Silakan login kembali.');
  }

  const savedTask = await createLocalTask(auth.account.email, task);
  synchronizeInBackgroundIfPossible();
  return savedTask;
}

export async function updateTask(id: number, changes: Partial<TaskType>) {
  const auth = await getStoredAuth();
  if (!auth) {
    throw new Error('Sesi login tidak tersedia. Silakan login kembali.');
  }

  const updatedTask = await updateLocalTask(auth.account.email, id, changes);
  synchronizeInBackgroundIfPossible();
  return updatedTask;
}
