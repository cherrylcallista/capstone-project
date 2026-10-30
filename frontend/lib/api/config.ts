import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getDefaultApiUrl() {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) {
    return `http://${host}:3000`;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiUrl();
