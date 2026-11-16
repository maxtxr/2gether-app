
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { Chip, EventCard } from '../components';

export default function ForYouScreen({ navigation }) {
  const { user, events } = useApp();

  const interests = user.interests || [];
  const firstName = (user.name || '').trim().split(/\s+/)[0];

  const upcoming = events.filter((e) => !e.past);

  const matchesInterests = (e) =>
    interests.some(
      (i) =>
        e.sport === i ||
        e.category === i ||
        (e.title || '').toLowerCase().includes(i.toLowerCase())
    );

  const picked = upcoming.filter(matchesInterests);
  const rest = upcoming.filter((e) => !matchesInterests(e));

  const suggested = [...picked, ...rest].slice(0, 6);

  const open = (id) => navigation.navigate('EventDetail', { id });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi {firstName} 👋</Text>
          <Text style={styles.subtitle}>
            Discover what's happening around you.
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={22} color="#fff" />
        </View>
      </View>

      {/* Suggested events */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Suggested events</Text>
        <Text style={styles.seeAll}>For you</Text>
      </View>

      {suggested.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsList}
        >
          {suggested.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <EventCard
                event={event}
                onPress={() => open(event.id)}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyEvents}>
          <Ionicons name="calendar-outline" size={24} color={colors.muted} />
          <Text style={styles.emptyText}>
            No upcoming events right now.
          </Text>
        </View>
      )}

      {/* Feed */}
      <View style={styles.feedHeader}>
        <View>
          <Text style={styles.sectionTitle}>Feed</Text>
          <Text style={styles.feedSubtitle}>
            See what people are sharing.
          </Text>
        </View>

        <Ionicons name="newspaper-outline" size={23} color={colors.green} />
      </View>

      {/* Temporary empty feed */}
      <View style={styles.emptyFeed}>
        <View style={styles.emptyFeedIcon}>
          <Ionicons name="images-outline" size={30} color={colors.green} />
        </View>

        <Text style={styles.emptyFeedTitle}>
          Nothing to see yet
        </Text>

        <Text style={styles.emptyFeedText}>
          Reviews and photos from events will appear here.
          Join an event and share your experience!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    paddingTop: 16,
    paddingBottom: 30,
  },

  header: {
    marginHorizontal: 16,
    marginBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  greeting: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  seeAll: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },

  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },

  eventCard: {
    width: 275,
  },

  emptyEvents: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: 8,
  },

  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },

  feedHeader: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  feedSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },

  emptyFeed: {
    marginHorizontal: 16,
    minHeight: 220,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  emptyFeedIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyFeedTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 7,
  },

  emptyFeedText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
