import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import type { AccountType, AuthResponse, ScheduleBlockType, TaskType } from './types';
import {
  createLocalCategory,
  deleteLocalSchedule,
  createLocalTask,
  getCachedCategories,
  getCachedSchedules,
  getCachedTasks,
  getPendingChanges,
  reconcileRemoteData,
  subscribeToLocalDataChanges,
  saveLocalSchedule,
  updateLocalTask,
} from './offlineStore';

export { subscribeToLocalDataChanges };

function getDefaultApiUrl() {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) {
    return `http://${host}:3000`;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiUrl();
const AUTH_STORAGE_KEY = 'capstone-auth';
let memoryAuth: AuthResponse | null = null;
let syncInFlight: Promise<void> | null = null;
let networkSubscription: ReturnType<typeof Network.addNetworkStateListener> | null = null;

function getWebStorage(): Storage | null {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined' ? localStorage : null;
}

async function getStoredAuth(): Promise<AuthResponse | null> {
  if (memoryAuth) {
    return memoryAuth;
  }

  const storage = getWebStorage();
  const storedAuth = storage
    ? storage.getItem(AUTH_STORAGE_KEY)
    : await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
  if (!storedAuth) {
    return null;
  }

  try {
    memoryAuth = JSON.parse(storedAuth) as AuthResponse;
    return memoryAuth;
  } catch {
    if (storage) {
      storage.removeItem(AUTH_STORAGE_KEY);
    } else {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    }
    return null;
  }
}

async function saveAuth(auth: AuthResponse) {
  memoryAuth = auth;
  const storage = getWebStorage();
  if (storage) {
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } else {
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }
}

export function hasStoredLogin() {
  if (memoryAuth) {
    return true;
  }
  return Boolean(getWebStorage()?.getItem(AUTH_STORAGE_KEY));
}

export async function validateStoredLogin() {
  const auth = await getStoredAuth();
  if (!auth) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.status === 401) {
      await clearStoredLogin();
      return false;
    }

    return response.ok;
  } catch {
    return true;
  }
}

export async function clearStoredLogin() {
  memoryAuth = null;
  const storage = getWebStorage();
  if (storage) {
    storage.removeItem(AUTH_STORAGE_KEY);
  } else {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
  }
}

async function postAuth(path: string, body: Record<string, string>): Promise<AuthResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Tidak dapat terhubung ke server. Jalankan backend di port 3000 atau atur EXPO_PUBLIC_API_URL (saat ini: ${API_URL}).`,
    );
  }

  const data = await response.json() as { error?: string; token?: string; account?: AccountType };
  if (!response.ok) {
    throw new Error(data.error ?? 'Authentication request failed');
  }

  if (!data.token || !data.account) {
    throw new Error('Respons login dari server tidak valid.');
  }

  const auth: AuthResponse = { token: data.token, account: data.account };
  await saveAuth(auth);
  return auth;
}

export function login(email: string, password: string) {
  return postAuth('/api/auth/login', { email, password });
}

export function register(username: string, email: string, password: string) {
  return postAuth('/api/auth/register', { username, email, password });
}

export async function fetchProfile(): Promise<AccountType> {
  const auth = await getStoredAuth();
  if (!auth) {
    throw new Error('Authentication required');
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
  } catch {
    return auth.account;
  }

  if (!response.ok) {
    if (response.status === 401) {
      await clearStoredLogin();
    }
    throw new Error(`Profile request failed with status ${response.status}`);
  }

  return response.json() as Promise<AccountType>;
}

async function synchronizeAccount() {
  const auth = await getStoredAuth();
  if (!auth) {
    return;
  }

  const networkState = await Network.getNetworkStateAsync();
  if (networkState.isConnected === false) {
    return;
  }

  const accountKey = auth.account.email;
  let needsInitialPull = true;

  while (needsInitialPull) {
    const pending = await getPendingChanges(accountKey);
    const sentChanges = {
      taskUpserts: pending.taskUpserts.slice(0, 100),
      categoryUpserts: pending.categoryUpserts.slice(0, 100),
      scheduleUpserts: pending.scheduleUpserts.slice(0, 100),
    };
    const response = await fetch(`${API_URL}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(sentChanges),
    });

    if (response.status === 401) {
      await clearStoredLogin();
      throw new Error('Sesi login sudah berakhir. Silakan login kembali.');
    }

    const data = await response.json() as {
      error?: string;
      tasks?: TaskType[];
      categories?: string[];
      schedules?: ScheduleBlockType[];
    };
    if (!response.ok) {
      throw new Error(data.error ?? 'Sinkronisasi data gagal.');
    }
    if (!Array.isArray(data.tasks) || !Array.isArray(data.categories) || !Array.isArray(data.schedules)) {
      throw new Error('Respons sinkronisasi dari server tidak valid.');
    }

    await reconcileRemoteData(accountKey, data.tasks, data.categories, sentChanges, data.schedules);
    const remaining = await getPendingChanges(accountKey);
    needsInitialPull = remaining.taskUpserts.length > 0
      || remaining.categoryUpserts.length > 0
      || remaining.scheduleUpserts.length > 0;
  }
}

function synchronizeInBackground() {
  void synchronize().catch((error) => {
    console.warn('Offline sync is pending:', error);
  });
}

export async function synchronize(): Promise<void> {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = synchronizeAccount().finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

export function startOfflineSync() {
  if (networkSubscription) {
    return () => undefined;
  }

  networkSubscription = Network.addNetworkStateListener((state) => {
    if (state.isConnected) {
      synchronizeInBackground();
    }
  });
  synchronizeInBackground();

  return () => {
    networkSubscription?.remove();
    networkSubscription = null;
  };
}

export async function loadCachedTasks() {
  const auth = await getStoredAuth();
  return auth ? getCachedTasks(auth.account.email) : [];
}

export async function fetchTasks() {
  const tasks = await loadCachedTasks();
  synchronizeInBackground();
  return tasks;
}

export async function loadCachedCategories() {
  const auth = await getStoredAuth();
  return auth ? getCachedCategories(auth.account.email) : [];
}

export async function fetchTaskCategories() {
  const categories = await loadCachedCategories();
  synchronizeInBackground();
  return categories;
}

export async function loadCachedScheduleBlocks() {
  const auth = await getStoredAuth();
  return auth ? getCachedSchedules(auth.account.email) : [];
}

export async function fetchScheduleBlocks() {
  const schedules = await loadCachedScheduleBlocks();
  synchronizeInBackground();
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
  synchronizeInBackground();
  return block;
}

export async function removeScheduleBlock(clientId: string) {
  const auth = await getStoredAuth();
  if (!auth) {
    throw new Error('Sesi login tidak tersedia. Silakan login kembali.');
  }

  await deleteLocalSchedule(auth.account.email, clientId);
  synchronizeInBackground();
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
  synchronizeInBackground();
  return { category };
}

export async function createTask(task: Omit<TaskType, 'id' | 'addedTime' | 'clientId'>) {
  const auth = await getStoredAuth();
  if (!auth) {
    throw new Error('Sesi login tidak tersedia. Silakan login kembali.');
  }

  const savedTask = await createLocalTask(auth.account.email, task);
  synchronizeInBackground();
  return savedTask;
}

export async function updateTask(id: number, changes: Partial<TaskType>) {
  const auth = await getStoredAuth();
  if (!auth) {
    throw new Error('Sesi login tidak tersedia. Silakan login kembali.');
  }

  const updatedTask = await updateLocalTask(auth.account.email, id, changes);
  synchronizeInBackground();
  return updatedTask;
}
