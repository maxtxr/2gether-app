import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme';
import { Button, Chip } from '../../components';

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair friendly',
  'Flat terrain',
  'Low intensity',
  'All ages',
  'Equipment provided',
];

export default function EditProfileModal({
  visible,
  onClose,
  onSave,
  saving,
  initialData,
  categories = [],
}) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [accessibility, setAccessibility] = useState([]);

  useEffect(() => {
    if (visible) {
      setName(initialData?.name || '');
      setBio(initialData?.bio || '');
      setInterests(initialData?.interests || []);
      setAccessibility(initialData?.accessibility || []);
    }
  }, [visible, initialData]);

  const toggleItem = (list, setList, item) => {
    setList((prev = []) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSave = () => {
    onSave({
      name: name.trim() || initialData?.name || '',
      bio: bio.trim(),
      interests,
      accessibility,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            hitSlop={10}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.headerSaveText, saving && { color: colors.muted }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Bio</Text>
              <Text style={styles.charCount}>{bio.length}/160</Text>
            </View>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={(text) => bio.length <= 160 && setBio(text)}
              placeholder="E.g. Student, just bought my first padel racket..."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={160}
            />
          </View>

          {/* Sports & Interests */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Interests & Sports</Text>
              <Text style={styles.charCount}>{interests.length} selected</Text>
            </View>
            <View style={styles.wrap}>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={interests.includes(cat)}
                  onPress={() => toggleItem(interests, setInterests, cat)}
                />
              ))}
            </View>
          </View>

          {/* Accessibility Preferences */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Accessibility & Preferences</Text>
              <Text style={styles.charCount}>{accessibility.length} selected</Text>
            </View>
            <Text style={styles.helpText}>
              Organizers will see these when you sign up for their events.
            </Text>
            <View style={styles.wrap}>
              {ACCESSIBILITY_OPTIONS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={accessibility.includes(item)}
                  onPress={() => toggleItem(accessibility, setAccessibility, item)}
                />
              ))}
            </View>
          </View>

          <Button
            title={saving ? 'Saving Changes...' : 'Save Changes'}
            onPress={handleSave}
            loading={saving}
            variant="primary"
            style={{ marginTop: 10 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || '#E5E7EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.green || '#16A34A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  charCount: {
    fontSize: 12,
    color: colors.muted,
  },
  helpText: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: radii.sm || 8,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
});