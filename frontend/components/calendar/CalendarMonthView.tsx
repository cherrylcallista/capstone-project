import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import { TaskListItem } from '@/components/TaskListItem';
import type { TaskType } from '@/lib/types';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type CalendarMonthViewProps = {
  calendarMonth: string;
  selectedDate: string;
  markedDates: Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }>;
  dayTasks: TaskType[];
  monthNames: string[];
  onOpenMonthPicker: () => void;
  onSelectDate: (date: string) => void;
  onChangeMonth: (date: string) => void;
  onToggleTask: (task: TaskType) => void;
  onSelectTask: (task: TaskType) => void;
};

export function CalendarMonthView({
  calendarMonth,
  selectedDate,
  markedDates,
  dayTasks,
  monthNames,
  onOpenMonthPicker,
  onSelectDate,
  onChangeMonth,
  onToggleTask,
  onSelectTask,
}: CalendarMonthViewProps) {
  const { colors, mode } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <View>
      <Calendar
        key={mode}
        initialDate={calendarMonth}
        current={calendarMonth}
        onDayPress={(day: DateData) => onSelectDate(day.dateString)}
        onMonthChange={(month: DateData) => onChangeMonth(month.dateString)}
        renderHeader={() => (
          <TouchableOpacity style={styles.monthHeader} onPress={onOpenMonthPicker}>
            <Text style={styles.monthHeaderText}>
              {monthNames[Number(calendarMonth.slice(5, 7)) - 1]} {calendarMonth.slice(0, 4)}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
        markedDates={markedDates}
        enableSwipeMonths
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          dayTextColor: colors.text,
          textDisabledColor: colors.textMuted,
          monthTextColor: colors.text,
          todayTextColor: colors.primary,
          arrowColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.onPrimary,
          textDayFontWeight: '600',
          textMonthFontWeight: '800',
          textDayHeaderFontWeight: '700',
        }}
      />
      <Text style={styles.selectedDate}>{selectedDate}</Text>
      {dayTasks.length === 0 ? (
        <Text style={styles.emptyText}>Tidak ada tugas atau acara pada tanggal ini.</Text>
      ) : dayTasks.map((task) => (
        <TaskListItem
          key={task.clientId ?? task.id}
          task={task}
          variant="calendar"
          onToggle={task.isTodo ? () => onToggleTask(task) : undefined}
          onPress={() => onSelectTask(task)}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  monthHeaderText: { fontSize: 16, fontWeight: '800', color: colors.primary },
  selectedDate: { marginTop: 20, marginBottom: 10, fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: { color: colors.textMuted, marginTop: 12 },
});
