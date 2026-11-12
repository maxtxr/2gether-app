import { createContext, useContext, useMemo, useState } from 'react';
import { seedEvents, seedNotifications, seedChats } from '../data/mock';

const AppContext = createContext(null);

let counter = 100;
const uid = () => String(counter++);
const nowTime = () => new Date().toTimeString().slice(0, 5);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState(seedEvents);
  const [goingIds, setGoingIds] = useState(['e3']);
  const [hostedIds, setHostedIds] = useState([]);
  const [reviews, setReviews] = useState({});
  const [notifications, setNotifications] = useState(seedNotifications);
  const [chats, setChats] = useState(seedChats);

  const login = (email) =>
    setUser({ name: 'Alex Morgan', email, bio: 'Here for good games and new friends.', interests: ['Padel', 'Outdoors', 'Board games'], since: 'Nov 2026' });
  const signUp = (name, email) =>
    setUser({ name, email, bio: 'New to 2Gether!', interests: [], since: 'Nov 2026' });
  const logout = () => setUser(null);
  const updateProfile = (patch) => setUser((u) => ({ ...u, ...patch }));

  const pushNotification = (n) =>
    setNotifications((prev) => [{ id: uid(), unread: true, group: 'Today', time: nowTime(), ...n }, ...prev]);
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  const markRead = (id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const deleteNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const clearNotifications = () => setNotifications([]);

  const countOf = (e) => e.base + (goingIds.includes(e.id) ? 1 : 0);
  const spotsLeft = (e) => e.capacity - countOf(e);

  const joinEvent = (id) => {
    const e = events.find((x) => x.id === id);
    setGoingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    pushNotification({
      icon: 'checkmark-circle-outline', title: "You're going!", eventId: id,
      body: `You joined ${e.title}. ${e.base + 1} participants are now going.`,
    });
  };
  const leaveEvent = (id) => setGoingIds((prev) => prev.filter((x) => x !== id));

  const createEvent = (data) => {
    const id = uid();
    const e = {
      ...data, id, host: user.name, base: 1, people: [], short: data.when, address: '',
      area: data.place,
      // No geocoding in this prototype — new events land near central Lisbon.
      lat: 38.71, lng: -9.13,
    };
    setEvents((prev) => [e, ...prev]);
    setHostedIds((prev) => [...prev, id]);
    ['Maya', 'João', 'Sofia'].forEach((name, i) =>
      setTimeout(() => pushNotification({
        icon: 'person-add-outline', title: `${name} joined your event`, eventId: id,
        body: `${name} is going to ${data.title}.`,
      }), 4000 + i * 1500)
    );
    return id;
  };

  const addReview = (id, rating, text) => setReviews((prev) => ({ ...prev, [id]: { rating, text } }));

  const sendMessage = (eventId, text) => {
    setChats((prev) => ({ ...prev, [eventId]: [...(prev[eventId] || []), { id: uid(), from: 'me', text, time: nowTime() }] }));
    const e = events.find((x) => x.id === eventId);
    setTimeout(() => {
      setChats((prev) => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), {
          id: uid(), from: e?.host || 'Host', time: nowTime(),
          text: e?.autoReply || 'Thanks for your message! See you there.',
        }],
      }));
    }, 1500);
  };

  const pastEvents = events.filter((e) => e.past);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const joinedCount = pastEvents.length + goingIds.length;
  const hostedEvents = events.filter((e) => hostedIds.includes(e.id));

  const badges = useMemo(() => [
    { id: 'first', icon: '👟', name: 'First steps', hint: 'Join your first event', earned: joinedCount >= 1 },
    { id: 'social', icon: '🦋', name: 'Social butterfly', hint: 'Join 3 events', earned: joinedCount >= 3 },
    { id: 'host', icon: '📣', name: 'Organizer', hint: 'Create an event', earned: hostedEvents.length >= 1 },
    { id: 'inclusive', icon: '🤝', name: 'Inclusive host', hint: 'Host an accessible event', earned: hostedEvents.some((e) => e.accessibility.length > 0) },
    { id: 'reviewer', icon: '⭐', name: 'Reviewer', hint: 'Review a past event', earned: Object.keys(reviews).length >= 1 },
  ], [joinedCount, hostedEvents.length, reviews]);

  const value = {
    user, login, signUp, logout, updateProfile,
    events, goingIds, hostedIds, reviews, pastEvents, hostedEvents, joinedCount,
    countOf, spotsLeft, joinEvent, leaveEvent, createEvent, addReview,
    notifications, unreadCount, markAllRead, markRead, deleteNotification, clearNotifications,
    chats, sendMessage, badges,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
