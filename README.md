# 2Gether

A mobile app that connects people through casual, community-driven sports and outdoor events. Find an event that matches your level and accessibility needs, join it, talk to the organizer, host your own and review it afterwards.

> Find what fits. Go together.

Built with **React Native + Expo** and a **Supabase** backend (auth, database, storage, realtime) for the *Interação Pessoa-Máquina 2026/27* course at NOVA FCT (Lab class P1, Group 1).

## Features

### 🏠 Home
- Greeting and **suggested events** ranked by your interests
- **Feed** of reviews and photos from past events

### 🔍 Search
- Search by name, place, area or sport
- Filter by category, level and accessibility (wheelchair friendly, flat terrain, low intensity, all ages)
- **List / Map view toggle**: tap a pin to open the event

### 📅 My events
- **Upcoming**: events you're going to and events you host
- **Past**: events you attended, with a **Review** button (★ rating shown once reviewed)
- **Create event**: name, category, level, accessibility tags, date & time pickers, location picked on a map (with address search), capacity and an optional photo

### 📍 Event detail
- Host, date, place, participants, spots left and accessibility badges
- **Join** / **Cancel participation**
- **Waitlist** when the event is full (you get a notification when a spot opens)
- **Message organizer**, available before joining. Hosts get **View chats** with every participant.
- After the event: **Leave a review** opens the review screen (also reachable from My events → Past → Review)

### ⭐ Review
- Star rating (starts empty), written review and optional photo
- **"Was the accessibility info accurate?"** (Yes / Partly / No), only for events with accessibility tags, shown on the review afterwards

### 🔔 Notifications *(badge on the tab)*
- Someone joined your event, new messages, spot available on a waitlist, event created
- Tap to open the related event or chat, mark one/all as read, delete one, **clear all**
- Realtime: new notifications appear without refreshing

### 👤 Profile
- Photo (avatar upload), name, bio and interests (editable)
- Gamified **badges** (First Event, Social Butterfly, Host)
- Attended events, received reviews and average rating
- Settings, log out

### 🔐 Auth
- Sign up / log in with email and password (Supabase Auth), with inline validation and password rules

## Tech stack

| | |
|---|---|
| Framework | React Native 0.88 · React 19.3 · Expo SDK 58 |
| Navigation | React Navigation 7 (native-stack + bottom tabs) |
| Backend | Supabase (Postgres + Row Level Security, Auth, Storage, Realtime) |
| Maps | `react-native-maps` (Apple Maps on iOS, Google Maps on Android) |
| Media | `expo-image-picker`, `expo-image-manipulator` |
| Icons | `@expo/vector-icons` (Ionicons) |
| State | React Context (`src/context/AppContext.js`) |

## Requirements

- **Node.js 18+** and npm
- **Expo Go** on your phone (Android/iOS), or an emulator/simulator
- Phone and computer on the same Wi-Fi (or use tunnel mode, see below)
- A `.env` file with the Supabase credentials (see below)

## Getting started

### 1. Supabase credentials

Create a `.env` file in the project root (it is git-ignored):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Without it the app cannot start. Ask a group member for the values.

### 2. Install and run

```bash
npm install      # install dependencies
npm start        # start the Expo dev server
```

Scan the QR code with Expo Go, or run a specific target:

```bash
npm run android   # Android emulator
npm run ios       # iOS simulator
npm run web       # browser (no maps, see Platform notes)
```

If your phone can't reach the dev server (different network, VPN, …):

```bash
npx expo start --tunnel
```

If anything looks stale after pulling changes:

```bash
npx expo start --clear   # restart with a cleared Metro cache
```

## Test data for the evaluation scenarios

`supabase/seed.sql` fills the database with events, participations, reviews, a chat and notifications that cover the three usability scenarios:

1. **Discover an event, join it and contact the organizer.** *Padel for Absolute Beginners* in Barreiro next Saturday at 10:00, plus look-alike events at other levels and in other areas.
2. **Create and manage a community event.** The tester hosts *Morning Stretch & Walk* and has several "someone joined your event" notifications to view and clear.
3. **Review past events and cancel a future participation.** *Evening River Run* (past, not reviewed yet) and *Riverside 5K Run* (upcoming, already joined).

Setup:

1. In Supabase → **Authentication → Users → Add user** (tick *Auto Confirm User*), create:
   `joao@2gether.test` (the tester), `maya@2gether.test` and `paul@2gether.test`.
2. In Supabase → **SQL Editor**, run `supabase/avatar.sql` (profile photos), `supabase/notifications.sql` (notify hosts when someone joins) and `supabase/reviews_accessibility.sql` (accessibility question in reviews) once, then run `supabase/seed.sql`.
3. Log in as `joao@2gether.test`.

`seed.sql` creates the database function `public.reset_test_data()` and schedules it with `pg_cron` to run **every day at 04:00 UTC**, so the test data (with dates relative to that day) is always fresh, whenever the app is evaluated. It only deletes and recreates the rows of the three test accounts.

To reset the test data immediately, run in the SQL Editor:

```sql
select public.reset_test_data();
```

## Project structure

```
App.js                     # root navigator (auth stack vs. app stack), web alert shim
lib/supabase.js            # Supabase client (reads .env)
supabase/
  avatar.sql               # avatars bucket + profiles.avatar_path column
  notifications.sql        # trigger: notify the host when someone joins their event
  reviews_accessibility.sql # reviews.accessibility_accuracy (yes / partly / no)
  seed.sql                 # test data for the scenarios + daily automatic reset (pg_cron)
src/
  context/AppContext.js    # global state + all Supabase calls (auth, events, chats, notifications, reviews, badges)
  navigation/              # bottom tabs and shared header
  data/options.js          # categories, levels, accessibility options
  theme/index.js           # colors, spacing, radii, level colors
  components/
    common/                # Avatar, Button, Chip, ConfirmModal, Logo, Stars
    events/                # EventCard, AccessibilityBadge, EventMap (+ .web fallback)
  screens/                 # Login, SignUp, Home, Explore (Search), MyEvents, Notifications,
                           # Profile, Settings, EventDetail, CreateEvent, Chat, EventChats
assets/                    # app icon, splash, favicon, Android adaptive icons
```

## Platform notes

- **Android / iOS (Expo Go)**: full experience, including maps. No map API keys are needed in Expo Go.
- **Web**: everything except maps. The map view shows a placeholder, and system dialogs use the browser's `alert`/`confirm`.

## Not implemented yet

These parts of the interface are visible but are placeholders:

- Settings: language, time format, accessibility, theme and notification preferences ("Coming soon")
- Search: "Change area" / distance radius, and a date filter
- "Forgot password?" only shows a message, no email is sent
- "Delete account" only logs out
- Hosts cannot edit or cancel an event after creating it

## License

MIT, based on the [Expo](https://expo.dev) template (see `LICENSE`).
