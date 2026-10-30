import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type TimerSetupModalProps = {
  visible: boolean;
  isEditing: boolean;
  hours: string;
  minutes: string;
  seconds: string;
  hasRestPeriod: boolean;
  restMinutes: string;
  error: string | null;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  onSecondsChange: (value: string) => void;
  onHasRestChange: (value: boolean) => void;
  onRestMinutesChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

function limitNumericInput(value: string, max: number) {
  const digits = value.replace(/\D/g, '').slice(0, 2);
  return digits ? String(Math.min(Number(digits), max)) : '';
}

export function TimerSetupModal({
  visible,
  isEditing,
  hours,
  minutes,
  seconds,
  hasRestPeriod,
  restMinutes,
  error,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
  onHasRestChange,
  onRestMinutesChange,
  onClose,
  onConfirm,
}: TimerSetupModalProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={onClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            {isEditing ? <Text style={styles.title}>Edit timer</Text> : <View />}
            <TouchableOpacity onPress={onClose} accessibilityLabel="Tutup form timer">
              <Ionicons name="close-circle" size={30} color={colors.danger} />
            </TouchableOpacity>
          </View>

          <View style={styles.center}>
            <View style={styles.durationFace}>
              <TextInput
                style={styles.durationDigit}
                value={hours}
                onChangeText={(value) => onHoursChange(limitNumericInput(value, 99))}
                keyboardType="number-pad"
                placeholder="00"
                maxLength={2}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Jam timer"
              />
              <Text style={styles.durationColon}>:</Text>
              <TextInput
                style={styles.durationDigit}
                value={minutes}
                onChangeText={(value) => onMinutesChange(limitNumericInput(value, 59))}
                keyboardType="number-pad"
                placeholder="00"
                maxLength={2}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Menit timer"
              />
              <Text style={styles.durationColon}>:</Text>
              <TextInput
                style={styles.durationDigit}
                value={seconds}
                onChangeText={(value) => onSecondsChange(limitNumericInput(value, 59))}
                keyboardType="number-pad"
                placeholder="00"
                maxLength={2}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Detik timer"
              />
            </View>
            <View style={styles.unitRow}>
              <Text style={styles.unitLabel}>jam</Text>
              <Text style={styles.unitLabel}>menit</Text>
              <Text style={styles.unitLabel}>detik</Text>
            </View>
          </View>

          <View style={styles.restRow}>
            <View style={styles.restLabelGroup}>
              <Text style={styles.formLabel}>Rest period</Text>
            </View>
            <Switch
              value={hasRestPeriod}
              onValueChange={onHasRestChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={hasRestPeriod ? colors.onPrimary : colors.surface}
            />
            {hasRestPeriod && (
              <TextInput
                style={styles.restInput}
                value={restMinutes}
                onChangeText={(value) => onRestMinutesChange(limitNumericInput(value, 60))}
                keyboardType="number-pad"
                placeholder="0"
                maxLength={2}
                accessibilityLabel="Durasi rest period, maksimum 60 menit"
              />
            )}
            {hasRestPeriod && <Text style={styles.restUnit}>min</Text>}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Ionicons name="add" size={22} color={colors.onPrimary} />
            <Text style={styles.confirmText}>{isEditing ? 'Save changes' : 'Confirm'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.overlay },
  dismiss: { ...StyleSheet.absoluteFill },
  modal: { width: '100%', maxWidth: 420, height: '90%', maxHeight: 680, justifyContent: 'space-between', padding: 22, borderRadius: 18, backgroundColor: colors.surface, elevation: 8, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', color: colors.primary },
  formLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  durationFace: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  durationDigit: { width: 84, padding: 0, fontSize: 48, fontWeight: '900', textAlign: 'center', color: colors.primary, fontVariant: ['tabular-nums'] },
  durationColon: { marginBottom: 5, fontSize: 46, fontWeight: '800', color: colors.primary },
  unitRow: { width: 252, flexDirection: 'row', justifyContent: 'space-around', marginTop: 2 },
  unitLabel: { width: 82, textAlign: 'center', fontSize: 11, color: colors.textMuted },
  restRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.surfaceSecondary },
  restLabelGroup: { flex: 1 },
  restInput: { width: 48, height: 34, borderRadius: 5, backgroundColor: colors.inputBackground, textAlign: 'center', color: colors.text },
  restUnit: { marginLeft: -5, fontSize: 11, color: colors.textMuted },
  error: { marginTop: 12, color: colors.danger, fontSize: 13, fontWeight: '600' },
  confirmButton: { width: 154, minHeight: 50, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '18%', borderRadius: 12, backgroundColor: colors.primary },
  confirmText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
});
