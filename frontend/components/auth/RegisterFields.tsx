import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

type RegisterFieldsProps = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
};

function RegisterField({
  label,
  icon,
  value,
  placeholder,
  onChange,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  trailing,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  trailing?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color={colors.textMuted} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChange}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {trailing}
      </View>
    </View>
  );
}

export function RegisterFields({
  username,
  email,
  password,
  confirmPassword,
  showPassword,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
}: RegisterFieldsProps) {
  const { colors } = useAppTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <>
      <RegisterField
        label="Nama Lengkap"
        icon="person-outline"
        value={username}
        placeholder="Cherryl Callista"
        onChange={onUsernameChange}
      />
      <RegisterField
        label="Email"
        icon="mail-outline"
        value={email}
        placeholder="cherry@gmail.com"
        onChange={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <RegisterField
        label="Kata Sandi"
        icon="lock-closed-outline"
        value={password}
        placeholder="Minimal 6 karakter"
        onChange={onPasswordChange}
        secureTextEntry={!showPassword}
        trailing={
          <TouchableOpacity activeOpacity={0.7} onPress={onTogglePassword} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        }
      />
      <RegisterField
        label="Konfirmasi Kata Sandi"
        icon="shield-checkmark-outline"
        value={confirmPassword}
        placeholder="Ulangi kata sandi"
        onChange={onConfirmPasswordChange}
        secureTextEntry={!showPassword}
      />
    </>
  );
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBackground, borderRadius: 14, paddingHorizontal: 14, height: 52 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text, height: '100%' },
  eyeIcon: { padding: 6 },
});
