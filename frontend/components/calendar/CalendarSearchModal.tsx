import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppTypography';
import type { TaskType } from '@/lib/types';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type CalendarSearchModalProps = {
  visible: boolean;
  query: string;
  tasks: TaskType[];
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSelectTask: (task: TaskType) => void;
};

export function CalendarSearchModal({
  visible,
  query,
  tasks,
  onQueryChange,
  onClose,
  onSelectTask,
}: CalendarSearchModalProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={onClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Cari acara</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Tutup pencarian">
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={onQueryChange}
              placeholder="Cari nama acara..."
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </View>
          <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
            {tasks.map((task) => (
              <TouchableOpacity
                key={task.clientId ?? task.id}
                style={styles.result}
                onPress={() => onSelectTask(task)}
              >
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{task.detail}</Text>
                  <Text style={styles.resultDate}>{task.dueDate}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
            {tasks.length === 0 && <Text style={styles.empty}>Tidak ada acara yang cocok.</Text>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.overlay },
  dismiss: { ...StyleSheet.absoluteFill },
  modal: { width: '100%', maxWidth: 420, maxHeight: '75%', padding: 18, borderRadius: 16, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', color: colors.primary },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.inputBackground },
  input: { flex: 1, minHeight: 42, color: colors.text },
  results: { marginTop: 10 },
  result: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: colors.border },
  resultContent: { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  resultDate: { marginTop: 3, fontSize: 11, color: colors.textMuted },
  empty: { paddingVertical: 16, color: colors.textMuted },
});
