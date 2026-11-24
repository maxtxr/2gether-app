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
import { isValidEmail, isStrongPassword, PASSWORD_RULES } from '../utils/validation';

export default function SignUpScreen({ navigation }) {
  const { signUp, showFeedback } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleSignUp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!isStrongPassword(password)) {
      setError('Please satisfy all password requirements.');
      return;
    }

    setError('');

    try {
      setIsSubmitting(true);

      await signUp(trimmedName, trimmedEmail, password);

      showFeedback({
        title: 'Account created!',
        message: 'Your account was created successfully. Please log in.',
        variant: 'success',
        confirmText: 'Log in',
        onConfirm: () => navigation.navigate('Login'),
      });
    } catch (err) {
      console.error('Signup error:', err);

      const raw = err?.message || '';
      const alreadyRegistered = /already registered|already exists/i.test(raw);

      showFeedback({
        title: alreadyRegistered ? 'Account already exists' : 'Could not create account',
        message: alreadyRegistered
          ? 'An account with this email already exists. Try logging in instead.'
          : raw || 'Could not create account. Please try again.',
        variant: alreadyRegistered ? 'warning' : 'danger',
      });
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
          <Text style={styles.brandTitle}>2GETHER</Text>
          <Text style={styles.screenHeading}>CREATE ACCOUNT</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(v) => { setName(v); setError(''); }}
              placeholder="Enter your name"
              placeholderTextColor="#8A938D"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
              accessibilityLabel="Full name input"
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={emailInputRef}
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
              accessibilityLabel="Email address input"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={passwordInputRef}
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              placeholder="Create a password"
              placeholderTextColor="#8A938D"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
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

          {/* Live Password Rules */}
          <View style={styles.rulesContainer}>
            {PASSWORD_RULES.map((rule) => {
              const satisfied = rule.test(password);
              return (
                <View key={rule.key} style={styles.ruleRow}>
                  <Ionicons
                    name={satisfied ? 'checkmark-circle' : 'ellipse-outline'}
                    size={15}
                    color={satisfied ? '#A3E635' : '#D1E0D7'}
                    style={styles.ruleIcon}
                  />
                  <Text
                    style={[
                      styles.ruleText,
                      satisfied ? styles.ruleTextPassed : styles.ruleTextPending,
                    ]}
                  >
                    {rule.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={isSubmitting}
            variant="primary"
            style={styles.submitBtn}
          />
        </View>

        {/* Switch back to Login */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            accessibilityLabel="Navigate to Login screen"
            hitSlop={6}
          >
            <Text style={styles.switchLink}>Login</Text>
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
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
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
  rulesContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleIcon: {
    marginRight: spacing.xs + 2,
  },
  ruleText: {
    fontSize: 12.5,
  },
  ruleTextPending: {
    color: '#D1E0D7',
  },
  ruleTextPassed: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  submitBtn: {
    marginTop: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
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