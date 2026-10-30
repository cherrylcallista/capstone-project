import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { AppText as Text } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type DatePickerModalProps = {
  visible: boolean;
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
};

export function DatePickerModal({ visible, value, onChange, onClose }: DatePickerModalProps) {
  const { colors, mode } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Calendar
            key={mode}
            current={value || undefined}
            onDayPress={(day: DateData) => onChange(day.dateString)}
            markedDates={value ? { [value]: { selected: true, selectedColor: colors.primary } } : undefined}
            enableSwipeMonths
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              dayTextColor: colors.text,
              textDisabledColor: colors.textMuted,
              monthTextColor: colors.text,
              arrowColor: colors.primary,
              todayTextColor: colors.primary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.onPrimary,
            }}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.overlay },
  modal: { width: '100%', maxWidth: 380, padding: 12, borderRadius: 16, backgroundColor: colors.surface },
  closeButton: { alignSelf: 'flex-end', padding: 10 },
  closeText: { color: colors.text, fontWeight: '700' },
});
