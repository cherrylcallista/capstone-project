import React from 'react';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppTypography';
import { CategoryCreator } from '@/components/CategoryCreator';
import { FormDropdown } from '@/components/FormDropdown';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

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

type TaskFormFieldsProps = {
  fromCalendar: boolean;
  detail: string;
  dueDate: string;
  category: string;
  categories: string[];
  categoryDraft: string;
  isCreatingCategory: boolean;
  isSavingCategory: boolean;
  matrix: string;
  repeatEvery: string;
  isTodo: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onDetailChange: (detail: string) => void;
  onOpenDatePicker: () => void;
  onCategoryChange: (category: string) => void;
  onCreateCategory: () => void;
  onCategoryDraftChange: (draft: string) => void;
  onSaveCategory: () => void;
  onMatrixChange: (matrix: string) => void;
  onRepeatChange: (repeat: string) => void;
  onTodoChange: (isTodo: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function TaskFormFields({
  fromCalendar,
  detail,
  dueDate,
  category,
  categories,
  categoryDraft,
  isCreatingCategory,
  isSavingCategory,
  matrix,
  repeatEvery,
  isTodo,
  isSaving,
  errorMessage,
  onDetailChange,
  onOpenDatePicker,
  onCategoryChange,
  onCreateCategory,
  onCategoryDraftChange,
  onSaveCategory,
  onMatrixChange,
  onRepeatChange,
  onTodoChange,
  onCancel,
  onSave,
}: TaskFormFieldsProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <>
      <Text style={styles.heading}>{fromCalendar ? 'Tambah acara' : 'Tambah tugas'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Masukkan teks..."
        placeholderTextColor={colors.textMuted}
        value={detail}
        onChangeText={onDetailChange}
        autoFocus
      />

      <Text style={styles.label}>Due date</Text>
      <TouchableOpacity style={styles.dropdown} onPress={onOpenDatePicker}>
        <Text style={dueDate ? styles.dropdownText : styles.placeholderText}>
          {dueDate || 'Pilih tanggal'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <FormDropdown
        label="Kategori"
        value={category}
        placeholder="Semua"
        options={[
          { value: '', label: 'Semua' },
          ...categories.map((option) => ({ value: option, label: option })),
        ]}
        onChange={onCategoryChange}
        onCreateAction={onCreateCategory}
      />
      {isCreatingCategory && (
        <CategoryCreator
          value={categoryDraft}
          isSaving={isSavingCategory}
          onChange={onCategoryDraftChange}
          onSave={onSaveCategory}
        />
      )}
      <FormDropdown
        label="Kuadran matriks (opsional)"
        value={matrix}
        placeholder="Tidak dimasukkan ke matriks"
        options={MATRIX_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))}
        onChange={onMatrixChange}
      />
      <FormDropdown
        label="Tugas berulang"
        value={repeatEvery}
        placeholder="Tidak berulang"
        options={REPEAT_OPTIONS}
        onChange={onRepeatChange}
      />

      {fromCalendar && (
        <View style={styles.switchRow}>
          <Text style={styles.label}>Masukkan juga ke Todo</Text>
          <Switch value={isTodo} onValueChange={onTodoChange} trackColor={{ false: colors.border, true: colors.primary }} />
        </View>
      )}

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isSaving}>
          <Text style={styles.cancelText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={isSaving}>
          <Text style={styles.saveText}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  input: { minHeight: 48, borderRadius: 12, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text },
  label: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  dropdown: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  dropdownText: { color: colors.text, flex: 1 },
  placeholderText: { color: colors.textMuted, flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  error: { color: colors.danger, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelButton: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: colors.surfaceSecondary },
  cancelText: { color: colors.textSecondary, fontWeight: '700' },
  saveButton: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: colors.primary },
  saveText: { color: colors.onPrimary, fontWeight: '700' },
});
