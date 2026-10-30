import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskForm } from '@/components/TaskForm';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';
import { AppText as Text } from '@/components/AppTypography';
import type { TaskType } from '@/lib/types';
import { TodoTaskSections } from '@/components/todo/TodoTaskSections';
import { TodoToolbar } from '@/components/todo/TodoToolbar';
import { useTodoTasks } from '@/features/todo/useTodoTasks';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

export default function TodoScreen() {
  const [formVisible, setFormVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const todo = useTodoTasks();
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>To-do List <Text style={styles.taskCount}>({todo.filteredTasks.length})</Text></Text>
        </View>
        <TodoToolbar
          searchQuery={todo.searchQuery}
          onSearchChange={todo.setSearchQuery}
          selectedCategory={todo.selectedCategory}
          onCategoryChange={todo.setSelectedCategory}
          categories={todo.categories}
          sortOrder={todo.sortOrder}
          onSortChange={todo.setSortOrder}
          sortMenuOpen={todo.sortMenuOpen}
          onSortMenuChange={todo.setSortMenuOpen}
        />
        <TodoTaskSections
          tasksBySection={todo.tasksBySection}
          onToggleTask={todo.toggleTask}
          onSelectTask={setSelectedTask}
        />
        {!todo.isLoadingTasks && todo.filteredTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="file-tray-outline"
              size={82}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {todo.hasTodoTasks ? 'Tidak ditemukan tugas yang sesuai.' : 'Belum ada tugas.'}
            </Text>
            <Text style={styles.emptyDescription}>
              {todo.hasTodoTasks
                ? 'Coba ubah kategori atau kata pencarian.'
                : 'Tambahkan tugas sekarang untuk mulai mengatur harimu.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setFormVisible(true)}>
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
      <TaskForm
        visible={formVisible}
        categories={todo.categories.filter((category) => category !== 'Semua')}
        onClose={() => setFormVisible(false)}
        onSaved={todo.saveTask}
        onCategoryCreated={todo.addCategory}
      />
      <TaskDetailsModal
        task={selectedTask}
        categories={todo.categories}
        onClose={() => setSelectedTask(null)}
        onSaved={(task) => {
          todo.saveTask(task);
          setSelectedTask(null);
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: colors.background },
  content: { width: '90%', alignSelf: 'center', flexGrow: 1, paddingTop: 20, paddingBottom: 116 },
  header: { marginBottom: 18 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8, color: colors.text },
  taskCount: { fontSize: 25, fontWeight: '700', color: colors.textSecondary },
  emptyState: { flex: 1, minHeight: 360, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontSize: 16, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  emptyDescription: { marginTop: 6, maxWidth: 240, fontSize: 14, lineHeight: 20, color: colors.textMuted, textAlign: 'center' },
  fab: { position: 'absolute', right: 22, bottom: 94, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, elevation: 8, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 9 },
});
