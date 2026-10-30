import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import { formatDuration, formatTime, toDateKey } from '@/lib/calendarUtils';
import type { ScheduleBlockType } from '@/lib/types';
import { TimeBlockGrid } from './TimeBlockGrid';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type TimeBlockWeekViewProps = {
  selectedDate: string;
  weekDates: string[];
  weekLabel: string;
  scheduleBlocks: ScheduleBlockType[];
  onSelectDate: (date: string) => void;
  onOpenBlockEditor: (
    date: string,
    hour: number,
    block?: ScheduleBlockType,
    durationHours?: number,
  ) => void;
};

export function TimeBlockWeekView({
  selectedDate,
  weekDates,
  weekLabel,
  scheduleBlocks,
  onSelectDate,
  onOpenBlockEditor,
}: TimeBlockWeekViewProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  const selectedDayBlocks = scheduleBlocks
    .filter((block) => block.date === selectedDate)
    .sort((left, right) => left.hour - right.hour);

  const moveWeek = (offset: number) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + offset * 7);
    onSelectDate(toDateKey(date));
  };

  return (
    <ScrollView
      style={styles.timeblockView}
      scrollEnabled
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.weekNavigator}>
        <TouchableOpacity style={styles.weekNavButton} onPress={() => moveWeek(-1)} accessibilityLabel="Minggu sebelumnya">
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <TouchableOpacity style={styles.weekNavButton} onPress={() => moveWeek(1)} accessibilityLabel="Minggu berikutnya">
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <TimeBlockGrid
        selectedDate={selectedDate}
        weekDates={weekDates}
        scheduleBlocks={scheduleBlocks}
        onSelectDate={onSelectDate}
        onOpenBlockEditor={onOpenBlockEditor}
      />
      <View style={styles.summaryList}>
        <Text style={styles.summaryListTitle}>Ringkasan kegiatan</Text>
        {selectedDayBlocks.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada time block untuk hari ini.</Text>
        ) : selectedDayBlocks.map((block) => (
          <TouchableOpacity
            key={block.clientId}
            style={styles.summaryItem}
            onPress={() => onOpenBlockEditor(block.date, block.hour, block)}
          >
            <View style={[styles.summaryColor, { backgroundColor: block.color }]} />
            <Text style={styles.summaryTime}>
              {formatTime(block.hour)}–{formatTime(block.hour + (block.durationHours ?? 1))}
            </Text>
            <Text style={styles.summaryBlockLabel} numberOfLines={1}>{block.label}</Text>
            <Text style={styles.summaryDuration}>{formatDuration(block.durationHours ?? 1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  timeblockView: { flexGrow: 0, flexShrink: 1, minHeight: 0, maxHeight: 600 },
  weekNavigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  weekNavButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surfaceSecondary },
  weekLabel: { fontSize: 15, fontWeight: '800', color: colors.primary },
  summaryList: { paddingTop: 14, paddingBottom: 64 },
  summaryListTitle: { marginBottom: 8, fontSize: 15, fontWeight: '800', color: colors.text },
  summaryItem: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderColor: colors.border },
  summaryColor: { width: 8, height: 24, borderRadius: 5 },
  summaryTime: { width: 92, fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  summaryBlockLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  summaryDuration: { fontSize: 11, color: colors.textMuted },
  emptyText: { color: colors.textMuted, marginTop: 12 },
});
