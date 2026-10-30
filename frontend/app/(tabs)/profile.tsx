import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
} from 'react-native';
import { AppText as Text } from '@/components/AppTypography';
import { ProfileFaq } from '@/components/profile/ProfileFaq';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { useRouter } from 'expo-router';
import { clearStoredLogin, fetchProfile } from '@/lib/api';
import type { AccountType } from '@/lib/types';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

function maskEmail(email: string) {
  const atIndex = email.lastIndexOf('@');

  if (atIndex <= 0) {
    return email;
  }

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex);

  if (localPart.length <= 3) {
    return email;
  }

  return `${localPart.slice(0, 2)}${'*'.repeat(localPart.length - 3)}${localPart.slice(-1)}${domain}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { isDark, toggleMode } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  const [profile, setProfile] = useState<AccountType | null>(null);
  const [hideEmail, setHideEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((account) => {
        setProfile(account);
        setHideEmail(account.settings.hideEmail);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.message.includes('status 401')) {
          router.replace('/login');
          return;
        }

        setErrorMessage('Profil tidak dapat dimuat dari server.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await clearStoredLogin();
      router.replace('/login');
    } catch (error) {
      console.error('Failed to clear the stored login:', error);
      setErrorMessage('Sesi tidak dapat dihapus. Silakan coba kembali.');
    }
  };

  // Logika Sensor Email
  const rawEmail = profile?.email ?? '';
  const displayEmail = hideEmail ? maskEmail(rawEmail) : rawEmail;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centeredState}>
        <Text>Memuat profil...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage || !profile) {
    return (
      <SafeAreaView style={styles.centeredState}>
        <Text>{errorMessage ?? 'Profil tidak tersedia.'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ProfileHeader username={profile.username} email={displayEmail} onLogout={handleLogout} />
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Task(s) completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Item(s) on calendar</Text>
          </View>
        </View>
        <ProfileSettings
          hideEmail={hideEmail}
          onHideEmailChange={setHideEmail}
          language={profile.settings.language}
          isDarkMode={isDark}
          onThemeToggle={toggleMode}
        />
        <ProfileFaq />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    width: "90%",
    alignSelf: "center"
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    // paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110, // Memberikan ruang cukup agar tidak tertutup floating tab bar
  },

  // Kartu Profil
  // Statistik Highlight (2 Kolom)
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },

});