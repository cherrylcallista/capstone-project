import * as Network from 'expo-network';
import type { ScheduleBlockType, TaskType } from '../types';
import {
  getPendingChanges,
  reconcileRemoteData,
} from '../offlineStore';
import { API_URL } from './config';
import { clearStoredLogin, getStoredAuth } from './auth';

let syncInFlight: Promise<void> | null = null;
let networkSubscription: ReturnType<typeof Network.addNetworkStateListener> | null = null;

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

export function synchronizeInBackgroundIfPossible() {
  synchronizeInBackground();
}
