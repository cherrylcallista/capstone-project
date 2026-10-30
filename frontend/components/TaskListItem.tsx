import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import type { TaskType } from '@/lib/types';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type TaskListItemProps = {
  task: TaskType;
  variant: 'todo' | 'calendar';
  onPress: () => void;
  onToggle?: () => void;
};

export function TaskListItem({ task, variant, onPress, onToggle }: TaskListItemProps) {
  const isCompleted = task.markedAsFinished;
  const isOverdue = task.dueDate != null && task.dueDate < new Date().toISOString().slice(0, 10);
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <View style={[
      variant === 'todo' ? styles.todoCard : styles.calendarCard,
      isCompleted && variant === 'todo' && styles.completedCard,
    ]}>
      {onToggle && (
        <TouchableOpacity
          style={variant === 'todo' ? styles.todoCheckbox : styles.calendarCheckbox}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`${isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}: ${task.detail}`}
        >
          <Ionicons
            name={isCompleted ? 'checkbox' : 'square-outline'}
            size={variant === 'todo' ? 24 : 23}
            color={isCompleted ? colors.textMuted : colors.textMuted}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Buka detail tugas: ${task.detail}`}
      >
        <Text style={[
          variant === 'todo' ? styles.todoTitle : styles.calendarTitle,
          isCompleted && styles.completedText,
        ]}>
          {task.detail}
        </Text>
        {variant === 'todo' ? (
          <Text style={[styles.todoDate, isOverdue && !isCompleted && styles.overdueDate]}>
            {task.dueDate ?? 'Tanpa tanggal'}
          </Text>
        ) : (
          <Text style={styles.eventType}>{task.isTodo ? 'Todo' : 'Pengingat acara'}</Text>
        )}
        {task.category ? (
          <Text style={variant === 'todo' ? styles.todoCategory : styles.calendarCategory}>
            {task.category}
          </Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  todoCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 15, marginBottom: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.035, shadowRadius: 6, elevation: 1 },
  calendarCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  completedCard: { backgroundColor: colors.surfaceSecondary, opacity: 0.75 },
  todoCheckbox: { marginRight: 12, marginTop: 1, padding: 2 },
  calendarCheckbox: { marginRight: 12 },
  content: { flex: 1 },
  todoTitle: { fontSize: 14, lineHeight: 21, fontWeight: '700', color: colors.text },
  calendarTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  completedText: { textDecorationLine: 'line-through', color: colors.textMuted },
  todoDate: { marginTop: 6, fontSize: 11, fontWeight: '600', color: colors.textMuted },
  overdueDate: { color: colors.danger },
  todoCategory: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 9, paddingVertical: 4, overflow: 'hidden', borderRadius: 8, backgroundColor: colors.primarySurface, fontSize: 10, fontWeight: '700', color: colors.primaryText },
  eventType: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  calendarCategory: { marginTop: 4, fontSize: 12, fontWeight: '600', color: colors.textSecondary },
});
