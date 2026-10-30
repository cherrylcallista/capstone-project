import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AccountType, AuthResponse } from '../types';
import { API_URL } from './config';

const AUTH_STORAGE_KEY = 'capstone-auth';
let memoryAuth: AuthResponse | null = null;

function getWebStorage(): Storage | null {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined' ? localStorage : null;
}

export async function getStoredAuth(): Promise<AuthResponse | null> {
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
