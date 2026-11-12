import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';
import { Logo, Button } from '../components';
import { useApp } from '../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const passwordInputRef = useRef(null);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    // Basic format validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setError('');
    try {
      setIsSubmitting(true);
      login(trimmedEmail);
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <Logo size={84} />
          <Text style={styles.brandTitle}>2GETHR</Text>
          <Text style={styles.screenHeading}>LOGIN</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              placeholder="Enter your email"
              placeholderTextColor="#8A938D"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              accessibilityLabel="Email input"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={passwordInputRef}
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              placeholder="Enter your password"
              placeholderTextColor="#8A938D"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Password input"
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeIcon}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#6C757D"
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => setNote('A reset link will be sent to your email.')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Forgot password button"
          >
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>

          {note ? <Text style={styles.note}>{note}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Login"
            onPress={handleLogin}
            loading={isSubmitting}
            variant="primary"
            style={styles.submitBtn}
          />
        </View>

        {/* Footer Link: Prominent CTA to resolve Scenario 1 testing feedback */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <Pressable
            onPress={() => navigation.navigate('SignUp')}
            accessibilityRole="button"
            accessibilityLabel="Sign up for an account"
            hitSlop={6}
          >
            <Text style={styles.switchLink}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.green,
  },
  container: {
    flex: 1,
    backgroundColor: colors.green,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 2,
    marginTop: spacing.md,
  },
  screenHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: spacing.xs,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginTop: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: colors.text,
  },
  passwordInput: {
    paddingRight: spacing.sm,
  },
  eyeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgot: {
    color: '#E0E7E3',
    textDecorationLine: 'underline',
    textAlign: 'right',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontSize: 13,
  },
  error: {
    color: '#FFFFFF',
    backgroundColor: colors.danger,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  note: {
    color: '#E0E7E3',
    fontSize: 13,
    marginTop: spacing.sm,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  switchText: {
    color: '#D1E0D7',
    fontSize: 14,
  },
  switchLink: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});