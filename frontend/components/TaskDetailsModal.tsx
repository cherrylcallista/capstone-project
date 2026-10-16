import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { updateTask } from '@/lib/api';
import type { TaskType } from '@/lib/types';

type SelectOption = { value: string; label: string };

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

type TaskDetailsModalProps = {
  task: TaskType | null;
  categories: string[];
  onClose: () => void;
  onSaved: (task: TaskType) => void;
};

function DetailDropdown({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <View style={styles.detailField}>
      <Text style={styles.detailLabel}>{label}</Text>
      <TouchableOpacity style={styles.detailSelect} onPress={() => setOpen((current) => !current)}>
        <Text style={selectedOption ? styles.detailSelectText : styles.detailPlaceholder}>
          {selectedOption?.label ?? placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
      </TouchableOpacity>
      {open && (
        <View style={styles.detailOptions}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value || 'none'}
              style={[styles.detailOption, option.value === value && styles.detailOptionActive]}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <Text style={[styles.detailOptionText, option.value === value && styles.detailOptionTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export function TaskDetailsModal({ task, categories, onClose, onSaved }: TaskDetailsModalProps) {
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
                <Ionicons name="close" size={24} color="#64748B" />
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
                    <Ionicons name="calendar-outline" size={18} color="#64748B" />
                  </TouchableOpacity>
                  {dueDate !== '' && (
                    <TouchableOpacity style={styles.clearDateButton} onPress={() => setDueDate('')}>
                      <Ionicons name="close-circle-outline" size={20} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.finishedRow}>
                <Text style={styles.detailLabel}>Tandai selesai</Text>
                <Switch
                  value={isFinished}
                  onValueChange={setIsFinished}
                  trackColor={{ false: '#CBD5E1', true: '#AAB7D1' }}
                  thumbColor={isFinished ? '#1D2B53' : '#FFFFFF'}
                />
              </View>

              <DetailDropdown
                label="Kategori"
                value={category}
                placeholder="Tanpa kategori"
                options={[
                  { value: '', label: 'Tanpa kategori' },
                  ...categories.filter((item) => item !== 'Semua').map((item) => ({ value: item, label: item })),
                ]}
                onChange={setCategory}
              />
              <DetailDropdown
                label="Kategori matriks"
                value={matrix}
                placeholder="Tidak dimasukkan ke matriks"
                options={MATRIX_OPTIONS}
                onChange={setMatrix}
              />
              <DetailDropdown
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

      <Modal visible={showDatePicker && task !== null} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.detailDateBackdrop}>
          <View style={styles.detailDateModal}>
            <Calendar
              current={dueDate || undefined}
              onDayPress={(day: DateData) => {
                setDueDate(day.dateString);
                setShowDatePicker(false);
              }}
              markedDates={dueDate ? { [dueDate]: { selected: true, selectedColor: '#1D2B53' } } : undefined}
              enableSwipeMonths
              theme={{ arrowColor: '#1D2B53', todayTextColor: '#1D2B53' }}
            />
            <TouchableOpacity style={styles.datePickerClose} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.detailCancelText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  detailBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  detailDismiss: { flex: 1 },
  detailSheet: { maxHeight: '88%', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#FFFFFF' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  detailTitle: { fontSize: 20, fontWeight: '800', color: '#1D2B53' },
  detailContent: { gap: 14, padding: 20, paddingTop: 8, paddingBottom: 28 },
  detailField: { gap: 6 },
  detailLabel: { fontSize: 14, fontWeight: '700', color: '#334155' },
  detailInput: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#F8FAFC', color: '#0F172A' },
  detailMultiline: { minHeight: 74, paddingTop: 12, textAlignVertical: 'top' },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearDateButton: { width: 36, height: 46, alignItems: 'center', justifyContent: 'center' },
  detailSelect: { minHeight: 46, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#F8FAFC' },
  detailSelectText: { flex: 1, color: '#0F172A', fontSize: 14 },
  detailPlaceholder: { flex: 1, color: '#64748B', fontSize: 14 },
  detailOptions: { overflow: 'hidden', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, backgroundColor: '#FFFFFF' },
  detailOption: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12 },
  detailOptionActive: { backgroundColor: '#1D2B53' },
  detailOptionText: { color: '#334155', fontSize: 13 },
  detailOptionTextActive: { color: '#FFFFFF', fontWeight: '700' },
  finishedRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addedDateText: { fontSize: 12, color: '#64748B' },
  detailError: { color: '#B91C1C', fontSize: 13, fontWeight: '600' },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  detailCancelButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#E2E8F0' },
  detailCancelText: { color: '#334155', fontWeight: '700' },
  detailSaveButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#1D2B53' },
  detailSaveText: { color: '#FFFFFF', fontWeight: '700' },
  detailDateBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  detailDateModal: { width: '100%', maxWidth: 380, padding: 12, borderRadius: 16, backgroundColor: '#FFFFFF' },
  datePickerClose: { alignSelf: 'flex-end', padding: 10 },
});
