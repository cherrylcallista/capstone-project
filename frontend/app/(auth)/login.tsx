import { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '@/lib/api';

export default function LoginScreen() {
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
					{isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Masuk</Text>}
				</TouchableOpacity>
				<TouchableOpacity onPress={() => router.push('/register')}>
					<Text style={styles.register}>Belum punya akun? Daftar Sekarang</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
	container: { flex: 1, justifyContent: 'center', width: '90%', alignSelf: 'center', gap: 16 },
	title: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
	subtitle: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 12 },
	error: { color: '#B91C1C', fontWeight: '600' },
	input: { height: 52, borderRadius: 14, backgroundColor: '#F3F4F6', paddingHorizontal: 14, fontSize: 15 },
	button: { height: 52, borderRadius: 14, backgroundColor: '#1D2B53', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
	buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
	register: { textAlign: 'center', color: '#1D2B53', fontWeight: '700', marginTop: 16 },
});