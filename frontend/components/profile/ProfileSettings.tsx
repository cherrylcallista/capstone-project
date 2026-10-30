import React from 'react';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type ProfileSettingsProps = {
  hideEmail: boolean;
  onHideEmailChange: (value: boolean) => void;
  language: string;
  isDarkMode: boolean;
  onThemeToggle: () => void;
};

export function ProfileSettings({
  hideEmail,
  onHideEmailChange,
  language,
  isDarkMode,
  onThemeToggle,
}: ProfileSettingsProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Pengaturan</Text>
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>Sembunyikan email</Text>
          <Switch
            value={hideEmail}
            onValueChange={onHideEmailChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Bahasa</Text>
          <View style={styles.valueRow}>
            <Text style={styles.flag}>🇮🇩</Text>
            <Text style={styles.valueText}>{language === 'id' ? 'Indonesia' : language}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Tema</Text>
          <View style={styles.valueRow}>
            <Text style={styles.valueText}>{isDarkMode ? 'Mode Gelap' : 'Mode Cerah'}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onThemeToggle}
              style={styles.themeToggle}
              accessibilityRole="button"
              accessibilityLabel={`Aktifkan mode ${isDarkMode ? 'cerah' : 'gelap'}`}
            >
              <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={16} color={isDarkMode ? colors.primary : '#F59E0B'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  section: { marginBottom: 28 },
  heading: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 14 },
  container: { backgroundColor: colors.surfaceSecondary, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flag: { fontSize: 16 },
  valueText: { fontSize: 14, fontWeight: '600', color: colors.text },
  themeToggle: { backgroundColor: colors.surface, padding: 6, borderRadius: 8, elevation: 1, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  divider: { height: 1, backgroundColor: colors.border },
});
