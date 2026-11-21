
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components';
import { supabase } from '../../lib/supabase';

export default function ChatScreen({ route, navigation }) {
  const { events, chats, loadMessages, markConversationRead, sendMessage } = useApp();

  const { conversationId, eventId, otherName } = route.params;

  const event = events.find((e) => e.id === eventId);
  const messages = chats[conversationId] || [];

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);

  // Conversa privada entre um participante e o organizador
  useEffect(() => {
    navigation.setOptions({
      title: otherName ? `Chat with ${otherName}` : 'Chat',
    });
  }, [navigation, otherName]);

  useEffect(() => {
    if (!conversationId) return;

    const load = async () => {
      try {
        await markConversationRead(conversationId);
        await loadMessages(conversationId);
      } catch (error) {
        console.error('Error loading messages:', error.message);
      }
    };

    load();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          load();
        }
      )
      .subscribe((status) => {
        console.log('Chat realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Enviar mensagem
  const send = async () => {
    if (!text.trim() || sending) return;

    const message = text.trim();

    try {
      setSending(true);

      await sendMessage(conversationId, message);

      setText('');
    } catch (error) {
      Alert.alert('Error sending message', error.message);
    } finally {
      setSending(false);
    }
  };

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Event not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Avatar name={otherName || event.host} size={40} />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={styles.title}>{otherName || event.host}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            About {event.title} · {event.short}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No messages yet. Ask {event.host} anything about the event.
          </Text>
        }
        renderItem={({ item }) => {
          const mine = item.from === 'me';

          return (
            <View
              style={[
                styles.msgWrap,
                mine && { alignItems: 'flex-end' },
              ]}
            >
              {!mine && (
                <Text style={styles.from}>{otherName || event.host}</Text>
              )}

              <View
                style={[
                  styles.bubble,
                  mine ? styles.mine : styles.theirs,
                ]}
              >
                <Text style={{ color: mine ? '#fff' : colors.text }}>
                  {item.text}
                </Text>
              </View>

              <Text style={styles.time}>{item.time}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Write a message"
          placeholderTextColor={colors.muted}
          onSubmitEditing={send}
          editable={!sending}
        />

        <Pressable
          onPress={send}
          disabled={sending || !text.trim()}
          style={styles.send}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontWeight: '700', color: colors.text },
  sub: { color: colors.muted, fontSize: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
  msgWrap: { marginBottom: 12, alignItems: 'flex-start' },
  from: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 2,
  },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  mine: { backgroundColor: colors.greenLight },
  theirs: { backgroundColor: '#fff' },
  time: { fontSize: 11, color: colors.muted, marginTop: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
