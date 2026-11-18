/** Basic email check: something@something.tld */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value ?? '').trim());
}

/**
 * Password rules shown live under the field on the sign-up screen.
 * Keep this list in sync with whatever the auth provider enforces.
 */
export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { key: 'lower', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { key: 'number', label: 'One number', test: (value) => /\d/.test(value) },
];

export function isStrongPassword(value) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}
