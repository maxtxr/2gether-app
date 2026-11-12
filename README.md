# 2gether

A social event app built with **React Native + Expo**. Discover local events, join the ones you like, chat with organizers, host your own — and get the whole thing on your phone with Expo Go.

> Find what fits. Go together.

## Features

### 🔥 For you *(home tab)*
- Personalized feed with a greeting and your interest tags
- Events matching your interests surfaced first, then everything else

### 🔍 Search
- Search by name, place, area or sport
- Filter by category, level and accessibility (wheelchair friendly, flat terrain, …)
- **List / Map view toggle** — see matching events on a real map; tap a pin for details

### 📅 My events
- Upcoming events you're going to, and the ones you host
- Past events with a **star review** flow
- Create your own event (name, category, level, accessibility, date, time, location, capacity)

### 🔔 Notifications *(badge on the tab)*
- Join confirmations, "someone joined your event" alerts, event reminders
- Mark read / mark all read / delete / clear all, unread badge on the tab bar

### 👤 Profile
- Edit name and bio, interests, member stats
- Gamified **badges** (first event, social butterfly, organizer, …)
- Attended events and received reviews
- Settings: language, theme, log out, delete account

### Plus
- **Event detail** — participants, spots left, accessibility badges, join/cancel
- **Group chat** — message the organizer, canned auto-replies
- **Auth flow** — login / sign-up with inline validation (mock, no backend)

## Tech stack

| | |
|---|---|
| Framework | React Native 0.88 · React 19.3 · Expo SDK 58 |
| Navigation | React Navigation 7 (native-stack + bottom tabs) |
| Maps | `react-native-maps` (Apple Maps on iOS, Google Maps on Android) |
| Icons | `@expo/vector-icons` (Ionicons) |
| State | React Context (`src/context/AppContext.js`) |
| Data | Mock data — no backend required |

## Requirements

- **Node.js 18+** and npm
- **Expo Go** on your phone (iOS/Android), or a simulator/emulator
- Phone and computer on the same Wi-Fi (or use tunnel mode, see below)

## Getting started

```bash
npm install      # install dependencies
npm start        # start the Expo dev server
```

Then scan the QR code with Expo Go, or run a specific target:

```bash
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # browser
```

If your phone can't reach the dev server (different network, VPN, …):

```bash
npx expo start --tunnel
```

If anything looks stale after pulling changes (missing icons, old UI):

```bash
npx expo start --clear   # restart with a cleared Metro cache
```

## Project structure

```
App.js                     # navigation, tab bar, icon font preload, web alert shim
src/
  context/AppContext.js    # global state: auth, events, chats, notifications, badges
  data/
    mock.js                # seed events, notifications, chats, reviews
    options.js             # categories, levels, accessibility options
  theme/index.js           # colors, spacing, radii, level colors
  components/
    common/                # Avatar, Button, Chip, ConfirmModal, Logo, Stars
    events/                # EventCard, AccessibilityBadge, EventMap (+ .web fallback)
  screens/                 # 12 screens (auth, tabs, event detail, chat, create, …)
assets/                    # app icon, splash, favicon, Android adaptive icons
```

## Platform notes

- **iOS / Android (Expo Go)** — full experience, including the map view. Maps need no API keys in Expo Go.
- **Web** — works for everything except maps: the Map view shows a placeholder card, and system dialogs are routed to the browser.
- **No backend** — login accepts any well-formed email; data resets on reload. All state lives in `AppContext`.

## Quality checks

```bash
npx expo export --platform ios --platform android --platform web   # production bundles
npx expo-doctor                                                     # dependency health
```

Both should pass with no errors.

## License

MIT — based on the [Expo](https://expo.dev) template (see `LICENSE`).
