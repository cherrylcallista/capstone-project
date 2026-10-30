import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type ProfileHeaderProps = {
  username: string;
  email: string;
  onLogout: () => void;
};

export function ProfileHeader({ username, email, onLogout }: ProfileHeaderProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <FontAwesome5 name="user-alt" size={28} color={colors.onPrimary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{username}</Text>
        <Text style={styles.email} numberOfLines={1}>{email}</Text>
      </View>
      <TouchableOpacity
        accessibilityLabel="Keluar dari akun"
        accessibilityRole="button"
        activeOpacity={0.7}
        onPress={onLogout}
        style={styles.logout}
      >
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  logout: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.dangerSurface, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
  email: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
});
