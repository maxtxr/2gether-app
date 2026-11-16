import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

import { colors, radii } from '../theme';
import { CATEGORIES } from '../data/options';
import { useApp } from '../context/AppContext';
import { Avatar, Button, Chip, Stars } from '../components';

export default function ProfileScreen({ navigation }) {
  const {
    user,
    updateProfile,
    uploadAvatar,
    joinedCount,
    hostedEvents,
    pastEvents,
    badges,
    receivedReviews,
    averageRating,
  } = useApp();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [interests, setInterests] = useState(user?.interests || []);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!editing) {
      setName(user?.name || '');
      setBio(user?.bio || '');
      setInterests(user?.interests || []);
    }
  }, [user, editing]);

  const toggleInterest = (interest) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  };

  const save = async () => {
    try {
      setSaving(true);
      await updateProfile({
        name: name.trim() || user.name,
        bio: bio.trim(),
        interests,
      });
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Please allow access to your photo library.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setUploadingAvatar(true);

      const dimensions = [800, 640, 512];
      const qualities = [0.8, 0.7, 0.6, 0.5];
      let compressedImage = null;

      for (const maxDimension of dimensions) {
        const actions = [];
        const longestSide = Math.max(asset.width, asset.height);

        if (longestSide > maxDimension) {
          actions.push(
            asset.width >= asset.height
              ? { resize: { width: maxDimension } }
              : { resize: { height: maxDimension } }
          );
        }

        for (const quality of qualities) {
          const manipulated = await ImageManipulator.manipulateAsync(
            asset.uri,
            actions,
            {
              compress: quality,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          const info = await FileSystem.getInfoAsync(manipulated.uri);

          if (info.exists && info.size <= 1024 * 1024) {
            compressedImage = manipulated;
            break;
          }
        }

        if (compressedImage) break;
      }

      if (!compressedImage) {
        Alert.alert(
          'Image too large',
          'Could not compress this image below 1 MB. Please choose another photo.'
        );
        return;
      }

      await uploadAvatar(compressedImage.uri);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert(
        'Error',
        error.message || 'Could not update profile photo.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const ratingLabel =
    averageRating == null ? '—' : String(averageRating);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.top}>
        <Pressable
          onPress={pickAvatar}
          disabled={uploadingAvatar}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          style={styles.avatarWrap}
        >
          <Avatar
            source={user?.avatarUrl}
            name={user?.name}
            size={72}
          />
          <View style={styles.cameraBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={14} color="#fff" />
            )}
          </View>
        </Pressable>

        <View style={{ flex: 1, marginLeft: 14 }}>
          {editing ? (
            <>
              <TextInput
                style={styles.edit}
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={colors.muted}
              />
              <TextInput
                style={styles.edit}
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                placeholderTextColor={colors.muted}
              />
            </>
          ) : (
            <>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.bio}>{user?.bio}</Text>
              <Text style={styles.since}>Member since {user?.since}</Text>
            </>
          )}
        </View>
      </View>

      <Button
        title={editing ? (saving ? 'Saving…' : 'Save') : 'Edit profile'}
        variant={editing ? 'primary' : 'outline'}
        icon={editing ? undefined : 'pencil-outline'}
        onPress={editing ? save : () => setEditing(true)}
        disabled={saving}
        style={{ marginTop: 14 }}
      />

      <Text style={styles.section}>Interests</Text>
      {editing ? (
        <View style={styles.wrap}>
          {CATEGORIES.map((interest) => (
            <Chip
              key={interest}
              label={interest}
              selected={interests.includes(interest)}
              onPress={() => toggleInterest(interest)}
            />
          ))}
        </View>
      ) : interests.length > 0 ? (
        <View style={styles.wrap}>
          {interests.map((interest) => (
            <Chip key={interest} label={interest} />
          ))}
        </View>
      ) : (
        <Text style={styles.emptyHint}>
          Add interests while editing your profile.
        </Text>
      )}

      <View style={styles.stats}>
        <Stat value={joinedCount} label="Joined" />
        <Stat value={hostedEvents.length} label="Hosted" />
        <Stat value={ratingLabel} label="Rating" />
      </View>

      <Text style={styles.section}>Badges</Text>
      <View style={styles.badges}>
        {badges.map((b) => (
          <View
            key={b.id}
            style={[styles.badge, !b.earned && { opacity: 0.45 }]}
          >
            <Text style={{ fontSize: 26 }}>
              {b.earned ? b.icon : '🔒'}
            </Text>
            <Text style={styles.badgeName}>{b.name}</Text>
            <Text style={styles.badgeHint}>
              {b.earned ? 'Unlocked' : b.hint}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Attended events</Text>
      {pastEvents.length === 0 ? (
        <Text style={styles.emptyHint}>
          Events you join will show here after they end.
        </Text>
      ) : (
        pastEvents.map((e) => (
          <Pressable
            key={e.id}
            style={styles.attended}
            onPress={() =>
              navigation.navigate('EventDetail', { id: e.id })
            }
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.green}
            />
            <Text style={styles.attendedText}>
              {e.title}
              {e.area ? ` · ${e.area}` : ''}
            </Text>
          </Pressable>
        ))
      )}

      <View style={styles.revHeader}>
        <Text style={styles.section}>Reviews</Text>
        <Text style={styles.count}>
          {receivedReviews.length} reviews
        </Text>
      </View>
      {receivedReviews.length === 0 ? (
        <Text style={styles.emptyHint}>
          Reviews on events you host will appear here.
        </Text>
      ) : (
        receivedReviews.map((r) => (
          <View key={r.id} style={styles.review}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontWeight: '700', color: colors.text }}>
                {r.author}
              </Text>
              <Stars rating={r.rating} size={14} />
            </View>
            {!!r.eventTitle && (
              <Text style={styles.reviewEvent}>{r.eventTitle}</Text>
            )}
            {!!r.content && (
              <Text style={{ color: colors.text, marginTop: 4 }}>
                {r.content}
              </Text>
            )}
          </View>
        ))
      )}

      <Pressable
        style={styles.settings}
        onPress={() => navigation.navigate('Settings')}
        accessibilityRole="button"
      >
        <Ionicons name="settings-outline" size={20} color={colors.text} />
        <Text style={styles.settingsText}>Settings</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    </ScrollView>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  bio: { color: colors.muted, marginTop: 2 },
  since: { color: colors.muted, fontSize: 12, marginTop: 4 },
  edit: {
    backgroundColor: '#fff',
    borderRadius: radii.pill,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyHint: { color: colors.muted, fontSize: 13 },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.green },
  statLabel: { color: colors.muted, fontSize: 13 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  badge: {
    width: '31%',
    margin: '1%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  badgeName: {
    fontWeight: '700',
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  badgeHint: { fontSize: 11, color: colors.muted, textAlign: 'center' },
  attended: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  attendedText: { marginLeft: 8, color: colors.text, flex: 1 },
  revHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  count: { color: colors.muted, fontSize: 13 },
  review: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  reviewEvent: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  settings: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radii.pill,
    padding: 14,
    marginTop: 20,
    marginBottom: 20,
  },
  settingsText: {
    flex: 1,
    marginLeft: 10,
    fontWeight: '600',
    color: colors.text,
  },
});
