import { useState, useRef } from 'react';
import { View, Text, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components';

export default function ChatScreen({ route }) {
  const { events, chats, sendMessage, countOf } = useApp();
  const event = events.find((e) => e.id === route.params.id);
  const messages = chats[event.id] || [];
  const [text, setText] = useState('');
  const listRef = useRef(null);

  const send = () => {
    if (!text.trim()) return;
    sendMessage(event.id, text.trim());
    setText('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <Avatar label="👥" size={40} />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.sub}>{countOf(event)} participants · {event.short}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Ask {event.host} anything about the event.</Text>}
        renderItem={({ item }) => {
          const mine = item.from === 'me';
          return (
            <View style={[styles.msgWrap, mine && { alignItems: 'flex-end' }]}>
              {!mine && <Text style={styles.from}>{item.from}</Text>}
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={{ color: mine ? '#fff' : colors.text }}>{item.text}</Text>
              </View>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Write a message" placeholderTextColor={colors.muted} onSubmitEditing={send} />
        <Pressable onPress={send} style={styles.send} accessibilityLabel="Send message" accessibilityRole="button">
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontWeight: '700', color: colors.text },
  sub: { color: colors.muted, fontSize: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
  msgWrap: { marginBottom: 12, alignItems: 'flex-start' },
  from: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 2 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  mine: { backgroundColor: colors.greenLight },
  theirs: { backgroundColor: '#fff' },
  time: { fontSize: 11, color: colors.muted, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: colors.input, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 10 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
