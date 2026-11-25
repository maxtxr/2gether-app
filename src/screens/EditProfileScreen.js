import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

import { colors, radii } from '../theme';
import { EVENT_CATEGORIES, ACCESSIBILITY } from '../data/options';
import { useApp } from '../context/AppContext';
import { Avatar, Button, Chip } from '../components';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile, uploadAvatar, deleteAvatar, showFeedback } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [interests, setInterests] = useState(user?.interests || []);
  const [accessibility, setAccessibility] = useState(user?.accessibility || []);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const hasAvatar = Boolean(user?.avatarUrl || user?.avatarPath);

  // Extract all distinct sports & activities from EVENT_CATEGORIES
  const allInterests = useMemo(() => {
    if (!Array.isArray(EVENT_CATEGORIES)) return [];
    const set = new Set();
    EVENT_CATEGORIES.forEach((cat) => {
      if (cat.name && cat.name !== 'Other') set.add(cat.name);
      if (Array.isArray(cat.subcategories)) {
        cat.subcategories.forEach((sub) => set.add(sub));
      }
    });
    return Array.from(set).sort();
  }, []);

  // Filtered list based on search input
  const filteredInterests = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return allInterests;
    return allInterests.filter((item) =>
      item.toLowerCase().includes(trimmed)
    );
  }, [allInterests, searchQuery]);

  // Normalized accessibility options
  const availableAccessibility = useMemo(() => {
    if (!Array.isArray(ACCESSIBILITY)) return [];
    return ACCESSIBILITY.map((item) => (typeof item === 'string' ? item : item.name));
  }, []);

  const toggleItem = (list, setList, item) => {
    setList((prev = []) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showFeedback({
          title: 'Permission required',
          message: 'Please allow access to your photo library in your device settings.',
          variant: 'info',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploadingAvatar(true);

      const dimensions = [800, 640, 512];
      const qualities = [0.8, 0.7, 0.6, 0.5];
      let compressedImage = null;

      for (const maxDimension of dimensions) {
        const actions = [];
        const longestSide = Math.max(asset.width || 0, asset.height || 0);

        if (longestSide > maxDimension) {
          actions.push(
            (asset.width || 0) >= (asset.height || 0)
              ? { resize: { width: maxDimension } }
              : { resize: { height: maxDimension } }
          );
        }

        for (const quality of qualities) {
          const manipulated = await ImageManipulator.manipulateAsync(
            asset.uri,
            actions,
            { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
          );

          if (Platform.OS === 'web') {
            compressedImage = manipulated;
            break;
          }

          try {
            const info = await FileSystem.getInfoAsync(manipulated.uri);
            if (
              !info.exists ||
              info.size === undefined ||
              info.size <= 1024 * 1024
            ) {
              compressedImage = manipulated;
              break;
            }
          } catch {
            compressedImage = manipulated;
            break;
          }
        }
        if (compressedImage) break;
      }

      if (!compressedImage) {
        showFeedback({
          title: 'Image too large',
          message: 'Could not compress this image below 1 MB. Please choose another one.',
          variant: 'danger',
        });
        return;
      }

      await uploadAvatar(compressedImage.uri);

      showFeedback({
        title: 'Photo updated',
        message: 'Your new profile photo is now visible.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showFeedback({
        title: 'Could not update profile photo',
        message: error.message || 'Something went wrong. Please try again.',
        variant: 'danger',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = () => {
    showFeedback({
      title: 'Remove photo?',
      message: 'Are you sure you want to delete your profile photo?',
      variant: 'danger',
      confirmText: 'Remove',
      confirmVariant: 'danger',
      cancelText: 'Cancel',
      onConfirm: async () => {
        if (deletingAvatar) return;
        setDeletingAvatar(true);
        try {
          await deleteAvatar();
          showFeedback({
            title: 'Photo removed',
            message: 'Your profile picture has been deleted.',
            variant: 'success',
          });
        } catch (error) {
          showFeedback({
            title: 'Could not remove photo',
            message: error.message || 'Something went wrong. Please try again.',
            variant: 'danger',
          });
        } finally {
          setDeletingAvatar(false);
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile({
        name: name.trim() || user?.name || '',
        bio: bio.trim(),
        interests,
        accessibility,
      });
      showFeedback({
        title: 'Profile updated',
        message: 'Your changes have been saved.',
        variant: 'success',
        confirmText: 'Done',
        onConfirm: () => navigation.goBack(),
      });
    } catch (error) {
      showFeedback({
        title: 'Could not save profile',
        message: error.message || 'Something went wrong. Please try again.',
        variant: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Uploader Card */}
        <View style={styles.avatarCard}>
          <Pressable
            onPress={handlePickAvatar}
            disabled={uploadingAvatar || deletingAvatar}
            style={styles.avatarPicker}
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
          >
            <Avatar source={user?.avatarUrl} name={user?.name} size={90} />
            <View style={styles.cameraBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={15} color="#fff" />
              )}
            </View>
          </Pressable>

          <Text style={styles.changePhotoText}>
            {uploadingAvatar ? 'Uploading...' : 'Tap photo to change'}
          </Text>

          {hasAvatar && (
            <Pressable
              onPress={handleDeleteAvatar}
              disabled={deletingAvatar || uploadingAvatar}
              style={({ pressed }) => [
                styles.deletePhotoButton,
                pressed && styles.pressedOpacity,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Remove profile picture"
            >
              {deletingAvatar ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                  <Text style={styles.deletePhotoText}>Remove photo</Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Full Name */}
        <View style={styles.fieldCard}>
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
        <View style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Bio</Text>
            <Text style={styles.charCount}>{bio.length}/160</Text>
          </View>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={(text) => text.length <= 160 && setBio(text)}
            placeholder="Tell people a bit about yourself…"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={160}
          />
        </View>

        {/* Sports & Interests */}
        <View style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Sports & Interests</Text>
            <Text style={styles.charCount}>{interests.length} selected</Text>
          </View>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={17} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search sports (e.g. Padel, Yoga, Run...)"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {!!searchQuery && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={8}
                style={styles.clearBtn}
              >
                <Ionicons name="close-circle" size={16} color={colors.muted} />
              </Pressable>
            )}
          </View>

          {/* Selected Tray */}
          {interests.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.subLabel}>Selected:</Text>
              <View style={styles.wrap}>
                {interests.map((item) => (
                  <Chip
                    key={`selected-${item}`}
                    label={item}
                    selected={true}
                    onPress={() => toggleItem(interests, setInterests, item)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Scrollable Chip Area */}
          <ScrollView
            style={styles.chipsScrollArea}
            contentContainerStyle={styles.wrap}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {filteredInterests.length === 0 ? (
              <Text style={styles.noResultsText}>
                No sports found matching "{searchQuery}".
              </Text>
            ) : (
              filteredInterests.map((item) => {
                const isSelected = interests.includes(item);
                return (
                  <Chip
                    key={item}
                    label={item}
                    selected={isSelected}
                    onPress={() => toggleItem(interests, setInterests, item)}
                  />
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Accessibility Needs */}
        <View style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Accessibility & Preferences</Text>
            <Text style={styles.charCount}>{accessibility.length} selected</Text>
          </View>
          <Text style={styles.helpText}>
            Organizers see these preferences when you join events.
          </Text>
          <View style={styles.wrap}>
            {availableAccessibility.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={accessibility.includes(item)}
                onPress={() => toggleItem(accessibility, setAccessibility, item)}
              />
            ))}
          </View>
        </View>

        {/* Bottom Save Button */}
        <Button
          title={saving ? 'Saving Changes...' : 'Save Changes'}
          onPress={handleSave}
          loading={saving}
          variant="primary"
          style={styles.saveBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#F8FAF9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarCard: {
    backgroundColor: '#fff',
    borderRadius: radii.md || 16,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPicker: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.green || '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: colors.green || '#16A34A',
  },
  deletePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deletePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger || '#DC2626',
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  fieldCard: {
    backgroundColor: '#fff',
    borderRadius: radii.md || 16,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 6,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radii.sm || 8,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginLeft: 6,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  selectedSection: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || '#E5E7EB',
  },
  chipsScrollArea: {
    maxHeight: 180,
    backgroundColor: '#FAFAFA',
    borderRadius: radii.sm || 8,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    padding: 8,
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
    minHeight: 76,
    textAlignVertical: 'top',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  noResultsText: {
    color: colors.muted,
    fontSize: 13,
    fontStyle: 'italic',
    padding: 10,
  },
  saveBtn: {
    marginTop: 10,
  },
});