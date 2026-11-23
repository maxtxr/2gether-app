import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme';
import Avatar from './Avatar';
import Stars from './Stars';

const ACCURACY = {
  yes: {
    label: 'Accessibility info accurate',
    icon: 'checkmark-circle',
    color: '#16A34A',
    background: '#F0FDF4',
    border: '#BBF7D0',
  },
  partly: {
    label: 'Accessibility info partly accurate',
    icon: 'remove-circle',
    color: '#D97706',
    background: '#FFFBEB',
    border: '#FDE68A',
  },
  no: {
    label: 'Accessibility info not accurate',
    icon: 'close-circle',
    color: '#DC2626',
    background: '#FEF2F2',
    border: '#FECACA',
  },
};

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ReviewCard({
  review,
  onEventPress,
  showEvent = true,
  style,
}) {
  if (!review) return null;

  const accuracy = ACCURACY[review.accessibilityAccuracy];
  const date = formatDate(review.createdAt);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Avatar
          source={review.authorAvatar}
          name={review.author || 'Member'}
          size={40}
        />

        <View style={styles.authorMeta}>
          <Text style={styles.authorName} numberOfLines={1}>
            {review.author || 'Anonymous'}
          </Text>

          {showEvent && !!review.eventTitle && (
            onEventPress ? (
              <Pressable
                onPress={onEventPress}
                hitSlop={4}
                accessibilityRole="link"
                accessibilityLabel={`Open ${review.eventTitle}`}
              >
                <Text style={styles.eventLink} numberOfLines={1}>
                  attended{' '}
                  <Text style={styles.eventLinkHighlight}>
                    {review.eventTitle}
                  </Text>
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.eventLink} numberOfLines={1}>
                {review.eventTitle}
              </Text>
            )
          )}
        </View>

        <View style={styles.ratingWrap}>
          <Stars rating={review.rating || 0} size={13} readOnly />
        </View>
      </View>

      {!!review.content && (
        <Text style={styles.content}>{review.content}</Text>
      )}

      {!!accuracy && (
        <View
          style={[
            styles.accuracy,
            { backgroundColor: accuracy.background, borderColor: accuracy.border },
          ]}
        >
          <Ionicons name={accuracy.icon} size={14} color={accuracy.color} />
          <Text style={[styles.accuracyText, { color: accuracy.color }]}>
            {accuracy.label}
          </Text>
        </View>
      )}

      {!!review.imageUrl && (
        <Image
          source={{ uri: review.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {(!!date || !!onEventPress) && (
        <View style={styles.footer}>
          <Text style={styles.date}>{date}</Text>

          {!!onEventPress && (
            <Pressable
              style={({ pressed }) => [styles.eventBtn, pressed && styles.pressed]}
              onPress={onEventPress}
              accessibilityRole="button"
              accessibilityLabel={`View ${review.eventTitle || 'event'}`}
            >
              <Text style={styles.eventBtnText}>View event</Text>
              <Ionicons
                name="arrow-forward"
                size={12}
                color={colors.green}
              />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radii.md || 16,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorMeta: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  authorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  eventLink: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  eventLinkHighlight: {
    color: colors.text,
    fontWeight: '600',
  },
  ratingWrap: {
    alignItems: 'flex-end',
  },
  content: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  accuracy: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    borderWidth: 1,
    borderRadius: radii.pill || 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
    marginBottom: 10,
  },
  accuracyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: radii.sm || 10,
    marginBottom: 10,
    backgroundColor: '#F3F4F6',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border || '#F3F4F6',
  },
  date: {
    color: colors.muted,
    fontSize: 12,
  },
  eventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventBtnText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
