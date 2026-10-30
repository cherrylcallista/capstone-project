import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

export type FormDropdownOption = {
  value: string;
  label: string;
};

type FormDropdownProps = {
  label: string;
  value: string;
  placeholder: string;
  options: FormDropdownOption[];
  onChange: (value: string) => void;
  onCreateAction?: () => void;
};

export function FormDropdown({
  label,
  value,
  placeholder,
  options,
  onChange,
  onCreateAction,
}: FormDropdownProps) {
  const [open, setOpen] = useState(false);
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={selected ? styles.dropdownText : styles.placeholderText}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
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
          {onCreateAction && (
            <TouchableOpacity
              style={styles.createOption}
              onPress={() => {
                onCreateAction();
                setOpen(false);
              }}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.createOptionText}>Buat kategori</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  dropdown: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  dropdownText: { color: colors.text, flex: 1 },
  placeholderText: { color: colors.textMuted, flex: 1 },
  dropdownMenu: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface },
  dropdownOption: { padding: 12 },
  dropdownOptionActive: { backgroundColor: colors.primary },
  dropdownOptionText: { color: colors.textSecondary, fontSize: 13 },
  dropdownOptionTextActive: { color: colors.onPrimary, fontWeight: '700' },
  createOption: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  createOptionText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
