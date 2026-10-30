import { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '@/lib/api';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppTypography';
import { useAppTheme, useThemeStyles } from '@/theme/ThemeProvider';

export default function LoginScreen() {
	const { colors } = useAppTheme();
	const styles = useThemeStyles(createStyles);
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleLogin = async () => {
		if (!email.trim() || !password.trim()) {
			setErrorMessage('Harap isi semua kolom.');
			return;
		}

		setIsLoading(true);
		setErrorMessage(null);
		try {
			await login(email.trim(), password);
			router.replace('/todo');
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Email atau kata sandi tidak valid.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<Text style={styles.title}>Selamat Datang</Text>
				<Text style={styles.subtitle}>Masuk untuk melanjutkan dan mengelola tugas harian Anda.</Text>
				{errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
				<TextInput
					style={styles.input}
					placeholder="nama@email.com"
					keyboardType="email-address"
					autoCapitalize="none"
					value={email}
					onChangeText={setEmail}
				/>
				<TextInput
					style={styles.input}
					placeholder="Masukkan kata sandi"
					secureTextEntry
					value={password}
					onChangeText={setPassword}
				/>
				<TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
					{isLoading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.buttonText}>Masuk</Text>}
				</TouchableOpacity>
				<TouchableOpacity onPress={() => router.push('/register')}>
					<Text style={styles.register}>Belum punya akun? Daftar Sekarang</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const createStyles = (colors: import('@/theme/ThemeProvider').AppThemeColors) => StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.background },
	container: { flex: 1, justifyContent: 'center', width: '90%', alignSelf: 'center', gap: 16 },
	title: { fontSize: 26, fontWeight: '800', color: colors.text },
	subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 12 },
	error: { color: colors.danger, fontWeight: '600' },
	input: { height: 52, borderRadius: 14, backgroundColor: colors.inputBackground, paddingHorizontal: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
	button: { height: 52, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
	buttonText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
	register: { textAlign: 'center', color: colors.primary, fontWeight: '700', marginTop: 16 },
});