# Project Updates Log

## Date: June 11, 2026

Today we made significant improvements to the app's design, fixed several major authentication bugs, and added powerful new features regarding user profiles and post management.

### ✨ New Features & Improvements
- **Complete Visual Overhaul**: Redesigned the Landing Page and application layout using a beautiful, premium light/indigo theme featuring modern glassmorphism effects and clean white cards.
- **Dynamic Age Display**: The Feed sidebar now actively fetches the logged-in user's profile data, automatically calculates their age from their Date of Birth, and displays it in a clean "username | age" format.
- **Cinematic Loading Animations**: Added sophisticated, full-screen blur overlays with loading spinners across all major actions. You now get a smooth 2-second animation when: Signing Up, Logging In, Creating a Profile, Creating a Post, and Logging Out.
- **Resend OTP Functionality**: Added a highly requested "Resend OTP" button on the verification screen so users aren't locked out if their code expires.
- **Dynamic Post Authors**: Posts are no longer anonymous! The database now securely attaches the creator to every post, and the feed dynamically displays the real avatar and username of whoever created the post.
- **Delete Your Own Posts**: You can now delete posts! If you are the creator of a post, a red trash icon will appear on it.
- **Custom Delete Modal**: Instead of using an old-fashioned browser pop-up, we built a beautiful custom React component (`DeleteConfirmModal`) with smooth animations to confirm post deletions.

### 🐛 Bugs & Problems Solved
- **Invalid OTP Bug**: Fixed a routing issue where the frontend and backend were mismatching methods, which incorrectly caused an "invalid otp" error even when the right code was entered.
- **401 Unauthorized / Session Timeouts**: Fixed a critical issue where the frontend was "forgetting" the user's login session. We solved this by strictly adding `{ withCredentials: true }` to all Axios API requests across the board.
- **Login Loop Prevention**: Fixed a problem where users who verified their email but failed to create a profile were getting stuck. Now, if you log in and don't have a profile setup, the system smartly detects it and sends you straight to the "Create Profile" screen.
- **Log Out Button Styling**: Fixed a minor CSS bug where a weird native browser outline was appearing around the "Log Out" button when clicked.

---

## Date: September 26, 2026

Today we implemented the complete **Account Settings & Safety** suite spanning Account Control, Community Safety, and Supporter Membership Badges.

### ✨ New Features & Architecture
- **Account Control Hub**:
  - **Email Address Management**: Members can update their primary login email address with current password identity verification and duplicate prevention (`PUT /api/account/email`).
  - **Password Change**: Added secure password updates with minimum length validation, automatic bcrypt re-hashing, and immutable security audit event logging (`PUT /api/account/password`).
  - **Permanent Account Deletion (Danger Zone)**: Implemented full cascade account deletion with double confirmation (typing "DELETE" + password check). Permanently wipes user profile, posts, photo history, boards, comments, likes, notifications, sessions, and messages (`DELETE /api/account/delete`).
- **Community Safety & Anti-Spam Architecture**:
  - **Community Standing Badge**: Live safety status indicator (`<CommunityStandingBadge />`) displaying account trust score (100%), verified crew badge, and clean spam standing.
  - **Community Reporting Center (`ReportModal.jsx`)**: Comprehensive modal to report spam, harassment, inappropriate media, hate speech, or impersonation (`POST /api/safety/report`). Directly accessible from post menus, user profiles, and settings.
  - **Blocked Crew Management**: Complete block/unblock system with interactive blocked user list (`GET /api/safety/blocked`, `POST /api/safety/block/:id`, `POST /api/safety/unblock/:id`).
  - **Live Community Safety Guidelines**: Dynamic safety banners keeping the cabin friendly, respectful, and zero-spam.
- **Premium Supporter Member Badges & Creator Perks**:
  - **4 Supporter Tiers (`<MemberBadge />`)**: Passenger (Standard), 🚀 Creator Pro, 👑 Gold VIP, and 💎 Diamond Supporter (First Class).
  - **Ubiquitous Visual Distinction**: Badges displayed next to usernames across `MyProfile`, `UserProfile`, `Feed` post authors, and `SearchCrew` member cards.
  - **Custom Cabin Theme Accents**: Supporter exclusive accent glows (Royal Gold, Cosmic Violet, Cyan Diamond, Rose Quartz, Midnight Emerald).
  - **VIP Bio Flair**: Custom supporter taglines displayed across profile cards and post cards.
  - **Unified Account Settings Modal (`AccountSettingsModal.jsx`)**: Clean glassmorphic 3-tab modal accessible from `MyProfile` and `Sidebar`.
- **Connecting with Google & Cloud Photo Backup**:
  - **Side-by-Side Dual Authentication (`Authentication.jsx`)**: Added "Continue with Google" action with official Google G branding and subtle divider lines to both the Sign In and Create Account panels, while strictly preserving 100% of existing email/password registration, OTP verification, and privacy modal validation.
  - **Google Identity Services (GSI) Integration**: Secure popup OAuth flow via `google.accounts.oauth2.initTokenClient` and One-Tap credential listener.
  - **Backend Google Auth Engine (`POST /api/auth/google`)**: Multi-layered token verification (Google tokeninfo + OAuth2 userinfo endpoints), automatic profile creation with Google profile picture, username generator, 7-day refresh JWT cookie, 15-minute access token, and security event logging.
  - **Cloud Photo Backup Toggle (`GET & PUT /api/auth/cloud-backup`)**: Added cloud photo backup preference (`cloudBackupEnabled`) to User model and a dedicated control card in `AccountSettingsModal` allowing users to toggle or pause automated cloud photo sync with encrypted cloud storage.
- **Universal Overlay Card System (Zero Browser Tab Pop-ups)**:
  - **No More Native Dialogs**: Permanently eliminated all browser tab popups (`window.alert`, `window.confirm`) across the application, replacing them with modern, glassmorphic centered overlay cards with backdrop blur.
  - **Context Provider (`OverlayCardContext.jsx`)**: Built a full React context and global dispatcher (`overlayCard.success`, `overlayCard.error`, `overlayCard.info`, `overlayCard.confirm`).
  - **Rich Interactive Aesthetics**:
    - **Success Cards**: Emerald badging, sparkling checkmark icon, countdown progress bar, and "Awesome" / "OK" action.
    - **Failure / Error Cards**: Rose badging, alert triangle icon, detailed explanation, and "Dismiss" action.
    - **Confirmation Cards**: Amber / danger rose badging with custom confirmation and cancel buttons returning Promise-based resolutions.
  - **Comprehensive Codebase Refactor**: Updated `MyProfile.jsx` (profile updates, username checks, bio updates, post deletions, profile sharing), `Feed.jsx`, `CreatePost.jsx`, `PhotoCropperModal.jsx`, `Chats.jsx` (message deletions, category deletions, copy actions, location saves), and `ActiveLocationCenterModal.jsx`.
- **Pronouns Dropdown Selector (`MyProfile.jsx`)**:
  - Replaced the free-form text input with a styled dropdown select featuring standard inclusive presets: `Prefer not to say`, `he/him`, `she/her`, `they/them`, `he/they`, `she/they`, `any pronouns`, and `Other / Custom...`.
  - Added dynamic input reveal for custom pronouns (e.g. `ze/zir`), allowing members full flexibility while making common selections a one-tap choice.

---

## Date: September 27, 2026

Today we delivered a comprehensive suite of enhancements spanning **Dual Deck Space Creation**, **Universal Share UI Overlay**, **Crew Birthday Alert Fix**, **Authentic Character Avatars**, **Reel Player continuous playback**, and **User Profile Modernization**:

### ✨ New Features & Architecture
- **Dual Deck Creation Flow & Space Orchestration (`DualDeck.jsx`)**:
  - Engineered the full **Create Deck Modal** (`CreateDeckModal`) with partner selection from authentic community characters (`Elena Rostova`, `Chloe Chen`, `Maya Lin`, `Sarah Mitchell`) or custom friend handle input.
  - Interactive emoji picker, relationship label chips (`Partner`, `Best Friend`, `Sibling`, `Travel Buddy`, `Creative Duo`), 6 curated gradient themes, and anniversary date picker.
  - Integrated interactive dashed `+ Create New Deck` card in the deck selector carousel and dynamic deck initialization into React state with complete starter memories, bucket list items, and love notes.
  - Added in-deck `+ New Deck` fast-switcher button in the active deck header for seamless switching.
- **Dual Deck Scrapbook Media Management (`DualDeck.jsx`)**:
  - Implemented multiple paths to add photos to Scrapbook chapters: "+ New Chapter" dashed upload card, "Add Photos" modal in chapter headers with direct file selector, dynamic multi-image preview, and timestamped chapter galleries.
- **Universal Share UI Overlay (`ShareModal.jsx`)**:
  - Replaced browser share links with a comprehensive 2-tab glassmorphic sharing overlay.
  - **Direct Crew & Friends Delivery**: Real-time crew search, personalized note attachments with 1-click emoji reaction chips (`🔥`, `👀`, `🚀`, `💯`, `❤️`, `🙌`, `😂`, `✨`), instant dispatch to squad conversations (`/api/squads/:id/messages`) and 1-on-1 direct messaging (`/api/chat/conversations/direct`).
  - **External Platform Integrations**: 1-click WhatsApp deep link, intelligent ChatGPT prompt generation ("Analyze/Discuss this post from OnBoard..."), X (Twitter), Telegram, LinkedIn, Reddit, Email, QR code generator, and native device share sheet.
  - Seamlessly integrated across `Feed.jsx` (post dropdown & card footer share button), `ExplorePostModal.jsx`, and `MyProfile.jsx`.
- **Crew Birthday Alert Fix & Notification System**:
  - Resolved silent Mongoose schema validation failure by registering `"CREW_BIRTHDAY"` in `type` enum and `"open_profile"`, `"wish_birthday"` in `actionType` enum of `notification.model.js`.
  - Upgraded `sendBirthdayAlertsToCrew` in `profile.controller.js` to resolve all crew members (both following and followers) and dispatch a live test notification to the user themselves (`actor: null` to bypass self-notification filter).
  - Customized birthday notification card in `NotificationCard.jsx` featuring birthday cake badge (`🎂`), festive message, and 1-tap "Wish Happy Birthday! 🎉" action button.
  - Connected `handleTriggerBirthdayAlert` to global alert toasts in `MyProfile.jsx`.
- **Reel Player Continuous Playback & Adaptive Controls (`ReelPlayerModal.jsx`)**:
  - Continuous playback looping with randomized reel sequencing for uninterrupted discovery.
  - Video quality controls (144p to 1080p, auto), scanline overlay, double-tap heart burst, and gesture controls.
- **Authentic Character Avatars Across Platform**:
  - Upgraded mock users and social proof across `LandingPage.jsx`, `DualDeck.jsx`, `dualDeckData.js`, and `ShareModal.jsx` to use authentic, high-resolution portrait avatars of real characters (Elena Rostova, Chloe Chen, Maya Lin, Sarah Mitchell) replacing generic placeholders and letter fallbacks.
- **Profile Card Decluttering (`MyProfile.jsx`)**:
  - Removed bulky and redundant action buttons from the main profile header card (*Settings & Safety*, *Public/Private*, and *Save Avatar*).
  - Streamlined the profile card action row into two clean, elegant buttons: **`Edit Profile`** (primary slate-900 pill) and **`Share`** (minimalist white border button).
- **Navbar-Integrated Community Standing**:
  - Relocated the **`CommunityStandingBadge`** (*Good Standing 100% Trust Score*) from the profile card directly into the top sticky navbar row alongside the "Profile" heading.
  - Clicking the badge from the navbar continues to open the comprehensive `AccountSettingsModal`.
- **Contextual Avatar Action Dropdown**:
  - Clicking on the user's avatar in `MyProfile.jsx` now reveals an interactive floating mini-menu with smooth popover animation:
    - 📥 **Download Avatar**: 1-tap download of the avatar picture.
    - 📷 **Change Photo**: Instant shortcut to profile picture upload and cropping.
    - 🕒 **Photo History**: Access to historical avatar timeline.
  - **Privacy Protected**: Exclusively active for the authenticated user's own profile; visitor profiles (`UserProfile.jsx`) cannot download other members' avatars.
- **Account Privacy Switch in Edit Profile**:
  - Added an intuitive **Account Privacy** toggle card into the unified `Edit Profile` modal with clear explanations for Public Cabin vs. Private Cabin.
  - Wired into backend `PUT /api/profile/update` to persist `isPrivate` seamlessly.
- **Responsive Vibe Status Repositioning ("In My Zone")**:
  - Re-anchored the vibe status chip inline beside the `@username` handle with responsive text truncation (`max-w-[120px] sm:max-w-[200px]`), preventing awkward multi-row wrapping.
- **Messaging Directionality & Seen Indicators (`Chats.jsx`)**:
  - Added message seen status tags and ensured reply chips and emoji reactions align contextually based on sent vs. received direction.
- **Live Username Auto-Availability & Database Recycling**:
  - Real-time debounced check as users type without requiring an explicit check button.
  - Previous usernames are instantly released and recycled in MongoDB when changed, allowing other members to claim them immediately.
  - Orphan handle purging automatically releases handles from deleted user records.

---

## Date: September 28, 2026

Today we implemented the complete **Chapters (Life Timeline)** architecture, giving OnBoard its signature feature to organize life milestones instead of an endless random stream of photos.

### ✨ New Features & Architecture
- **Chapter Data Engine (`chapter.model.js`, `chapter.controller.js`, `chapter.routes.js`)**:
  - Dedicated MongoDB schema for user life chapters with `title`, `emoji`, `timeframe`, `description`, `coverImage`, `isPrivate`, and linked `posts`.
  - Full CRUD API mounted at `/api/chapters`:
    - `GET /api/chapters/me`: Fetch all chapters for the logged-in user with post thumbnails.
    - `GET /api/chapters/user/:userId`: Fetch public chapters for any member.
    - `POST /api/chapters`: Create chapter with optional post bundling.
    - `PUT /api/chapters/:id`: Update chapter details and adjust photos.
    - `DELETE /api/chapters/:id`: Delete chapter while preserving underlying posts.
    - `POST /api/chapters/:id/add-posts`: Add existing photos to a chapter.
  - Linked post schema with `chapter` field in `post.model.js`.
- **Profile Chapters Tab (`MyProfile.jsx` & `UserProfile.jsx`)**:
  - Added **`[ 📖 CHAPTERS ]`** tab directly on profile navigation alongside `[ POSTS ]` and `[ SAVED ]`.
  - Visual Chapter Cards displaying emoji badge, cover image, timeframe pill (e.g. `🗓️ 2022 - 2026`), photo count badge, and story description.
  - Interactive `+ Add New Chapter` dashed card for quick creation.
- **Interactive Modals (`CreateChapterModal.jsx` & `ChapterDetailModal.jsx`)**:
  - **`CreateChapterModal`**: Icon selector (🎓 College, ✈️ Travel, 🚀 Startup, 💼 Career, 🏖️ Vacation, etc.), title, timeframe, description, and multi-select photo bundling from existing uploads.
  - **`ChapterDetailModal`**: Hero cover banner, story description, photo count, photo grid lightbox viewer, inline "Add Photos" drawer, and edit/delete controls for owners.
- **Create Post Integration (`CreatePost.jsx`)**:
  - Added an intuitive **"Add to Chapter"** selector dropdown so new uploads can be directly tagged to an existing life chapter.

---

## Date: September 28, 2026 (Part 2)

Today we engineered the centralized **OnBoard Pulse™ Interaction Engine**, giving OnBoard its signature tactile heartbeat with zero-latency synthesized audio, haptic taps, and connection micro-moments.

### ✨ New Features & Architecture
- **Centralized Pulse Engine (`frontend/src/utils/pulseEngine.js`)**:
  - Built-in Web Audio API synthesizer generating clean, pleasant micro-sounds directly in code (0ms latency, zero audio asset downloads):
    - 💬 **`messageSent()`**: Soft warm wooden "tuk" (45ms).
    - 📨 **`messageReceived()`**: Gentle two-note chime (E5 -> G#5).
    - ❤️ **`like()`**: Resonant heart pop (340Hz -> 540Hz).
    - 🫂 **`boardAccepted()`**: Signature connection triad chord (C5 - E5 - G5 harmonic chimes).
    - 🫂 **`boardRequested()`**: Subtle airy whoosh + click.
    - ❌ **`boardRejected()`**: Gentle downward tick.
    - 📝 **`postPublished()`**: Ascending airy release chime (440Hz -> 880Hz).
  - Integrated mobile haptics (`navigator.vibrate`) with micro-taps.
  - Subscription event emitter for cross-component pulse coordination.
- **Micro-Moment Visual Host (`PulseVisualHost.jsx`)**:
  - Signature connection overlay whenever boarding is accepted: `"🫂 Connection Established • You are now Boarded with @name"`.
  - Floating confirmation pill on post publish: `"✨ Shared to Your World"`.
  - Mounted globally in `App.jsx`.
- **Wired Across All Core Actions**:
  - `Chats.jsx`: `pulse.messageSent()` on outgoing messages, `pulse.messageReceived()` on incoming messages from others.
  - `UserProfile.jsx`: `pulse.boardAccepted()`, `pulse.boardRequested()`, `pulse.like()`.
  - `CreatePost.jsx`: `pulse.postPublished()` upon publishing.
  - `Feed.jsx` & `MyProfile.jsx`: `pulse.like()` on liking posts.
- **Account Control Hub Controls (`AccountSettingsModal.jsx`)**:
  - Added dedicated **OnBoard Pulse™ System V1** control card with sound/haptic toggles and interactive test preview buttons (💬 Tuk, ❤️ Pop, 🫂 Connection Chord).

---

## Date: September 28, 2026 (Part 3)

Today we solved the boarding request backfire bug, decluttered the Feed layout, and introduced **Crew Currents 🌊** (OnBoard's 24-hour Story/Status feature).

### ✨ New Features & Layout Polish
- **Feed Stream Decluttering**:
  - **Removed Redundant Switcher Bar**: Removed the `[My Crew] [Discover Waves] [Horizon]` tab switcher from the feed center column, since discovery and waves are already dedicated to the Discover page (`/discover`).
  - **Removed "Crew Live" Badge**: Cleaned up the top banner space.
  - **Compact Navbar Greeting**: Relocated the dynamic time-of-day greeting (e.g. `⚡ Afternoon flow, digvijay`) into the top Navbar header as a compact, unobtrusive pill that preserves full search and action space.
- **Crew Currents 🌊 (24-Hour Story/Status Feature)**:
  - Built and mounted `<CrewCurrents />` (`frontend/src/components/CrewCurrents.jsx`) directly above the feed stream.
  - **Horizontal Flow Strip**: Shows "Your Current" card with a quick `+` add trigger, followed by crew members with gradient aura rings indicating active unread currents.
  - **Dual Mode Creation Modal**:
    - **Text Flow**: Type custom thoughts with 5 curated gradient backgrounds (Ocean Flow, Deep Tide, Sunset Drift, Aqua Coast, Midnight Stream).
    - **Photo Current**: Upload photos with captions.
  - **Interactive Fullscreen Viewer**:
    - Animated auto-advancing progress bars (5 seconds per slide).
    - Tap left for previous, tap right for next, hold/press to pause.
    - Author avatar, username, and time-ago indicator.
    - Quick emoji reactions (`🔥`, `❤️`, `⚡`, `🌊`, `👏`) with instant `pulse.pop()` audio feedback.
- **Boarding Request Toggle Fix**:
  - **Root Cause Resolved**: The backend `/board` endpoint was blindly toggling existing requests in MongoDB, causing requests to be cancelled when clicking "Board".
  - **Explicit Intent Payload**: Added `{ action: "request" | "cancel" | "unboard" }` handling in `profile.controller.js` and wired it into `Feed.jsx`, `SearchCrew.jsx`, `UserProfile.jsx`, and `UserSearchDropdown.jsx`.
  - Guaranteed that clicking "Board" always stays on **"Requested"** without ever backfiring.




