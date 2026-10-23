import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { Redirect, useSegments } from 'expo-router';

import { hasStoredLogin, startOfflineSync, validateStoredLogin } from '@/lib/api';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

const WhiteTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff',
  },
};

function RootLayoutNav() {
  const segments = useSegments();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    validateStoredLogin()
      .catch((validationError) => {
        console.error('Failed to restore the stored login:', validationError);
      })
      .finally(() => {
        if (isCurrent) {
          setIsAuthChecked(true);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => startOfflineSync(), []);

  const isAuthRoute = segments[0] === '(auth)' &&
    (segments[1] === 'login' || segments[1] === 'register');

  if (!isAuthChecked) {
    return null;
  }

  if (!hasStoredLogin() && !isAuthRoute) {
    return <Redirect href="/login" />;
  }

  return (
    <ThemeProvider value={WhiteTheme}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#ffffff' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
