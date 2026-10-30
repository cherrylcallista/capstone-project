import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppTypography';
import { TaskListItem } from '@/components/TaskListItem';
import type { TaskType } from '@/lib/types';
import { useThemeStyles } from '@/theme/ThemeProvider';

type TodoTaskSectionsProps = {
  tasksBySection: {
    sebelumnya: TaskType[];
    hari_ini: TaskType[];
    masa_mendatang: TaskType[];
    selesai: TaskType[];
  };
  onToggleTask: (task: TaskType) => void;
  onSelectTask: (task: TaskType) => void;
};

const SECTIONS: { key: keyof TodoTaskSectionsProps['tasksBySection']; title: string }[] = [
  { key: 'sebelumnya', title: 'Sebelumnya' },
  { key: 'hari_ini', title: 'Hari ini' },
  { key: 'masa_mendatang', title: 'Masa Mendatang' },
  { key: 'selesai', title: 'Selesai' },
];

export function TodoTaskSections({ tasksBySection, onToggleTask, onSelectTask }: TodoTaskSectionsProps) {
  const styles = useThemeStyles(createStyles);
  return (
    <>
      {SECTIONS.map(({ key, title }) => {
        const tasks = tasksBySection[key];
        if (tasks.length === 0) return null;

        return (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {tasks.map((task) => (
              <TaskListItem
                key={task.clientId ?? task.id}
                task={task}
                variant="todo"
                onToggle={() => onToggleTask(task)}
                onPress={() => onSelectTask(task)}
              />
            ))}
          </View>
        );
      })}
    </>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  section: { marginBottom: 18 },
  sectionTitle: { marginBottom: 10, fontSize: 16, fontWeight: '700', color: colors.textSecondary },
});
