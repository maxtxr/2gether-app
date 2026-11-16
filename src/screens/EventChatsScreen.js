import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components';
import { supabase } from '../../lib/supabase';

export default function EventChatsScreen({ route, navigation }) {
  const { events, user, loadEventConversations } = useApp();

  const { eventId } = route.params;

  const event = events.find((e) => e.id === eventId);

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await loadEventConversations(eventId);

        if (mounted) {
          setConversations(data);
        }
      } catch (error) {
        Alert.alert('Error loading chats', error.message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    const channel = supabase
      .channel(`event-chats-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Event not found.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.title}>Event chats</Text>
        <Text style={styles.subtitle}>
          Conversations about {event.title}
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No conversations yet.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('Chat', {
                conversationId: item.id,
                eventId,
                otherName: item.participantName,
            })}
          >
            <Avatar
              label={item.participantName?.charAt(0) || 'P'}
              size={44}
            />

            <View style={styles.details}>
              <Text style={styles.name}>
                {item.participantName}
              </Text>

              <Text style={styles.message} numberOfLines={1}>
                {item.lastMessage}
              </Text>

              <Text style={styles.time}>
                {new Date(item.lastMessageAt).toLocaleString()}
              </Text>
            </View>

            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.muted}
            />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  heading: {
    padding: 16,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.green,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: '700',
    color: colors.text,
  },
  message: {
    color: colors.muted,
    marginTop: 3,
    fontSize: 13,
  },
  time: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
