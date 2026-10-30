import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type CategoryCreatorProps = {
  value: string;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
};

export function CategoryCreator({ value, isSaving, onChange, onSave }: CategoryCreatorProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tambahkan kategori baru</Text>
      <View>
        <TextInput
          style={styles.input}
          placeholder="Masukkan teks..."
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChange}
          maxLength={30}
          autoFocus
        />
        <Text style={styles.count}>{value.length}/30</Text>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={isSaving}>
        <Text style={styles.saveText}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  container: { gap: 8, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface },
  label: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  input: { height: 54, borderRadius: 10, backgroundColor: colors.inputBackground, paddingHorizontal: 14, paddingRight: 58, color: colors.text, fontSize: 16 },
  count: { position: 'absolute', right: 10, bottom: 7, color: colors.textMuted, fontSize: 11 },
  saveButton: { alignSelf: 'flex-end', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.primary },
  saveText: { color: colors.onPrimary, fontWeight: '700' },
});
