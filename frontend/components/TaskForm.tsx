import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { useRouter } from 'expo-router';
import { createTask, createTaskCategory } from '@/lib/api';
import type { TaskType } from '@/lib/types';

const MATRIX_OPTIONS = [
  { value: 1, label: 'Penting dan Mendesak' },
  { value: 2, label: 'Penting, namun Tidak Mendesak' },
  { value: 3, label: 'Tidak Penting, namun Mendesak' },
  { value: 4, label: 'Tidak Penting dan Tidak Mendesak' },
];
const REPEAT_OPTIONS = [
  { value: '', label: 'Tidak berulang' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'yearly', label: 'Tahunan' },
];

type TaskFormProps = {
  visible: boolean;
  fromCalendar?: boolean;
  initialDate?: string | null;
  categories: string[];
  onClose: () => void;
  onSaved: (task: TaskType) => void;
  onCategoryCreated: (category: string) => void;
};

type DropdownProps = {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  onCreateCategory?: () => void;
};

function Dropdown({ label, value, placeholder, options, onChange, onCreateCategory }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen((current) => !current)}>
        <Text style={selected ? styles.dropdownText : styles.placeholderText}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value || 'none'}
              style={[styles.dropdownOption, option.value === value && styles.dropdownOptionActive]}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <Text style={[styles.dropdownOptionText, option.value === value && styles.dropdownOptionTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          {onCreateCategory && (
            <TouchableOpacity
              style={styles.createCategoryOption}
              onPress={() => {
                onCreateCategory();
                setOpen(false);
              }}
            >
              <Ionicons name="add" size={18} color="#1D2B53" />
              <Text style={styles.createCategoryOptionText}>Buat kategori</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export function TaskForm({
  visible,
  fromCalendar = false,
  initialDate = null,
  categories,
  onClose,
  onSaved,
  onCategoryCreated,
}: TaskFormProps) {
  const router = useRouter();
  const [detail, setDetail] = useState('');
  const [dueDate, setDueDate] = useState(initialDate ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [matrix, setMatrix] = useState('');
  const [repeatEvery, setRepeatEvery] = useState('');
  const [isTodo, setIsTodo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setDueDate(initialDate ?? '');
  }, [initialDate, visible]);

  const reset = () => {
    setDetail('');
    setDueDate(initialDate ?? '');
    setShowDatePicker(false);
    setCategory('');
    setCategoryDraft('');
    setIsCreatingCategory(false);
    setMatrix('');
    setRepeatEvery('');
    setIsTodo(true);
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (!isSaving && !isSavingCategory) {
      reset();
      onClose();
    }
  };

  const handleSaveCategory = async () => {
    const name = categoryDraft.trim();
    if (!name) {
      setErrorMessage('Nama kategori wajib diisi.');
      return;
    }
    if (name.toLowerCase() === 'semua') {
      setErrorMessage('Nama kategori "Semua" sudah dipakai.');
      return;
    }

    setIsSavingCategory(true);
    setErrorMessage(null);
    try {
      const result = await createTaskCategory(name);
      onCategoryCreated(result.category);
      setCategory(result.category);
      setCategoryDraft('');
      setIsCreatingCategory(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Kategori gagal disimpan.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSave = async () => {
    if (!detail.trim()) {
      setErrorMessage('Detail tugas wajib diisi.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const task = await createTask({
        detail: detail.trim(),
        dueDate: dueDate || null,
        markedAsFinished: false,
        repeatTask: Boolean(repeatEvery),
        repeatEvery: repeatEvery || null,
        category,
        ...(matrix ? { matrix: Number(matrix) } : {}),
        isTodo: fromCalendar ? isTodo : true,
      });
      onSaved(task);
      reset();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tugas gagal disimpan.';
      if (message.includes('Silakan login kembali')) {
        reset();
        onClose();
        router.replace('/login');
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>{fromCalendar ? 'Tambah acara' : 'Tambah tugas'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan teks..."
              placeholderTextColor="#94A3B8"
              value={detail}
              onChangeText={setDetail}
              autoFocus
            />

            <Text style={styles.label}>Due date</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowDatePicker(true)}>
              <Text style={dueDate ? styles.dropdownText : styles.placeholderText}>
                {dueDate || 'Pilih tanggal'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#64748B" />
            </TouchableOpacity>

            <Dropdown
              label="Kategori"
              value={category}
              placeholder="Semua"
              options={[
                { value: '', label: 'Semua' },
                ...categories.map((option) => ({ value: option, label: option })),
              ]}
              onChange={setCategory}
              onCreateCategory={() => {
                setCategoryDraft('');
                setIsCreatingCategory(true);
                setErrorMessage(null);
              }}
            />
            {isCreatingCategory && (
              <View style={styles.categoryCreator}>
                <Text style={styles.label}>Tambahkan kategori baru</Text>
                <View>
                  <TextInput
                    style={styles.categoryInput}
                    placeholder="Masukkan teks..."
                    placeholderTextColor="#94A3B8"
                    value={categoryDraft}
                    onChangeText={setCategoryDraft}
                    maxLength={30}
                    autoFocus
                  />
                  <Text style={styles.categoryCount}>{categoryDraft.length}/30</Text>
                </View>
                <TouchableOpacity
                  style={styles.categorySaveButton}
                  onPress={handleSaveCategory}
                  disabled={isSavingCategory}
                >
                  <Text style={styles.saveText}>{isSavingCategory ? 'Menyimpan...' : 'Simpan'}</Text>
                </TouchableOpacity>
              </View>
            )}
            <Dropdown
              label="Kuadran matriks (opsional)"
              value={matrix}
              placeholder="Tidak dimasukkan ke matriks"
              options={MATRIX_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
              onChange={setMatrix}
            />
            <Dropdown
              label="Tugas berulang"
              value={repeatEvery}
              placeholder="Tidak berulang"
              options={REPEAT_OPTIONS}
              onChange={setRepeatEvery}
            />

            {fromCalendar && (
              <View style={styles.switchRow}>
                <Text style={styles.label}>Masukkan juga ke Todo</Text>
                <Switch value={isTodo} onValueChange={setIsTodo} trackColor={{ false: '#CBD5E1', true: '#1D2B53' }} />
              </View>
            )}

            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={isSaving}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
                <Text style={styles.saveText}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.dateModalBackdrop}>
          <View style={styles.dateModal}>
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
            <TouchableOpacity style={styles.closeDateButton} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.cancelText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  dismiss: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  sheet: { maxHeight: '88%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  content: { padding: 20, gap: 12 },
  heading: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  input: { minHeight: 48, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14, color: '#0F172A' },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#334155' },
  dropdown: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14 },
  dropdownText: { color: '#0F172A', flex: 1 },
  placeholderText: { color: '#94A3B8', flex: 1 },
  dropdownMenu: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  dropdownOption: { padding: 12 },
  dropdownOptionActive: { backgroundColor: '#1D2B53' },
  dropdownOptionText: { color: '#334155', fontSize: 13 },
  dropdownOptionTextActive: { color: '#FFFFFF', fontWeight: '700' },
  createCategoryOption: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  createCategoryOptionText: { color: '#1D2B53', fontSize: 14, fontWeight: '700' },
  categoryCreator: { gap: 8, padding: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, backgroundColor: '#FFFFFF' },
  categoryInput: { height: 54, borderRadius: 10, backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingRight: 58, color: '#0F172A', fontSize: 16 },
  categoryCount: { position: 'absolute', right: 10, bottom: 7, color: '#64748B', fontSize: 11 },
  categorySaveButton: { alignSelf: 'flex-end', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, backgroundColor: '#1D2B53' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  error: { color: '#B91C1C', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelButton: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#E2E8F0' },
  cancelText: { color: '#334155', fontWeight: '700' },
  saveButton: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#1D2B53' },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  dateModalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  dateModal: { width: '90%', borderRadius: 18, padding: 12, backgroundColor: '#FFFFFF' },
  closeDateButton: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 10 },
});
