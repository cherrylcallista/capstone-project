import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { AccountType, AuthResponse, TaskType } from './types';

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

function getStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function getStoredAuth(): AuthResponse | null {
  if (memoryAuth) {
    return memoryAuth;
  }

  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const storedAuth = storage.getItem(AUTH_STORAGE_KEY);
    memoryAuth = storedAuth ? (JSON.parse(storedAuth) as AuthResponse) : null;
    return memoryAuth;
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function saveAuth(auth: AuthResponse) {
  memoryAuth = auth;
  getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function hasStoredLogin() {
  return getStoredAuth() !== null;
}

export async function validateStoredLogin() {
  const auth = getStoredAuth();
  if (!auth) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.status === 401) {
      clearStoredLogin();
      return false;
    }

    return response.ok;
  } catch {
    return true;
  }
}

export function clearStoredLogin() {
  memoryAuth = null;
  getStorage()?.removeItem(AUTH_STORAGE_KEY);
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
  saveAuth(auth);
  return auth;
}

export function login(email: string, password: string) {
  return postAuth('/api/auth/login', { email, password });
}

export function register(username: string, email: string, password: string) {
  return postAuth('/api/auth/register', { username, email, password });
}

export async function fetchProfile(): Promise<AccountType> {
  const auth = getStoredAuth();
  if (!auth) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredLogin();
    }
    throw new Error(`Profile request failed with status ${response.status}`);
  }

  return response.json() as Promise<AccountType>;
}

async function taskRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const auth = getStoredAuth();
  if (!auth) {
    throw new Error('Sesi login tidak tersedia. Silakan login kembali.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
      ...options?.headers,
    },
  });
  const data = await response.json() as T & { error?: string };

  if (response.status === 401) {
    clearStoredLogin();
    throw new Error('Sesi login sudah berakhir. Silakan login kembali.');
  }

  if (!response.ok) {
    throw new Error(data.error ?? 'Task request failed');
  }

  return data;
}

export function fetchTasks() {
  return taskRequest<TaskType[]>('/api/tasks');
}

export function fetchTaskCategories() {
  return taskRequest<string[]>('/api/categories');
}

export function createTaskCategory(name: string) {
  return taskRequest<{ category: string }>('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function createTask(task: Omit<TaskType, 'id' | 'addedTime'>) {
  return taskRequest<TaskType>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export function updateTask(id: number, changes: Partial<TaskType>) {
  return taskRequest<TaskType>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}