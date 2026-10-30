import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type MonthYearPickerModalProps = {
  visible: boolean;
  months: string[];
  selectedYear: number;
  yearRangeStart: number;
  onYearChange: (year: number) => void;
  onYearRangeChange: (year: number) => void;
  onSelectMonth: (monthIndex: number) => void;
  onClose: () => void;
};

export function MonthYearPickerModal({
  visible,
  months,
  selectedYear,
  yearRangeStart,
  onYearChange,
  onYearRangeChange,
  onSelectMonth,
  onClose,
}: MonthYearPickerModalProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={onClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Pilih bulan dan tahun</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Tutup pemilih tanggal">
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.yearRangeHeader}>
            <TouchableOpacity
              style={styles.yearRangeButton}
              onPress={() => onYearRangeChange(yearRangeStart - 10)}
              accessibilityLabel="Rentang tahun sebelumnya"
            >
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.yearRangeText}>{yearRangeStart}–{yearRangeStart + 9}</Text>
            <TouchableOpacity
              style={styles.yearRangeButton}
              onPress={() => onYearRangeChange(yearRangeStart + 10)}
              accessibilityLabel="Rentang tahun berikutnya"
            >
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.yearGrid}>
            {Array.from({ length: 10 }, (_, index) => yearRangeStart + index).map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.yearOption, selectedYear === year && styles.selectedOption]}
                onPress={() => onYearChange(year)}
              >
                <Text style={[styles.optionText, selectedYear === year && styles.selectedText]}>{year}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {months.map((month, index) => (
              <TouchableOpacity key={month} style={styles.monthOption} onPress={() => onSelectMonth(index)}>
                <Text style={styles.monthText}>{month.slice(0, 3)}</Text>
              </TouchableOpacity>
            ))}
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
  yearRangeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  yearRangeButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.surfaceSecondary },
  yearRangeText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  yearOption: { width: '18%', minHeight: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.inputBackground },
  selectedOption: { backgroundColor: colors.primary },
  optionText: { fontSize: 12, color: colors.textSecondary },
  selectedText: { color: colors.onPrimary, fontWeight: '700' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthOption: { width: '22%', minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.surfaceSecondary },
  monthText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
