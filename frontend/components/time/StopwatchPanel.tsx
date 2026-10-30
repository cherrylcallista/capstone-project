import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

export type StopwatchLap = {
  id: string;
  elapsedMs: number;
  intervalMs: number;
};

type StopwatchPanelProps = {
  elapsedMs: number;
  isRunning: boolean;
  laps: StopwatchLap[];
  onMarkLap: () => void;
  onToggle: () => void;
  onReset: () => void;
};

function formatStopwatchTime(totalMs: number) {
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatLapTime(totalMs: number) {
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((totalMs % 1000) / 10);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

export function StopwatchPanel({
  elapsedMs,
  isRunning,
  laps,
  onMarkLap,
  onToggle,
  onReset,
}: StopwatchPanelProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.wrapper}>
      <View style={styles.timeRow}>
        <Text style={styles.display}>{formatStopwatchTime(elapsedMs)}</Text>
        <Text style={styles.millis}>.{String(Math.floor((elapsedMs % 1000) / 10)).padStart(2, '0')}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.lapButton, (!isRunning || elapsedMs === 0) && styles.disabled]}
          onPress={onMarkLap}
          disabled={!isRunning || elapsedMs === 0}
          accessibilityLabel="Tandai lap"
        >
          <Ionicons name="flag-outline" size={20} color={colors.onPrimary} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} style={styles.primaryButton} onPress={onToggle}>
          <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color={colors.onPrimary} />
          <Text style={styles.primaryButtonText}>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        {!isRunning && elapsedMs > 0 && (
          <TouchableOpacity activeOpacity={0.8} style={styles.resetButton} onPress={onReset}>
            <Ionicons name="reload" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {laps.length > 0 && (
        <View style={styles.lapList}>
          {laps.map((lap) => (
            <View key={lap.id} style={styles.lapRow}>
              <Ionicons name="flag-outline" size={15} color={colors.textMuted} />
              <Text style={styles.lapTime}>{formatLapTime(lap.elapsedMs)}</Text>
              <Text style={styles.lapInterval}>+{formatLapTime(lap.intervalMs)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 24 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 18 },
  display: { fontSize: 56, fontWeight: '900', color: colors.text },
  millis: { fontSize: 18, fontWeight: '700', color: colors.text },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lapButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  disabled: { opacity: 0.45 },
  primaryButton: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 12, gap: 8, elevation: 3, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
  primaryButtonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  resetButton: { backgroundColor: colors.surfaceSecondary, width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lapList: { width: '100%', maxWidth: 400, marginTop: 24 },
  lapRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border, gap: 10 },
  lapTime: { flex: 1, fontSize: 14, fontVariant: ['tabular-nums'], color: colors.text },
  lapInterval: { fontSize: 13, fontVariant: ['tabular-nums'], color: colors.textMuted },
});
