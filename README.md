# 2Gether

A mobile application that connects people through casual, community-driven sports and outdoor events. Find an activity that matches your proficiency level and accessibility requirements, join it, message the organizer beforehand, host your own, and review completed sessions with an accessibility audit.

> Find what fits. Go together.

Built with **React Native + Expo** and a **Supabase** backend (auth, PostgreSQL, storage, realtime) for the *Interação Pessoa-Máquina 2026/27* course at NOVA School of Science and Technology (NOVA FCT) — Lab class P1, Group 1.

---

## Features

### 🏠 Home

- Personalized greeting and **suggested events** tailored to your declared interests.
- Community **Feed** showing recent ratings, reviews, and event photos from completed sessions.

### 🔍 Search & Explore

- Search by activity title, venue, neighborhood, sport, or specific subcategory.
- Multi-criteria filtering: category, subcategory, proficiency level, physical accessibility tags (*Wheelchair friendly*, *Flat terrain*, *Low intensity*, *All ages*, *No equipment needed*), and date.
- **List / Map View Toggle**: Inspect events pinned geographically on OpenStreetMap / native maps and tap to view details.

### 📅 My Events

- **Upcoming**: Track events you are attending as well as events you are hosting.
- **Past**: Review your attendance history, launch the post-event **Review** flow, and view earned review stars.
- **Create Event**: Configure event name, sports category & subcategory, level, accessibility tags, date/time pickers, capacity limit, and meeting point selection directly on the map with reverse-geocoded addresses.

### 📍 Event Detail & Host Management

- **Hero Card**: High-contrast layout displaying the activity icon, title, category, level chip, status badge (*Upcoming* / *Past*), and organizer tile.
- **Pre-Registration Outreach**: **"Message organizer"** lets users ask questions regarding gear or routes before joining.
- **Registration Controls**: One-tap **Join event** and **Cancel participation** with modal safeguards.
- **Dynamic Waitlist**: When maximum capacity is reached, users can join the waitlist to receive instant notifications if a spot opens up.
- **Host Tools**: Hosts get a dedicated management hub to view all participant chats, edit upcoming event parameters, or delete the event (which automatically cascades notifications to attendees).
- **Post-Event Review**: Attended past events show a **"Leave a review"** prompt.

### ⭐ Review & Accessibility Audit

- 1–5 star rating system, qualitative commentary, and optional photo upload.
- **Accessibility Verification Prompt**: *"Was the accessibility info accurate?"* (*Yes* / *Partly* / *No*), validating the host's claims to build community trust.

### 🔔 Notifications *(Badge Counter on Navigation)*

- Realtime alerts via Supabase WebSockets for join events, waitlist spot openings, organizer chat messages, and schedule updates.
- Grouped intuitively by date: **Today**, **Yesterday**, and **Earlier**.
- Controls to mark individual items or all as read, delete individual entries, or trigger **"Clear all"**.

### 👤 Profile & User Profiles

- **Profile Customization**: Avatar photo upload with client-side compression (< 1 MB), dedicated **avatar removal**, bio editing, sports interests search tray, and accessibility preferences.
- **Public Profiles**: Tap on any host or attendee avatar to view their public profile, member tenure, bio, interests, and hosted events with received ratings.
- **Gamified Achievements**: Automated badges (*First Event*, *Social Butterfly*, *Host*) that unlock as user participation grows.

### ⚙️ Settings, Privacy & Compliance

- **Preferences**: Working notification toggle switch alongside placeholders for language, time format, and themes.
- **Legal & GDPR**: Dedicated tabbed screen detailing the **Terms of Service** and **GDPR / Privacy Policy** (Art. 6 legal grounds, data controller info, and data subject rights).
- **Account Deletion**: Functional permanent account wiping via Supabase RPC (`delete_own_account`) that clears Auth, profile data, avatars, and event media.

---

## Tech Stack

| Layer | Technology | Role & Purpose |
| :--- | :--- | :--- |
| **Framework** | React Native 0.88 · React 19.3 · Expo SDK 58 | Cross-platform runtime targeting Android & iOS. |
| **Navigation** | React Navigation 7 | Stack navigation (`@react-navigation/native-stack`) & bottom tabs (`@react-navigation/bottom-tabs`). |
| **Backend** | Supabase | Cloud PostgreSQL, Row Level Security (RLS), Auth, Storage buckets, and Realtime WebSockets. |
| **Maps & Geocoding** | Leaflet / OpenStreetMap / `react-native-maps` | Interactive event mapping and Nominatim/Photon reverse-geocoding. |
| **Media** | `expo-image-picker` · `expo-image-manipulator` | Device photo library integration and compression. |
| **Icons & Typography** | `@expo/vector-icons` (Ionicons, MaterialCommunityIcons) | Standardized icons across categories and navigation. |
| **State Management** | React Context (`src/context/AppContext.js`) | Global state for sessions, cached events, chats, notifications, and feedback modals. |

---

## Requirements

- **Node.js 22.13+** and npm
- **Expo Go** app on your physical mobile device (Android / iOS), or an active Android Emulator / iOS Simulator
- Phone and computer on the same Wi-Fi network (or use `--tunnel` mode)
- A `.env` file with project Supabase credentials

---

## Getting Started

### 1. Supabase Credentials

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 2. Install and Run

```bash
# Install dependencies
npm install

# Start the Expo development server
npx expo start

# If testing across different subnets or campus Wi-Fi:
npx expo start --tunnel
```

Scan the terminal QR code with **Expo Go** (Android) or the Camera app (iOS).

To run on a specific target:

```bash
npm run android   # Android emulator
npm run ios       # iOS simulator
npm run web       # Browser preview (maps display placeholder)
```

If you encounter stale Metro bundler cache:

```bash
npx expo start --clear
```

---

## Test Accounts & Evaluation Scenarios

The database is pre-seeded with test accounts and events tailored for evaluation:

| Email | Password | Role / Scenario |
| :--- | :--- | :--- |
| `teste@gmail.com` | `Teste123?` | General testing account |
| `tiago@gmail.com` | `tiago123` | **Scenario 1**: Student looking for beginner Padel in Barreiro |
| `rita@gmail.com` | `rita123` | **Scenario 2**: Host managing *Morning Stretch & Walk* |
| `sofia@gmail.com` | `sofia123` | **Scenario 3**: Attended *Evening River Run*; needs to review & cancel upcoming event |

### Automated Database Reset

A scheduled `pg_cron` worker executes `public.reset_test_data()` every day at **04:00 UTC** to ensure deterministic dates relative to current evaluation days.

To instantly reset the database to its pristine state at any point, execute this query in the Supabase SQL Editor:

```sql
select public.reset_test_data();
```

---

## Project Structure

```text
App.js                        # Root stack navigator, animated splash screen, browser alert shim
lib/supabase.js               # Initialized Supabase client (reads .env)
supabase/
  avatar.sql                  # Avatars bucket setup + profiles.avatar_path column
  profile_accessibility.sql   # profiles.accessibility array column
  events_subcategory_icon.sql # events.subcategory and events.icon columns
  notifications.sql           # Database triggers for attendee join alerts
  reviews_accessibility.sql   # reviews.accessibility_accuracy enum column
  delete_account.sql          # RPC function for complete account and data removal
  seed.sql                    # Seed dataset and pg_cron daily reset schedule
src/
  context/AppContext.js       # Central state provider (Auth, DB queries, Storage, Realtime)
  navigation/                 # Bottom tab bar and shared header options
  data/options.js             # Sports categories, subcategories, levels, accessibility badges
  theme/index.js              # Color palette, spacing, radii, and difficulty level colors
  components/
    common/                   # Avatar, Button, Chip, ConfirmModal, Logo, ReviewCard, SplashScreen
    events/                   # EventCard, AccessibilityBadge, EventMap
    profile/                  # ProfileComponents
  utils/validation.js         # Email & password validation utilities
  screens/                    # Login, SignUp, Home, Explore, MyEvents, Notifications,
                              # Profile, UserProfile, Settings, EventDetail, CreateEvent,
                              # Review, Chat, EventChats, LegalScreen
assets/                       # Application icons, splash screens, adaptive icons
```

---

## Platform Notes & Boundaries

- **iOS / Android (Expo Go / Standalone APK)**: Full native capabilities, including Leaflet/native maps, photo manipulation, and real-time alerts.
- **Web Browser**: Accessible for UI inspection; maps display responsive placeholder containers.
- **Placeholders**: Password recovery triggers an in-app confirmation modal without dispatching external SMTP emails. Non-notification preferences in Settings display standard "Coming soon" notifications.

---

## License

MIT © 2026 IPM Group 1 (NOVA FCT). Built upon the [Expo](https://expo.dev) ecosystem.
