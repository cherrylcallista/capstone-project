import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { clearStoredLogin, fetchProfile } from '@/lib/api';
import type { AccountType } from '@/lib/types';

interface FAQItem {
  id: string;
  title: string;
  description?: string;
  steps?: string[];
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    title: 'Matriks Eisenhower',
    description: 'Matriks Eisenhower adalah metode manajemen waktu untuk memprioritaskan tugas berdasarkan tingkat kepentingan dan urgensinya.',
    steps: ['Satu', 'Dua', 'Tiga'],
  },
  {
    id: '2',
    title: 'Text here',
    description: 'Deskripsi bantuan tambahan dapat diletakkan di sini.',
    steps: ['Langkah A', 'Langkah B'],
  },
  {
    id: '3',
    title: 'Text here',
    description: 'Deskripsi bantuan tambahan dapat diletakkan di sini.',
    steps: ['Langkah 1', 'Langkah 2'],
  },
];

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
  const [profile, setProfile] = useState<AccountType | null>(null);
  const [hideEmail, setHideEmail] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((account) => {
        setProfile(account);
        setHideEmail(account.settings.hideEmail);
        setIsDarkMode(account.settings.theme === 'dark');
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

  // Fungsi Toggle Accordion Bantuan
  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. KARTU PROFIL UTAMA */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <FontAwesome5 name="user-alt" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.username}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Keluar dari akun"
            accessibilityRole="button"
            activeOpacity={0.7}
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={22} color="#B91C1C" />
          </TouchableOpacity>
        </View>

        {/* 2. KARTU HIGHLIGHT STATISTIK */}
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

        {/* 3. SECTION PENGATURAN */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Pengaturan</Text>

          <View style={styles.settingsContainer}>
            {/* Baris 1: Sembunyikan Email */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Sembunyikan email</Text>
              <Switch
                value={hideEmail}
                onValueChange={setHideEmail}
                trackColor={{ false: '#CBD5E1', true: '#1D2B53' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingDivider} />

            {/* Baris 2: Bahasa */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Bahasa</Text>
              <View style={styles.settingValueRow}>
                <Text style={styles.flagEmoji}>🇮🇩</Text>
                <Text style={styles.settingValueText}>
                  {profile.settings.language === 'id' ? 'Indonesia' : profile.settings.language}
                </Text>
              </View>
            </View>

            <View style={styles.settingDivider} />

            {/* Baris 3: Tema */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Tema</Text>
              <View style={styles.settingValueRow}>
                <Text style={styles.settingValueText}>
                  {isDarkMode ? 'Mode Gelap' : 'Mode Cerah'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsDarkMode((prev) => !prev)}
                  style={styles.themeToggleBox}
                >
                  <Ionicons
                    name={isDarkMode ? 'moon' : 'sunny'}
                    size={16}
                    color={isDarkMode ? '#1D2B53' : '#F59E0B'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 4. SECTION BANTUAN (ACCORDION) */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Bantuan</Text>

          <View style={styles.faqList}>
            {FAQ_DATA.map((item) => {
              const isExpanded = expandedFaqId === item.id;

              return (
                <View key={item.id} style={styles.faqWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.faqHeader,
                      isExpanded && styles.faqHeaderExpanded,
                    ]}
                    onPress={() => toggleFaq(item.id)}
                  >
                    <Text style={styles.faqTitle}>{item.title}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#475569"
                    />
                  </TouchableOpacity>

                  {/* Konten Accordion jika terbuka */}
                  {isExpanded && (
                    <View style={styles.faqBody}>
                      <View style={styles.faqDivider} />
                      <Text style={styles.faqDescription}>
                        {item.description}
                      </Text>

                      {item.steps && (
                        <View style={styles.faqStepsContainer}>
                          <Text style={styles.faqStepsTitle}>
                            Cara Penggunaan:
                          </Text>
                          {item.steps.map((step, idx) => (
                            <Text key={idx} style={styles.faqStepItem}>
                              {idx + 1}. {step}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: "90%",
    alignSelf: "center"
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    // paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110, // Memberikan ruang cukup agar tidak tertutup floating tab bar
  },

  // Kartu Profil
  profileCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1D2B53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },

  // Statistik Highlight (2 Kolom)
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#334155',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },

  // Heading & Pengaturan
  sectionBlock: {
    marginBottom: 28,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  settingsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagEmoji: {
    fontSize: 16,
  },
  settingValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  themeToggleBox: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  // Accordion Bantuan
  faqList: {
    gap: 12,
  },
  faqWrapper: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  faqHeaderExpanded: {
    paddingBottom: 8,
  },
  faqTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  faqBody: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  faqDivider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 10,
  },
  faqDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 12,
  },
  faqStepsContainer: {
    gap: 4,
  },
  faqStepsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  faqStepItem: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#475569',
    paddingLeft: 6,
  },
});