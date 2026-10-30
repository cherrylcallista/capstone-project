import React from 'react';
import { Modal, SafeAreaView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import type { TimerItem } from '@/components/time/TimerCard';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type RunningTimerModalProps = {
  visible: boolean;
  activeTimer: TimerItem | null;
  phase: 'work' | 'rest';
  remainingMs: number;
  isFinished: boolean;
  isWaiting: boolean;
  autoplay: boolean;
  repeatCount: number;
  cycle: number;
  onClose: () => void;
  onRepeatCountChange: (value: number) => void;
  onAutoplayChange: (enabled: boolean) => void;
  onContinueRest: () => void;
  onRestartCycle: () => void;
};

function formatClock(totalMs: number) {
  const totalSeconds = Math.ceil(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function RunningTimerModal({
  visible,
  activeTimer,
  phase,
  remainingMs,
  isFinished,
  isWaiting,
  autoplay,
  repeatCount,
  cycle,
  onClose,
  onRepeatCountChange,
  onAutoplayChange,
  onContinueRest,
  onRestartCycle,
}: RunningTimerModalProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Tutup timer">
            <Ionicons name="close-circle" size={30} color={colors.danger} />
          </TouchableOpacity>
          <View style={styles.repeatControls}>
            <Text style={styles.repeatLabel}>Repeat: {repeatCount}</Text>
            <View style={styles.repeatStepper}>
              <TouchableOpacity
                style={styles.repeatStepButton}
                onPress={() => onRepeatCountChange(Math.max(1, repeatCount - 1))}
                accessibilityLabel="Kurangi pengulangan"
              >
                <Ionicons name="remove" size={17} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.repeatCycle}>{cycle} / {repeatCount}</Text>
              <TouchableOpacity
                style={styles.repeatStepButton}
                onPress={() => onRepeatCountChange(Math.min(99, repeatCount + 1))}
                accessibilityLabel="Tambah pengulangan"
              >
                <Ionicons name="add" size={17} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.autoplayControl}>
            <Text style={styles.autoplayLabel}>Autoplay</Text>
            <Switch
              value={autoplay}
              onValueChange={onAutoplayChange}
              trackColor={{ false: colors.border, true: colors.border }}
              thumbColor={autoplay ? colors.primary : colors.textMuted}
            />
          </View>
        </View>
        <View style={styles.timerPanel}>
          {isFinished ? (
            <View style={styles.finished}>
              <Text style={styles.finishedTitle}>Siklus pomodoro selesai</Text>
              <TouchableOpacity style={styles.restartButton} onPress={onRestartCycle}>
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <Text style={styles.restartText}>
                  {cycle < repeatCount ? 'Mulai siklus berikutnya' : 'Ulangi siklus'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timeGroup}>
              <Text style={styles.time}>{formatClock(remainingMs)}</Text>
              {phase === 'rest' && <Text style={styles.restTag}>Rest</Text>}
            </View>
          )}
        </View>
        {isWaiting && !isFinished && (
          <TouchableOpacity style={styles.continueButton} onPress={onContinueRest}>
            <Ionicons name="play" size={18} color={colors.onPrimary} />
            <Text style={styles.continueText}>Mulai istirahat</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.description}>
          {isFinished
            ? 'Kerja bagus. Siap untuk siklus berikutnya?'
            : phase === 'rest'
              ? 'Enjoy your rest!'
              : activeTimer?.restMinutes
                ? `Next, rest for ${activeTimer.restMinutes} minute(s).`
                : 'Stay focused until the timer ends.'}
        </Text>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingBottom: 24, backgroundColor: colors.background },
  header: { width: '90%', alignSelf: 'center', minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  repeatControls: { flex: 1, alignItems: 'center' },
  repeatLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  repeatStepper: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  repeatStepButton: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.surfaceSecondary },
  repeatCycle: { minWidth: 38, textAlign: 'center', fontSize: 11, color: colors.textMuted },
  autoplayControl: { alignItems: 'center', gap: 2 },
  autoplayLabel: { fontSize: 11, color: colors.textMuted },
  timerPanel: { flex: 1, width: '90%', alignSelf: 'center', minHeight: 340, maxHeight: 560, alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 14, backgroundColor: colors.primary },
  timeGroup: { alignItems: 'center' },
  time: { fontSize: 54, fontWeight: '900', color: colors.onPrimary, fontVariant: ['tabular-nums'] },
  restTag: { marginTop: 4, fontSize: 20, fontWeight: '700', color: colors.onPrimary },
  finished: { alignItems: 'center', gap: 22 },
  finishedTitle: { maxWidth: 280, fontSize: 25, fontWeight: '800', lineHeight: 32, color: colors.onPrimary, textAlign: 'center' },
  restartButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: colors.surface },
  restartText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  continueButton: { width: '90%', alignSelf: 'center', minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, borderRadius: 10, backgroundColor: colors.primary },
  continueText: { fontSize: 14, fontWeight: '700', color: colors.onPrimary },
  description: { width: '90%', alignSelf: 'center', minHeight: 44, marginTop: 12, fontSize: 14, color: colors.textSecondary, textAlign: 'center', textAlignVertical: 'center' },
});
