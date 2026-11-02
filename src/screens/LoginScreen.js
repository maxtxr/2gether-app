import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    if (!email.trim() || !password) return Alert.alert('Missing details', 'Enter your email and password.');
    login(email.trim());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Logo size={90} />
      <Text style={styles.brand}>2GETHER</Text>
      <Text style={styles.title}>LOGIN</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email"
        placeholderTextColor="#8A938D" autoCapitalize="none" keyboardType="email-address" />
      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Enter your password"
        placeholderTextColor="#8A938D" secureTextEntry />

      <Pressable onPress={() => Alert.alert('Reset password', 'Password reset is not available yet.')}>
        <Text style={styles.forgot}>Forgot password?</Text>
      </Pressable>

      <Button title="Login" onPress={submit} style={{ marginTop: 12 }} />

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Don't have an account? </Text>
        <Pressable onPress={() => navigation.navigate('SignUp')} accessibilityRole="button">
          <Text style={styles.switchLink}>Signup</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.green },
  content: { padding: 28, paddingTop: 80, alignItems: 'stretch' },
  brand: { color: '#fff', fontWeight: '800', letterSpacing: 2, textAlign: 'center', marginTop: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginVertical: 20 },
  label: { color: '#fff', fontWeight: '700', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: colors.input, borderRadius: 12, padding: 14, fontSize: 15 },
  forgot: { color: '#fff', textDecorationLine: 'underline', textAlign: 'right', marginTop: 10, padding: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: '#fff' },
  switchLink: { color: '#fff', fontWeight: '800', textDecorationLine: 'underline' },
});
