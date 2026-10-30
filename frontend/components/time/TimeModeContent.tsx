import React from 'react';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '@/components/AppTypography';
import { StopwatchPanel, type StopwatchLap } from './StopwatchPanel';
import { TimerCard, type TimerItem } from './TimerCard';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type TimeModeContentProps = {
  activeTab: 'timer' | 'stopwatch';
  timers: TimerItem[];
  elapsedMs: number;
  isRunning: boolean;
  laps: StopwatchLap[];
  onSelectTab: (tab: 'timer' | 'stopwatch') => void;
  onAddTimer: () => void;
  onToggleFavorite: (id: string) => void;
  onEditTimer: (timer: TimerItem) => void;
  onDeleteTimer: (id: string) => void;
  onStartTimer: (timer: TimerItem) => void;
  onMarkLap: () => void;
  onToggleStopwatch: () => void;
  onResetStopwatch: () => void;
};

export function TimeModeContent({
  activeTab,
  timers,
  elapsedMs,
  isRunning,
  laps,
  onSelectTab,
  onAddTimer,
  onToggleFavorite,
  onEditTimer,
  onDeleteTimer,
  onStartTimer,
  onMarkLap,
  onToggleStopwatch,
  onResetStopwatch,
}: TimeModeContentProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.tabToggleContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.toggleButton, activeTab === 'timer' ? styles.toggleActive : styles.toggleInactive]}
            onPress={() => onSelectTab('timer')}
          >
            <MaterialCommunityIcons
              name="timer-outline"
              size={24}
              color={activeTab === 'timer' ? colors.onPrimary : colors.primary}
            />
            <Text style={[styles.toggleText, activeTab === 'timer' ? styles.toggleTextActive : styles.toggleTextInactive]}>
              Timer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.toggleButton, activeTab === 'stopwatch' ? styles.toggleActive : styles.toggleInactive]}
            onPress={() => onSelectTab('stopwatch')}
          >
            <Ionicons
              name="stopwatch-outline"
              size={24}
              color={activeTab === 'stopwatch' ? colors.onPrimary : colors.primary}
            />
            <Text style={[styles.toggleText, activeTab === 'stopwatch' ? styles.toggleTextActive : styles.toggleTextInactive]}>
              Stopwatch
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'timer' ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Interval Saya</Text>
            <View style={styles.gridContainer}>
              <TouchableOpacity activeOpacity={0.7} style={[styles.cardBase, styles.addCard]} onPress={onAddTimer}>
                <Ionicons name="add-circle" size={48} color={colors.primary} />
                <Text style={styles.addCardText}>Add Timer</Text>
              </TouchableOpacity>
              {timers.map((timer) => (
                <TimerCard
                  key={timer.id}
                  hours={timer.hours}
                  minutes={timer.minutes}
                  seconds={timer.seconds}
                  restMinutes={timer.restMinutes}
                  isFavorite={timer.isFavorite}
                  onToggleFavorite={() => onToggleFavorite(timer.id)}
                  onEdit={() => onEditTimer(timer)}
                  onDelete={() => onDeleteTimer(timer.id)}
                  onPress={() => onStartTimer(timer)}
                />
              ))}
            </View>
          </View>
        ) : (
          <StopwatchPanel
            elapsedMs={elapsedMs}
            isRunning={isRunning}
            laps={laps}
            onMarkLap={onMarkLap}
            onToggle={onToggleStopwatch}
            onReset={onResetStopwatch}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, flexGrow: 1 },
  tabToggleContainer: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  toggleButton: { flex: 1, height: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  toggleActive: { backgroundColor: colors.primary, elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6 },
  toggleInactive: { backgroundColor: colors.surfaceSecondary, borderWidth: 1.5, borderColor: colors.border },
  toggleText: { fontSize: 16, fontWeight: '700' },
  toggleTextActive: { color: colors.onPrimary },
  toggleTextInactive: { color: colors.primary },
  sectionContainer: { width: '100%' },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 16 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  cardBase: { width: '47.5%', aspectRatio: 1, borderRadius: 16, padding: 14, justifyContent: 'center', alignItems: 'center' },
  addCard: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, gap: 8 },
  addCardText: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },
});
