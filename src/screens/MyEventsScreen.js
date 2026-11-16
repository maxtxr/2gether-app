
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';

import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { EventCard, Button } from '../components';

// Converter a data do evento para um objeto Date
function getEventDate(event) {
  const value = event.when || event.date;

  if (!value) return null;

  // Formato utilizado no Supabase: DD/MM/YYYY, HH:mm
  const match = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2})$/
  );

  if (match) {
    const [, day, month, year, hour, minute] = match;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );
  }

  // Compatibilidade com datas noutros formatos
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function eventHasEnded(event) {
  const date = getEventDate(event);

  if (!date) return !!event.past;

  return date < new Date();
}

export default function MyEventsScreen({ navigation }) {
  const {
    events,
    goingIds,
    hostedEvents,
    reviews,
    user,
  } = useApp();

  const [tab, setTab] = useState('Upcoming');

  // Eventos em que participo e que ainda não terminaram
  const going = events.filter(
    (event) =>
      goingIds.includes(event.id) &&
      !eventHasEnded(event)
  );

  // Eventos em que participei e que já terminaram
  const pastGoing = events.filter(
    (event) =>
      goingIds.includes(event.id) &&
      eventHasEnded(event)
  );

  const open = (id) =>
    navigation.navigate('EventDetail', { id });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={styles.title}>My Events</Text>
      <Text style={styles.sub}>
        Your plans, all in one place.
      </Text>

      <View style={styles.segment}>
        {['Upcoming', 'Past'].map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.segBtn,
              tab === t && styles.segOn,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.segText,
                tab === t && { color: '#fff' },
              ]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'Upcoming' ? (
        <>
          <Text style={styles.section}>
            Going · {going.length}
          </Text>

          {going.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => open(event.id)}
            />
          ))}

          {going.length === 0 && (
            <Text style={styles.empty}>
              Nothing yet. Find an event in Explore.
            </Text>
          )}

          <Text style={styles.section}>
            Hosting · {hostedEvents.length}
          </Text>

          {hostedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => open(event.id)}
            />
          ))}

          {hostedEvents.length === 0 && (
            <Text style={styles.empty}>
              You are not hosting any event.
            </Text>
          )}
        </>
      ) : (
        <>
          <Text style={styles.section}>
            Past · {pastGoing.length}
          </Text>

          {pastGoing.map((event) => {
            const eventReviews = reviews[event.id] || [];

            const myReview = eventReviews.find(
              (review) => review.userId === user?.id
            );

            return (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => open(event.id)}
                right={
                  <Pressable
                    onPress={() => open(event.id)}
                    style={[
                      styles.reviewBtn,
                      myReview && styles.reviewDone,
                    ]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.reviewText,
                        myReview && { color: '#fff' },
                      ]}
                    >
                      {myReview
                        ? `★ ${myReview.rating}`
                        : 'Review'}
                    </Text>
                  </Pressable>
                }
              />
            );
          })}

          {pastGoing.length === 0 && (
            <Text style={styles.empty}>
              You don't have any past events yet.
            </Text>
          )}
        </>
      )}

      <Button
        title="+  Create Event"
        onPress={() => navigation.navigate('CreateEvent')}
        style={{ marginTop: 16 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.green,
  },
  sub: {
    color: colors.muted,
    marginBottom: 14,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.chip,
    borderRadius: 22,
    padding: 4,
    marginBottom: 6,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  segOn: {
    backgroundColor: colors.green,
  },
  segText: {
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  empty: {
    color: colors.muted,
    marginBottom: 8,
  },
  reviewBtn: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  reviewDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  reviewText: {
    color: colors.orange,
    fontWeight: '700',
    fontSize: 13,
  },
});
