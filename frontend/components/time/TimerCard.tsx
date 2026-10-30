import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

export type TimerItem = {
  id: string;
  hours?: number;
  minutes: number;
  seconds?: number;
  restMinutes?: number;
  repeatCount: number;
  autoplay: boolean;
  isFavorite: boolean;
};

type TimerCardProps = {
  hours?: number;
  minutes: number;
  seconds?: number;
  restMinutes?: number;
  isFavorite: boolean;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function getTimerDurationMs(timer: TimerItem) {
  return (((timer.hours ?? 0) * 60 + timer.minutes) * 60 + (timer.seconds ?? 0)) * 1000;
}

export function TimerCard({
  hours,
  minutes,
  seconds,
  restMinutes,
  isFavorite,
  onPress,
  onToggleFavorite,
  onEdit,
  onDelete,
}: TimerCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  const textColor = isFavorite ? colors.onPrimary : colors.text;
  const restColor = isFavorite ? colors.onPrimary : colors.textMuted;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, isFavorite ? styles.favoriteCard : styles.normalCard]}
    >
      <TouchableOpacity
        style={styles.menuButton}
        onPress={(event) => {
          event.stopPropagation();
          setMenuOpen((open) => !open);
        }}
        activeOpacity={0.7}
        accessibilityLabel="Opsi timer"
      >
        <Ionicons name="ellipsis-vertical" size={18} color={textColor} />
      </TouchableOpacity>
      {menuOpen && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={(event) => {
              event.stopPropagation();
              setMenuOpen(false);
              onToggleFavorite?.();
            }}
          >
            <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={16} color="#D89B13" />
            <Text style={styles.menuText}>{isFavorite ? 'Hapus favorit' : 'Tambah favorit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={(event) => {
              event.stopPropagation();
              setMenuOpen(false);
              onEdit?.();
            }}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.menuText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={(event) => {
              event.stopPropagation();
              setMenuOpen(false);
              onDelete?.();
            }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.timeRow}>
        {hours !== undefined && hours > 0 && (
          <>
            <Text style={[styles.timeNumber, { color: textColor }]}>{hours}</Text>
            <Text style={[styles.timeUnit, { color: textColor }]}>hr </Text>
          </>
        )}
        {(minutes > 0 || (hours === undefined && !seconds)) && (
          <>
            <Text style={[styles.timeNumber, { color: textColor }]}>{minutes}</Text>
            <Text style={[styles.timeUnit, { color: textColor }]}>mins</Text>
          </>
        )}
        {!!seconds && seconds > 0 && (
          <>
            <Text style={[styles.timeNumber, { color: textColor }]}>{seconds}</Text>
            <Text style={[styles.timeUnit, { color: textColor }]}>secs</Text>
          </>
        )}
      </View>

      {restMinutes !== undefined && (
        <Text style={[styles.restText, { color: restColor }]}>{restMinutes} mins rest</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  card: { width: '47.5%', aspectRatio: 1, borderRadius: 16, padding: 14, justifyContent: 'center', alignItems: 'center' },
  favoriteCard: { backgroundColor: colors.primary, elevation: 3, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
  normalCard: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  menuButton: { position: 'absolute', top: 9, right: 7, zIndex: 12, padding: 5 },
  menu: { position: 'absolute', top: 38, right: 8, zIndex: 20, width: 118, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surface, elevation: 8, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  menuItem: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  menuText: { fontSize: 13, fontWeight: '600', color: colors.text },
  deleteText: { fontSize: 13, fontWeight: '600', color: colors.danger },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  timeNumber: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  timeUnit: { fontSize: 14, fontWeight: '600', marginLeft: 1, marginRight: 2 },
  restText: { fontSize: 13, fontWeight: '600', marginTop: 4 },
});
