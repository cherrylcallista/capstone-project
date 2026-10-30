import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppTypography';
import { DatePickerModal } from '@/components/DatePickerModal';
import { FormDropdown } from '@/components/FormDropdown';
import { updateTask } from '@/lib/api';
import type { TaskType } from '@/lib/types';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

const MATRIX_OPTIONS: SelectOption[] = [
  { value: '', label: 'Tidak dimasukkan ke matriks' },
  { value: '1', label: 'Penting dan Mendesak' },
  { value: '2', label: 'Penting, namun Tidak Mendesak' },
  { value: '3', label: 'Tidak Penting, namun Mendesak' },
  { value: '4', label: 'Tidak Penting dan Tidak Mendesak' },
];
const REPEAT_OPTIONS: SelectOption[] = [
  { value: '', label: 'Tidak berulang' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
];

type SelectOption = { value: string; label: string };

type TaskDetailsModalProps = {
  task: TaskType | null;
  categories: string[];
  onClose: () => void;
  onSaved: (task: TaskType) => void;
};

export function TaskDetailsModal({ task, categories, onClose, onSaved }: TaskDetailsModalProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  const [detail, setDetail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [matrix, setMatrix] = useState('');
  const [repeat, setRepeat] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;
    setDetail(task.detail);
    setDueDate(task.dueDate ?? '');
    setCategory(task.category ?? '');
    setMatrix(task.matrix == null ? '' : String(task.matrix));
    setRepeat(task.repeatTask ? String(task.repeatEvery ?? 'weekly') : '');
    setIsFinished(task.markedAsFinished);
    setShowDatePicker(false);
    setErrorMessage(null);
  }, [task]);

  const save = async () => {
    if (!task) return;
    if (!detail.trim()) {
      setErrorMessage('Tugas tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updatedTask = await updateTask(task.id, {
        detail: detail.trim(),
        dueDate: dueDate || null,
        markedAsFinished: isFinished,
        category,
        matrix: matrix ? Number(matrix) : null,
        repeatTask: Boolean(repeat),
        repeatEvery: repeat || null,
      });
      onSaved(updatedTask);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Detail tugas gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const dismiss = () => {
    if (!isSaving) {
      setShowDatePicker(false);
      onClose();
    }
  };

  return (
    <>
      <Modal visible={task !== null} transparent animationType="slide" onRequestClose={dismiss}>
        <View style={styles.detailBackdrop}>
          <TouchableOpacity style={styles.detailDismiss} activeOpacity={1} onPress={dismiss} />
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Detail tugas</Text>
              <TouchableOpacity onPress={dismiss} accessibilityLabel="Tutup detail tugas">
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.detailContent} keyboardShouldPersistTaps="handled">
              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Tugas</Text>
                <TextInput
                  style={[styles.detailInput, styles.detailMultiline]}
                  value={detail}
                  onChangeText={setDetail}
                  multiline
                  placeholder="Deskripsi tugas"
                />
              </View>

              <View style={styles.detailField}>
                <Text style={styles.detailLabel}>Due date</Text>
                <View style={styles.dueDateRow}>
                  <TouchableOpacity style={styles.detailSelect} onPress={() => setShowDatePicker(true)}>
                    <Text style={dueDate ? styles.detailSelectText : styles.detailPlaceholder}>
                      {dueDate || 'Tanpa tenggat'}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                  {dueDate !== '' && (
                    <TouchableOpacity style={styles.clearDateButton} onPress={() => setDueDate('')}>
                      <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.finishedRow}>
                <Text style={styles.detailLabel}>Tandai selesai</Text>
                <Switch
                  value={isFinished}
                  onValueChange={setIsFinished}
                  trackColor={{ false: colors.border, true: colors.primarySurface }}
                  thumbColor={isFinished ? colors.primary : colors.surface}
                />
              </View>

              <FormDropdown
                label="Kategori"
                value={category}
                placeholder="Tanpa kategori"
                options={[
                  { value: '', label: 'Tanpa kategori' },
                  ...categories.filter((item) => item !== 'Semua').map((item) => ({ value: item, label: item })),
                ]}
                onChange={setCategory}
              />
              <FormDropdown
                label="Kategori matriks"
                value={matrix}
                placeholder="Tidak dimasukkan ke matriks"
                options={MATRIX_OPTIONS}
                onChange={setMatrix}
              />
              <FormDropdown
                label="Pengulangan tugas"
                value={repeat}
                placeholder="Tidak berulang"
                options={REPEAT_OPTIONS}
                onChange={setRepeat}
              />

              {task && !Number.isNaN(Date.parse(task.addedTime)) && (
                <Text style={styles.addedDateText}>
                  Dibuat {new Date(task.addedTime).toLocaleDateString('id-ID')}
                </Text>
              )}
              {errorMessage && <Text style={styles.detailError}>{errorMessage}</Text>}
              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.detailCancelButton} onPress={dismiss} disabled={isSaving}>
                  <Text style={styles.detailCancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailSaveButton} onPress={save} disabled={isSaving}>
                  <Text style={styles.detailSaveText}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={showDatePicker && task !== null}
        value={dueDate}
        onChange={(date) => {
          setDueDate(date);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  detailBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  detailDismiss: { flex: 1 },
  detailSheet: { maxHeight: '88%', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.surface },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  detailTitle: { fontSize: 20, fontWeight: '800', color: colors.primary },
  detailContent: { gap: 14, padding: 20, paddingTop: 8, paddingBottom: 28 },
  detailField: { gap: 6 },
  detailLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  detailInput: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.inputBackground, color: colors.text },
  detailMultiline: { minHeight: 74, paddingTop: 12, textAlignVertical: 'top' },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearDateButton: { width: 36, height: 46, alignItems: 'center', justifyContent: 'center' },
  detailSelect: { minHeight: 46, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.inputBackground },
  detailSelectText: { flex: 1, color: colors.text, fontSize: 14 },
  detailPlaceholder: { flex: 1, color: colors.textMuted, fontSize: 14 },
  finishedRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addedDateText: { fontSize: 12, color: colors.textMuted },
  detailError: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  detailCancelButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surfaceSecondary },
  detailCancelText: { color: colors.textSecondary, fontWeight: '700' },
  detailSaveButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.primary },
  detailSaveText: { color: colors.onPrimary, fontWeight: '700' },
});
