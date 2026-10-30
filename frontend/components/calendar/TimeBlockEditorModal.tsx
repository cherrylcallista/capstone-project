import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppTypography';
import { formatDuration, formatTime } from '@/lib/calendarUtils';
import type { ScheduleBlockType } from '@/lib/types';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type TimeBlockEditorModalProps = {
  visible: boolean;
  editingBlock: ScheduleBlockType | null;
  slot: { date: string; hour: number } | null;
  label: string;
  color: string;
  durationHours: number;
  colors: string[];
  error: string;
  isSaving: boolean;
  onLabelChange: (label: string) => void;
  onColorChange: (color: string) => void;
  onDurationChange: (duration: number) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
};

export function TimeBlockEditorModal({
  visible,
  editingBlock,
  slot,
  label,
  color,
  durationHours,
  colors: paletteColors,
  error,
  isSaving,
  onLabelChange,
  onColorChange,
  onDurationChange,
  onClose,
  onDelete,
  onSave,
}: TimeBlockEditorModalProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={onClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{editingBlock ? 'Edit time block' : 'Tambah time block'}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Tutup editor jadwal">
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.slot}>
            {slot && new Date(`${slot.date}T12:00:00`).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            {slot && ` · mulai ${formatTime(slot.hour)}`}
          </Text>
          <Text style={styles.fieldLabel}>Durasi</Text>
          <View style={styles.durationPicker}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => onDurationChange(Math.max(0.5, durationHours - 0.5))}
              accessibilityLabel="Kurangi durasi"
            >
              <Ionicons name="remove" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.durationValue}>{formatDuration(durationHours)}</Text>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => onDurationChange(Math.min(24 - (slot?.hour ?? 0), durationHours + 0.5))}
              accessibilityLabel="Tambah durasi"
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldLabel}>Label kegiatan</Text>
          <TextInput
            style={styles.labelInput}
            value={label}
            onChangeText={onLabelChange}
            placeholder="Contoh: Belajar, bekerja, istirahat"
            placeholderTextColor={colors.textMuted}
            maxLength={60}
            autoFocus
          />
          <Text style={styles.fieldLabel}>Warna</Text>
          <View style={styles.colorPalette}>
            {paletteColors.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.colorOption, { backgroundColor: option }, color === option && styles.colorOptionSelected]}
                onPress={() => onColorChange(option)}
                accessibilityLabel={`Pilih warna ${option}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: color === option }}
              >
                {color === option && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </TouchableOpacity>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            {editingBlock && (
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete} disabled={isSaving}>
                <Text style={styles.deleteText}>Hapus</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={isSaving}>
              <Text style={styles.saveText}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.overlay },
  dismiss: { ...StyleSheet.absoluteFill },
  modal: { width: '100%', maxWidth: 420, padding: 18, borderRadius: 16, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', color: colors.primary },
  slot: { marginBottom: 16, fontSize: 13, fontWeight: '600', color: colors.textMuted },
  fieldLabel: { marginBottom: 7, fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  durationPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 5, marginBottom: 16, borderRadius: 10, backgroundColor: colors.surfaceSecondary },
  durationButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.surface },
  durationValue: { fontSize: 14, fontWeight: '800', color: colors.primary },
  labelInput: { height: 46, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.inputBackground, color: colors.text },
  colorPalette: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  colorOption: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  colorOptionSelected: { borderWidth: 3, borderColor: colors.text },
  error: { marginBottom: 12, color: colors.danger, fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  deleteButton: { marginRight: 'auto', paddingHorizontal: 12, paddingVertical: 10 },
  deleteText: { fontSize: 13, fontWeight: '700', color: colors.danger },
  cancelButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9, backgroundColor: colors.surfaceSecondary },
  cancelText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  saveButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9, backgroundColor: colors.primary },
  saveText: { fontSize: 13, fontWeight: '700', color: colors.onPrimary },
});
