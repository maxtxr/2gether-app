import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    if (!name.trim() || !email.trim() || password.length < 4) {
      return Alert.alert('Missing details', 'Enter your name, email and a password (4+ characters).');
    }
    signUp(name.trim(), email.trim());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Logo size={90} />
      <Text style={styles.brand}>2GETHER</Text>
      <Text style={styles.title}>CREATE ACCOUNT</Text>

      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" placeholderTextColor="#8A938D" />
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter your email"
        placeholderTextColor="#8A938D" autoCapitalize="none" keyboardType="email-address" />
      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Create a password"
        placeholderTextColor="#8A938D" secureTextEntry />

      <Button title="Create Account" onPress={submit} style={{ marginTop: 24 }} />

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Already have an account? </Text>
        <Pressable onPress={() => navigation.navigate('Login')} accessibilityRole="button">
          <Text style={styles.switchLink}>Login</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.green },
  content: { padding: 28, paddingTop: 70 },
  brand: { color: '#fff', fontWeight: '800', letterSpacing: 2, textAlign: 'center', marginTop: 10 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', marginVertical: 20 },
  label: { color: '#fff', fontWeight: '700', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: colors.input, borderRadius: 12, padding: 14, fontSize: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: '#fff' },
  switchLink: { color: '#fff', fontWeight: '800', textDecorationLine: 'underline' },
});
