import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { TaskFormFields } from '@/components/TaskFormFields';
import { DatePickerModal } from '@/components/DatePickerModal';
import { useRouter } from 'expo-router';
import { createTask, createTaskCategory } from '@/lib/api';
import type { TaskType } from '@/lib/types';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type TaskFormProps = {
  visible: boolean;
  fromCalendar?: boolean;
  initialDate?: string | null;
  categories: string[];
  onClose: () => void;
  onSaved: (task: TaskType) => void;
  onCategoryCreated: (category: string) => void;
};

export function TaskForm({
  visible,
  fromCalendar = false,
  initialDate = null,
  categories,
  onClose,
  onSaved,
  onCategoryCreated,
}: TaskFormProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
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
            <TaskFormFields
              fromCalendar={fromCalendar}
              detail={detail}
              dueDate={dueDate}
              category={category}
              categories={categories}
              categoryDraft={categoryDraft}
              isCreatingCategory={isCreatingCategory}
              isSavingCategory={isSavingCategory}
              matrix={matrix}
              repeatEvery={repeatEvery}
              isTodo={isTodo}
              isSaving={isSaving}
              errorMessage={errorMessage}
              onDetailChange={setDetail}
              onOpenDatePicker={() => setShowDatePicker(true)}
              onCategoryChange={setCategory}
              onCreateCategory={() => {
                setCategoryDraft('');
                setIsCreatingCategory(true);
                setErrorMessage(null);
              }}
              onCategoryDraftChange={setCategoryDraft}
              onSaveCategory={handleSaveCategory}
              onMatrixChange={setMatrix}
              onRepeatChange={setRepeatEvery}
              onTodoChange={setIsTodo}
              onCancel={handleClose}
              onSave={handleSave}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={showDatePicker}
        value={dueDate}
        onChange={(date) => {
          setDueDate(date);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  dismiss: { flex: 1, backgroundColor: colors.overlay },
  sheet: { maxHeight: '88%', backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  content: { padding: 20, gap: 12 },
});
