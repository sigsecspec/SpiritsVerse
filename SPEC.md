# SpiritsVerse — Full Application Specification

> **Tagline:** *"The Universe of Every Pour."*  
> A social network for drink lovers — cocktails, beer, wine, and spirits — with community feeds, a drink encyclopedia, local discovery, matchmaking (PourUp), and group chat (BarSesh).

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Environment & Setup](#4-environment--setup)
5. [Authentication & Age Gating](#5-authentication--age-gating)
6. [Navigation & Views](#6-navigation--views)
7. [Feature Modules](#7-feature-modules)
8. [Database Schema](#8-database-schema)
9. [API Layer (`services/supabaseClient.ts`)](#9-api-layer)
10. [AI Services (`services/geminiService.ts`)](#10-ai-services)
11. [Component Map](#11-component-map)
12. [Data Flows](#12-data-flows)
13. [Storage Buckets](#13-storage-buckets)
14. [Security & Moderation](#14-security--moderation)
15. [Deployment](#15-deployment)
16. [Known Limitations & Future Work](#16-known-limitations--future-work)

---

## 1. Product Overview

SpiritsVerse is a React single-page application backed by a shared **Verse** Supabase project (also used by Cookbook.io and StrainVerse). Users authenticate, build a drink-themed profile, browse a spirits/cocktail directory, post to global and local feeds, match with nearby drinkers, join group chat rooms, and customize their profile with CSS/JS themes.

### Core User Journeys

| Journey | Description |
|---------|-------------|
| **Onboard** | Sign up (21+), create profile with handle, DOB, city/state |
| **Explore** | Browse Drink Directory, read specs, reviews, photos, lounge chat |
| **Socialize** | Post to SipStream (global) or Local Pub (radius-based) |
| **Match** | Use PourUp to find locals, raise a glass, get matched into a chat |
| **Chat** | Join BarSesh rooms (friend/family/public) or PourUp match chats |
| **Customize** | Edit profile, set favorites, apply AI-generated CSS themes |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                        │
│  React 19 + Vite + Tailwind (CDN) + Lucide Icons            │
├─────────────────────────────────────────────────────────────┤
│  App.tsx (router via AppView state)                         │
│    ├── LandingPage / AuthScreen                             │
│    ├── Sidebar + RightSidebar + Mobile Nav                  │
│    └── View Components (SipStream, LocalPub, PourUp, …)    │
├─────────────────────────────────────────────────────────────┤
│  services/                                                  │
│    ├── supabaseClient.ts  → Supabase Auth + REST (SpiritsVerse schema) │
│    └── geminiService.ts   → Google Gemini AI (optional)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (shared Verse project)                            │
│    Schema: "SpiritsVerse"                                   │
│    Auth: auth.users (shared across Verse apps)              │
│    Storage: posts, SpiritsVerse buckets                     │
│    Realtime: spirits, posts, messages                       │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Client-side routing** via `AppView` enum state (no React Router).
- **Supabase schema isolation** — all tables live in `"SpiritsVerse"` schema, configured on the Supabase client via `db.schema`.
- **Optimistic UI** for reactions and chat messages where practical.
- **Geolocation** captured on login for Local Pub radius filtering and PourUp city matching.

---

## 3. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Build | Vite 6 |
| Language | TypeScript 5.8 |
| Styling | Tailwind CSS (CDN) + CSS custom properties |
| Icons | lucide-react |
| Backend | Supabase (Auth, Postgres, Storage, Realtime) |
| AI | Google Gemini (`@google/genai`) — optional |
| Fonts | Inter, Playfair Display, Fira Code (Google Fonts) |

---

## 4. Environment & Setup

### Required Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Yes** | Supabase anon/publishable key |
| `GEMINI_API_KEY` | No | AI features (falls back to static defaults) |

Copy `.env.example` → `.env.local` and fill in values.

### Database Bootstrap

Run one of these in the Supabase SQL editor:

| Script | Use Case |
|--------|----------|
| `sql/update.sql` | **Idempotent** — safe on shared DB, creates schema if missing |
| `sql.txt` | **Full reset** — drops and recreates `SpiritsVerse` schema |

Both scripts seed 7 starter drinks, set up RLS policies, auth triggers, and register the schema via `register_app_schema('SpiritsVerse')`.

### Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production bundle → dist/
npm run preview  # preview production build
```

---

## 5. Authentication & Age Gating

### Sign Up (`AuthScreen`)

- Fields: name, handle, date of birth, email, password
- **Frontend age check:** must be 21+ at signup
- Metadata stored in `auth.users.raw_user_meta_data` (name, handle, date_of_birth)
- DB trigger `on_auth_user_created_spiritsverse` auto-creates a `profiles` row
- Fallback: `api.createProfile()` if trigger hasn't fired yet

### Sign In

- Email/password via `supabase.auth.signInWithPassword`
- Session persisted; `onAuthStateChange` listener refreshes user state

### Age-Gated Features

| Feature | Gate |
|---------|------|
| PourUp | Hidden from sidebar if `userAge < 21`; shows 21+ block screen if accessed |
| Signup | Rejects DOB implying age < 21 |

### Profile Recovery

If a user has an auth session but no `profiles` row, `api.getCurrentUser()` recovers from auth metadata and upserts a profile.

---

## 6. Navigation & Views

### `AppView` Enum

```typescript
enum AppView {
  DRINK_DIRECTORY = 'DRINK_DIRECTORY',  // Spirits encyclopedia
  SIP_STREAM      = 'SIP_STREAM',       // Global social feed
  LOCAL_PUB       = 'LOCAL_PUB',        // Location-based feed
  POUR_UP         = 'POUR_UP',            // Local matchmaking (21+)
  BAR_SESH        = 'BAR_SESH',         // Group chat rooms
  PROFILE         = 'PROFILE',          // User profile ("My Bar")
}
```

### Layout

| Region | Component | Visibility |
|--------|-----------|------------|
| Left sidebar | `Sidebar` | Desktop (`lg+`) |
| Main content | View-specific component | Always |
| Right sidebar | `RightSidebar` | Desktop (`xl+`) — Daily Toast + Favorites |
| Mobile nav | Bottom bar (6 icons) | Mobile (`<lg`) |
| Header | `Header` | Most views except Profile, Directory, BarSesh |

### Mobile Bottom Nav Icons

Directory → SipStream → Local Pub → BarSesh → PourUp → My Bar

---

## 7. Feature Modules

### 7.1 Drink Directory (`DrinkVerseDirectory` + `DrinkProfilePage`)

**Purpose:** Encyclopedia of cocktails, beers, wines, and spirits.

**Directory features:**
- Search by name or tasting notes
- Filter tabs: All, Cocktails, Beer, Wine, Spirits, Mocktails
- Trending & Seasonal carousels
- Drink cards show category, maker, ABV, avg rating, tasted badge

**Drink profile features:**
- **Details tab:** specs (category, ABV, origin), strength meter, flavor profile, history, recipe
- **Gallery tab:** user-uploaded photos (Home Mix vs Bar Order context)
- **Reviews tab:** 1–5 star ratings with text, per serving style
- **Lounge tab:** real-time-ish chat per drink
- **Actions:** "I've had this" (spirit log), Favorite (adds to profile `fav_drinks`), context toggle (Home/Bar)

**Data tables:** `spirits`, `spirits_with_stats` (view), `spirit_photos`, `spirit_reviews`, `spirit_chat_messages`, `user_spirit_log`

---

### 7.2 SipStream (`SipStream`)

**Purpose:** Global public feed of drink-related posts.

**Features:**
- Post creation modal with mood emojis, spirit name, buzz level (0–10), image upload
- **Drink Cam (Bar Lens):** AI image filter via Gemini
- Stories carousel (ephemeral drink moments)
- Reactions: CHEERS, DRINK, SPILL, BUZZED
- Inline comments with optimistic count update
- Visibility filter: `GLOBAL_BAR`, excludes `is_toastit` posts

**Data tables:** `posts`, `post_reactions`, `post_comments`, `stories`

---

### 7.3 Local Pub (`LocalPub`)

**Purpose:** Location-aware social feed and local discovery.

**Tabs:**

| Tab | Function |
|-----|----------|
| **The Pub** | Inline post creator + feed of `LOCAL_PUB` visibility posts within user's `distance_radius` (default 25 km) |
| **Trends** | Aggregated stats: top spirits, moods, avg buzz, active toast count |
| **Bars** | Area safety pulse (SAFE/ROWDY reports) + nearby venues from post metadata |
| **Events** | Active ToastIt posts with expiry — local meetups/happy hours |

**Features:**
- ToastIt toggle on inline posts
- ToastIt-only filter
- Distance badges on posts
- Geolocation updated on session start

**Data tables:** `posts` (visibility=`LOCAL_PUB`), `safety_reports`

---

### 7.4 PourUp (`PourUp`)

**Purpose:** Location-based drink buddy matchmaking (21+ only).

**Requirements:**
- User must have `city` and `state` set in profile
- User must be 21+

**Post type:** `is_toastit = true` with:
- `toast_looking_for` (intent: "Grab a drink", "Happy Hour", etc.)
- `toast_expires_at` (30 min – 6 hours)
- Filtered to same city/state as author

**Interaction flow:**

```
User A posts PourUp card
    ↓
User B taps "Raise Glass" → VibeTapModal
    ↓
  RAISE_GLASS (one-way toast) or CLINK (mutual intent)
    ↓
If mutual CLINK or A accepts B's toast → create TOAST group chat
    ↓
Match success modal → navigate to BarSesh
```

**Safety:**
- Report post (6 categories)
- Block user
- AI content moderation on PourUp posts (Gemini)

**Data tables:** `posts`, `toastit_interactions`, `groups` (type=`TOAST`), `blocks`, `reports`

---

### 7.5 BarSesh (`BarSeshDirectory` + `BarSeshView`)

**Purpose:** Group chat rooms for friends, family, public hangouts, and PourUp matches.

**Directory tabs:**

| Tab | Shows |
|-----|-------|
| My Seshes | FRIEND/FAMILY groups where user is a member |
| Public | All PUBLIC groups (with Join button) |
| PourUp Chats | TOAST-type match groups where user is a member |

**Chat features:**
- Message list with sender avatars
- Send on Enter or button
- Simulated voice/video call banner (UI placeholder)
- Group header with cover image

**Group types:** `FRIEND`, `FAMILY`, `PUBLIC`, `TOAST`

**Data tables:** `groups`, `messages`

---

### 7.6 My Bar / Profile (`ProfileCanvas`)

**Purpose:** User's personal drink-themed profile page.

**Sections:**
- Header: avatar, name, handle, bio, Edit Profile button
- Stats: activity log count, drinking buddies, drinks tasted
- Badges display
- Sidebar widgets (YouTube, Image, Text) + profile details (location, drinking style, favorites)

**Tabs:**

| Tab | Content |
|-----|---------|
| Log | User's own posts with reactions |
| My Bar | Grid of tasted drinks from `user_spirit_log` |
| Favorites | `fav_drinks` from profile (editable via settings or Directory Favorite button) |

**Customization (`ProfileCustomization`):**
- Floating wand button opens CSS/JS theme editor
- AI theme generation via Gemini
- Custom CSS injected via `<style>` tag; custom JS executed on mount

**Data tables:** `profiles` (custom_css, custom_js, widgets, badges, fav_drinks)

---

### 7.7 Global Modals & Sidebars

| Component | Trigger | Function |
|-----------|---------|----------|
| `WisdomModal` | Sidebar "Bar Wisdom" | AI-generated bar wisdom quotes |
| `BarLensModal` | Drink Cam on image posts | AI image style transfer |
| `CreatePostModal` | FAB / post buttons | Full post creation with meta |
| `CreateStoryModal` | Stories "Add" button | Upload ephemeral story |
| `CreateSeshModal` | BarSesh "Create Sesh" | New group room |
| `VibeTapModal` | PourUp "Raise Glass" | Send toast/clink to poster |
| `ProfileSettingsModal` | Profile "Edit Profile" | Update name, bio, location, favorites |
| `CSSEditor` | Profile customization wand | Theme editor with AI assist |
| `RightSidebar` | Always visible (desktop) | Daily Toast (AI) + favorite drinks |

---

## 8. Database Schema

All tables in `"SpiritsVerse"` schema.

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles | id (FK auth.users), name, handle, avatar, bio, city, state, lat/lng, distance_radius, fav_drinks, drinking_style, badges, widgets, custom_css/js, date_of_birth, status, role |
| `spirits` | Drink directory entries | name, category, description, abv, age, region, tasting_notes, pairs_with, maker, history, recipe |
| `posts` | Social posts | user_id, content, image, visibility, lat/lng, spirit, buzz_level, venue, mood, is_toastit, toast_looking_for, toast_expires_at, group_id |
| `post_reactions` | Post reactions | post_id, user_id, type (unique per user per post) |
| `post_comments` | Post comments | post_id, user_id, content |
| `groups` | Chat rooms | name, description, type, members (JSONB array), cover_image_url |
| `messages` | Group messages | group_id, user_id, text |
| `stories` | Ephemeral stories | user_id, image_url, spirit_name, buzz_level |
| `relationships` | Friend/family links | user_1_id, user_2_id, type, status |
| `blocks` | User blocks | blocker_id, blocked_id |
| `reports` | Content reports | reporter_id, reported_user_id, post_id, category, reason |
| `toastit_interactions` | PourUp toasts | post_id, sender_id, receiver_id, message, type, status, group_id |
| `safety_reports` | Area safety | user_id, lat/lng, status (SAFE/ROWDY) |
| `spirit_photos` | Drink gallery photos | spirit_id, user_id, image_url, serving_style, cocktail_name |
| `spirit_reviews` | Drink reviews | spirit_id, user_id, rating, text, serving_style |
| `spirit_chat_messages` | Drink lounge chat | spirit_id, user_id, message |
| `user_spirit_log` | Tasted drinks log | user_id, spirit_id (unique pair) |

### Views

| View | Purpose |
|------|---------|
| `spirits_with_stats` | Spirits + photo_count, review_count, avg_rating, cover_image_url |

### Seed Data

7 starter drinks: Old Fashioned, Macallan 12, Margarita, Guinness Draught, Hendrick's Gin, Negroni, Aperol Spritz.

---

## 9. API Layer

All methods on `api` object in `services/supabaseClient.ts`.

### Auth (`auth` export)

| Method | Description |
|--------|-------------|
| `signIn(email, password)` | Email/password login |
| `signUp(email, password, name, handle, dob)` | Registration with metadata |
| `signOut()` | End session |
| `getSession()` | Current session |

### Profiles

| Method | Description |
|--------|-------------|
| `getCurrentUser()` | Fetch + recover profile |
| `createProfile(userId, name, handle, dob?)` | Upsert profile |
| `updateProfile(userId, updates)` | Partial profile update |
| `updateProfileTheme(userId, css, js)` | Save custom theme |
| `updateUserLocation(userId, lat, lng, radius)` | GPS update |

### Posts & Social

| Method | Description |
|--------|-------------|
| `getPosts(viewType, user?, groupId?)` | Fetch filtered posts (GLOBAL_BAR, TOAST_IT, LOCAL_PUB, FRIENDS, GROUP) |
| `getPostsForUser(userId)` | User's own posts |
| `createPost(...)` | Create post with full metadata |
| `toggleReaction(postId, userId, type)` | Add/change/remove reaction |
| `getCommentsForPost(postId)` | Fetch comments |
| `addComment(postId, userId, content)` | Add comment |
| `reportPost(...)` | Submit moderation report |
| `blockUser(blockerId, blockedId)` | Block user |

### Groups & Chat

| Method | Description |
|--------|-------------|
| `getAllGroups()` | List all groups |
| `createGroup(name, desc, type, userId)` | Create room |
| `joinGroup(groupId, userId)` | Add self to public group members |
| `getGroupDetails(groupId)` | Group + messages |
| `sendMessage(groupId, userId, text)` | Send chat message |

### PourUp

| Method | Description |
|--------|-------------|
| `sendToast(postId, senderId, receiverId, message, type)` | Raise glass / clink |
| `respondToToast(interactionId, senderId, receiverId, response)` | Accept/decline |
| `createToastChat(user1Id, user2Id)` | Create TOAST match group |
| `getInteractionsForPosts(postIds, userId)` | Fetch user's interactions |

### Drinks

| Method | Description |
|--------|-------------|
| `getDrinks()` | All spirits with stats + user tasted flag |
| `getDrinkById(id)` | Single spirit detail |
| `getTastedDrinks(userId)` | User's tasted spirits |
| `getDrinkPhotos/Reviews/ChatMessages(spiritId, style?)` | Community content |
| `addDrinkReview/Photo/ChatMessage(...)` | User contributions |
| `toggleDrinkLog(userId, spiritId)` | Mark tasted/untasted |
| `uploadDrinkImage(file)` | Storage upload |

### Stories, Safety, Friends

| Method | Description |
|--------|-------------|
| `getStories()` / `createStory(...)` | Ephemeral stories |
| `getFriendIds(userId)` | Accepted friend IDs |
| `getBlockedUserIds(userId)` | Block list |
| `getAreaSafety(lat, lng, radius)` | Recent safety reports |
| `reportAreaSafety(userId, lat, lng, status)` | Submit safety pulse |
| `uploadImage(file)` / `uploadStoryImage(file)` | Post image uploads |

---

## 10. AI Services

All in `services/geminiService.ts`. Requires `GEMINI_API_KEY`; gracefully degrades without it.

| Function | Model | Purpose |
|----------|-------|---------|
| `generateSocialPost(topic)` | gemini-2.5-flash | Short social post text |
| `generateDrinkSuggestion(mood, occasion, preference)` | gemini-2.5-flash | Structured drink recommendation |
| `generateBarLensImage(prompt, base64, mime)` | gemini-2.5-flash-image | Image style transfer (Drink Cam) |
| `generateCSSTheme(prompt, isGroup)` | gemini-2.5-flash | Profile/group CSS theme |
| `generateDrunkenWisdom()` | gemini-2.5-flash | Bar wisdom quotes |
| `generateToastOfTheDay()` | gemini-2.5-flash | Daily toast for sidebar |
| `moderatePostContent(content)` | gemini-2.5-flash | PourUp safety moderation (JSON) |

### Moderation Rules (PourUp)

Flags only:
1. PII (addresses, phone, email)
2. Explicit meet-up instructions (precise location + time)
3. Dangerous behavior (binge drinking, DUI, violence, drugging)

Does **not** flag normal alcohol discussion terms.

---

## 11. Component Map

```
App.tsx
├── LandingPage
│   └── AuthScreen
├── Sidebar (+ Logo)
├── RightSidebar
├── Header
├── DrinkVerseDirectory
├── DrinkProfilePage
├── SipStream
│   ├── CreatePostModal
│   └── common (DrinkStories, SkeletonPost)
├── LocalPub
│   ├── TrendsTab, BarsTab, EventsTab (inline)
│   └── CreatePostModal
├── PourUp
│   ├── VibeTapModal
│   ├── ReportModal, MatchSuccessModal (inline)
│   └── CreatePostModal
├── BarSeshDirectory
│   └── CreateSeshModal
├── BarSeshView
├── ProfileCanvas
│   ├── ProfileSettingsModal
│   └── ProfileCustomization
│       └── CSSEditor
├── CreateStoryModal
├── WisdomModal (inline in App)
└── BarLensModal (inline in App)
```

### Removed Legacy Components

The following StrainVerse-era duplicates were removed (unused):
`HighlineFeed`, `LocalLoud`, `MatchIt`, `SocialSeshDirectory`, `SocialSeshView`, `StrainProfilePage`, `StrainVerseDirectory`, root `Sidebar.tsx`.

---

## 12. Data Flows

### Post Creation Flow

```
User writes post → CreatePostModal / inline creator
  → optional image upload (supabase storage "posts")
  → optional Gemini moderation (PourUp only)
  → api.createPost() with visibility + metadata
  → refreshCurrentViewPosts() + refresh myPosts
```

### Local Pub Radius Filter

```
User logs in → navigator.geolocation → api.updateUserLocation()
  → api.getPosts('LOCAL_PUB', user)
  → query visibility=LOCAL_PUB
  → calculateDistance() per post
  → filter posts where distance ≤ user.distanceRadius (or distance unknown)
```

### PourUp Match Flow

```
User B sends CLINK on User A's post
  → toastit_interactions insert
  → check for mutual CLINK (B→A exists while A→B pending)
  → if mutual: createToastChat() → groups insert (type=TOAST)
  → update both interactions status=TOASTED, group_id set
  → MatchSuccessModal → navigate to BarSesh
```

### Profile Theme Flow

```
User opens CSSEditor → edits CSS/JS or AI generates CSS
  → api.updateProfileTheme(userId, css, js)
  → refreshUser()
  → ProfileCustomization injects <style> + executes custom JS
```

---

## 13. Storage Buckets

| Bucket | Used For |
|--------|----------|
| `posts` | Post images, story images |
| `SpiritsVerse` | Drink directory photo uploads |

Both must exist in Supabase Storage with appropriate RLS policies for authenticated uploads.

---

## 14. Security & Moderation

### Row Level Security (RLS)

All tables have RLS enabled. Policies (simplified for development):
- **Profiles:** public read; owner insert/update
- **Posts:** public read; owner insert
- **Spirits:** public read
- **Everything else:** authenticated users full access

### User Status

- `profiles.status`: `active`, `shadow_banned`, `banned`
- Shadow-banned users' posts hidden from others (visible to self)

### Content Safety

- PourUp posts: Gemini AI moderation
- User reports: 6 categories → `reports` table
- User blocks: bidirectional fetch, excluded from PourUp feed

---

## 15. Deployment

### Build

```bash
npm run build
# Output: dist/ (static SPA)
```

### Hosting

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, etc.). Set environment variables in the hosting platform.

### Vite Config Notes

- `envPrefix: ['VITE_', 'NEXT_PUBLIC_']` — supports both naming conventions
- `GEMINI_API_KEY` injected via `define` as `process.env.API_KEY`
- Dev server: port 3000, host 0.0.0.0

---

## 16. Known Limitations & Future Work

| Area | Current State | Potential Enhancement |
|------|---------------|----------------------|
| BarSesh voice/video | UI banner only, no WebRTC | Integrate live audio/video SDK |
| Realtime chat | Manual refresh after send | Supabase Realtime subscriptions |
| Friend system | API exists, no UI for requests | Friend request/accept UI |
| Venue field on posts | Supported in schema, not in create modal UI | Add venue input to post creator |
| Push notifications | None | Supabase Edge Functions + FCM |
| PourUp geolocation | City/state match only | GPS radius matching |
| Drink search | Client-side filter | Full-text search via Postgres |
| Image CDN | Direct Supabase URLs | CDN layer for performance |
| Tests | None | Vitest + Playwright E2E |
| i18n | English only | Localization framework |

---

## Appendix: Type Reference

Key types defined in `types.ts`:

- `AppView`, `User`, `Post`, `Group`, `Drink`, `Story`
- `PostVisibility`, `ReactionType`, `ReportCategory`
- `PourUpInteraction`, `PourUpInteractionType`, `PourUpInteractionStatus`
- `DrinkPhoto`, `DrinkReview`, `DrinkChatMessage`
- `SafetyReport`, `Badge`, `Widget`, `UserRole`

---

*Last updated: July 2026*
