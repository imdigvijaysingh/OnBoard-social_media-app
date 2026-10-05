# OnBoard App - Feature Roadmap & Upcoming Plan

A streamlined roadmap of active priorities, upcoming features, and future scaling milestones for OnBoard.

---

## 1. Active Priorities (Next Up)

### 🔕 Busy Status, In-Flight Silence & Granular Chat Mute (Focus Mode)

> [!NOTE]
> **Core Concept**: Protect user attention and digital well-being by providing a two-tier silence control:
> 1. **Global Busy / In-Flight Mode**: Silences all incoming message, call, and social notification toasts and sounds across the entire app for a set duration or indefinitely.
> 2. **Per-Conversation Granular Mute**: Silences specific direct or group chats for 10 minutes, 1 hour, 8 hours, or until manually unmuted.

#### 🎯 Feature Breakdown & UX Design

1. **Tier 1: Global "Busy / In-Flight" Mode (App-Wide Silence)**:
   - **One-Tap Switch**: Located in the Header, Sidebar, and Notification Settings drawer (`✈️ In-Flight / Busy Mode`).
   - **Timed Durations**:
     - ⏱️ `30 Minutes` (Power focus / short study block)
     - ⏱️ `1 Hour` (Meeting / class / workout)
     - ⏱️ `8 Hours` (Sleep / work shift)
     - 🛑 `Until I turn it off` (Manual override)
   - **Notification Suppression Rules**:
     - Silences all floating toasts, audio chimes, and push notifications for chat messages, incoming calls, and social double-taps.
     - **Safety Exception**: Critical account security alerts (new login from unknown device, password change) bypass Busy mode to ensure account protection.
   - **Crew Status Visibility**:
     - Connected crew members see a calm status indicator (e.g., `✈️ In-Flight · Busy`) in chat headers and profile stubs, setting clear expectations that the user is offline/focusing.

2. **Tier 2: Individual Conversation Mute (In-Cabin Silence)**:
   - **Trigger**: Bell icon `🔔` in the active chat header or right-click / three-dot context menu on any conversation card in `/chats`.
   - **Granular Durations**:
     - ⏱️ **10 Minutes** (Quick cool-down from active group chatter)
     - ⏱️ **1 Hour** (Stepping away during a meeting)
     - ⏱️ **8 Hours** (Overnight / full work day)
     - 🔕 **Until I unmute it** (Permanent silence until toggled back on)
   - **Mute Indicators**:
     - Muted conversations display a subtle muted bell icon (`🔕`) next to the conversation title in the left-hand chat list.
     - Unread badge counters still increment quietly in the background without triggering audio chimes or floating toast popups.
   - **One-Click Unmute**: Clicking the `🔕` icon in the chat header immediately restores normal notifications.

---

#### 📋 Step-by-Step Implementation Tasks

##### 🎯 Phase 1: Database Schemas & Models (Backend)
- [ ] **Task 1.1: Global Busy Mode in `notificationPreference.model.js`**:
  - Add `busyMode` object to `notificationPreferenceSchema`:
    ```javascript
    busyMode: {
      enabled: { type: Boolean, default: false },
      until: { type: Date, default: null }, // null means indefinite until manual toggle
      autoDisableAt: { type: Date, default: null }
    }
    ```
- [ ] **Task 1.2: Verify Conversation Member Schema (`conversationMember.model.js`)**:
  - Optimize `{ conversation: 1, user: 1, mutedUntil: 1 }` index for instant lookups during message fan-out.

##### 🎯 Phase 2: Controller & Notification Suppression Logic (Backend)
- [ ] **Task 2.1: Chat Notification Suppression in `chat.controller.js`**:
  - Update `sendMessage` fan-out loop: before calling `createNotification`, query the recipient's `conversationMember.mutedUntil` and `notificationPreference.busyMode`.
  - If `recipient.busyMode.enabled && (recipient.busyMode.until === null || recipient.busyMode.until > now)`, skip sending message notification.
  - If `member.mutedUntil && member.mutedUntil > now`, skip sending message notification.
- [ ] **Task 2.2: Chat Mute API Endpoints in `chat.routes.js`**:
  - `POST /api/chat/conversations/:id/mute`: Accepts `{ duration: "10m" | "1h" | "8h" | "indefinite" }`. Computes target date and updates `conversationMember.mutedUntil`.
  - `POST /api/chat/conversations/:id/unmute`: Resets `conversationMember.mutedUntil = null`.
- [ ] **Task 2.3: Global Busy Mode Endpoints in `notification.routes.js`**:
  - `PUT /api/notifications/busy-mode`: Accepts `{ enabled: Boolean, duration: "30m" | "1h" | "8h" | "manual" }`.
  - `GET /api/notifications/busy-mode`: Returns current busy status and remaining countdown seconds.

##### 🎯 Phase 3: Frontend UI Components & Interactive Controls
- [ ] **Task 3.1: Global Busy / In-Flight Mode Toggle**:
  - Add a quick toggle pill button in the top navigation / sidebar of `Feed.jsx` and `Chats.jsx`.
  - When active: emits an amber/indigo pulse with remaining time countdown tooltip (*"✈️ In-Flight: 42m remaining"*).
  - Clicking opens a clean modal or popover with duration selector buttons and a prominent **[ Turn Off ]** button.
- [ ] **Task 3.2: Chat Header Mute Modal / Dropdown (`Chats.jsx`)**:
  - Add a Bell icon button (`🔔` / `🔕`) in the conversation header.
  - Clicking opens a stylish glassmorphic popover:
    - `[ 10 Minutes ]`
    - `[ 1 Hour ]`
    - `[ 8 Hours ]`
    - `[ Until I Unmute ]`
  - If already muted, display remaining duration and an instant **[ Unmute Chat ]** action.
- [ ] **Task 3.3: Visual Mute Badges in Conversation List**:
  - Render an unobtrusive `🔕` badge alongside conversation preview snippets for all muted chats.
  - Suppress browser sound chimes and floating toasts if active chat is currently muted.

---

### 🛡️ Content Protection & Anti-Screenshot Shield (Extreme Privacy & Zero-Leak Cabin)

> [!CAUTION]
> **⭐ HIGH-PRIORITY PRIVACY PILLAR: ZERO-LEAK CONTENT PROTECTION & CASUAL THEFT DEFENSE ⭐**
> - **Core Mission**: Guarantee that personal memories, VIP profiles, and intimate cabin photos cannot be casually scraped, saved, or leaked without direct accountability.
> - **The Big Questions Answered**:
>   - **Is it a good idea?**: **YES, ABSOLUTELY.** OnBoard is designed as an intimate, anti-algorithmic social space. Protecting users from non-consensual image hoarding, scraping bots, and anonymous sharing builds unmatched trust, positioning OnBoard ahead of mainstream platforms like Instagram or Twitter.
>   - **Is it technically feasible?**:
>     - **In Web Browsers (Chrome / Safari / Edge / Firefox)**: **90–95% Effective against casual theft.** The browser sandbox prevents web pages from completely blocking OS-level hardware keys (like physical keyboard `PrtScn` or external phone cameras), but we can eliminate direct downloads, disable right-click / drag, trigger instant blur on snipping tool defocus, clear the clipboard, and render forensic viewer watermarks.
>     - **In Native Mobile Apps (Android / iOS via Capacitor / React Native)**: **100% Kernel-Level Enforceable.** On mobile, Android's `FLAG_SECURE` and iOS's secure view controllers physically blackout the screen during screenshots and screen recordings (identical to banking apps and Netflix).

---

#### 🏷️ Key Architectural Badges & Core Principles
- **`[TAG: EXTREME-PRIVACY-SHIELD]`**: Maximum default protection active on all posts and user profiles.
- **`[TAG: OWNER-ONLY-DOWNLOADS]`**: Direct photo download buttons are strictly limited to the creator of the post.
- **`[TAG: DOM-ANTI-SCRAPE]`**: Context menu, drag-and-drop, and CSS touch-callouts completely disabled on media.
- **`[TAG: DEFOCUS-BLUR-TRAP]`**: Instant `backdrop-filter: blur(40px)` activates whenever snipping tools steal browser focus.
- **`[TAG: FORENSIC-WATERMARKING]`**: Dynamic, semi-transparent `@viewer_username` stamped across media to deter external phone photos.
- **`[TAG: SNAPCHAT-ALERT-DISPATCH]`**: Real-time push alert dispatched to creator when screenshot shortcuts are trapped.
- **`[TAG: MOBILE-FLAG-SECURE]`**: Native mobile container hardening for 100% hardware screenshot prevention.

---

#### 🎯 The 6-Layer Multi-Defense Architecture

```
                                  USER ATTEMPTS IMAGE SAVE / SCREENSHOT
                                                    │
             ┌──────────────────────────────────────┼──────────────────────────────────────┐
             ▼                                      ▼                                      ▼
     [Layer 1: Download]                   [Layer 2: Mouse/Touch]                 [Layer 3: Snipping Tool]
  Only post owner sees Download       Right-click & Drag disabled via        Window blur event instantly
   button. Blocked for others.         transparent overlay + CSS lock.         applies 40px frosted blur.
             │                                      │                                      │
             └──────────────────────────────────────┼──────────────────────────────────────┘
                                                    │
             ┌──────────────────────────────────────┴──────────────────────────────────────┐
             ▼                                                                             ▼
   [Layer 4: Forensic Watermark]                                                [Layer 5: Shortcut Trap]
 Dynamic `@viewer_username` tiled across                                      `PrintScreen` / screenshot keys
 media. Leaks immediately trace to culprit.                                  wipe clipboard + alert post creator.
```

1. **Layer 1: Owner-Only Download Permissions (`isOwner` Verification)**:
   - The direct **Download Photo** button created in the media suite is strictly rendered **only for the post owner**.
   - Other users/crew members see only the bookmark/save button (which saves within their private in-app collection, never to their local device disk).
   - Optional future toggle: Post creators can choose to check *"Allow crew to download my photo"* if they want to share high-res originals.

2. **Layer 2: DOM & Interaction Lock (Anti-Right-Click & Anti-Drag)**:
   - Transparent interceptor layer rendered directly over media with CSS properties:
     ```css
     user-select: none;
     -webkit-user-drag: none;
     -webkit-touch-callout: none;
     pointer-events: none;
     ```
   - Intercepts `onContextMenu={(e) => e.preventDefault()}` and `onDragStart={(e) => e.preventDefault()}` to eliminate desktop right-click *"Save Image As..."* and mobile browser long-press image downloads.

3. **Layer 3: Snipping Tool Defocus Shield (`window.onblur`)**:
   - Whenever an external snipping tool (e.g., Windows Snipping Tool `Win+Shift+S`, Lightshot, Greenshot, macOS Grab) is activated, the browser window instantly loses focus (`window.onblur` fires).
   - React hook `useScreenshotProtection()` detects this instant blur and covers the active photo with a frosted privacy curtain (`backdrop-filter: blur(50px); background: rgba(0,0,0,0.85);`) with a safety message: *"🔒 Content hidden while screen capture utility is open"*.

4. **Layer 4: Forensic Viewer Ghost Watermark (Psychological Leak Neutralizer)**:
   - When viewing full-screen photos in the lightbox, a dynamic, faint diagonal SVG pattern renders across the image with the **viewer's own username and timestamp**:
     `"Viewed by @digvijay · OnBoard Private Cabin · 26 Sep 2026"`
   - **Why this works**: Even if a user bypasses browser controls using a second smartphone camera, the photo has their own identity stamped into it. They cannot leak it anonymously without exposing themselves as the source.

5. **Layer 5: PrintScreen Key Trap & Snapchat-Style Alert Dispatch**:
   - Client-side listener catches keyboard capture combinations (`PrintScreen`, `Win+Shift+S`, `Cmd+Shift+3/4`).
   - Immediately clears the system clipboard (`navigator.clipboard.writeText("")`).
   - Dispatches a lightweight event to backend: `POST /api/posts/:id/screenshot-alert`.
   - The post creator receives a real-time notification: *"📸 @someone took a screenshot of your post"* (mirroring Snapchat's signature accountability feature).

6. **Layer 6: Mobile Native App Hardening (`FLAG_SECURE`)**:
   - When OnBoard is compiled for Android/iOS via Capacitor or React Native, kernel-level flags are engaged:
     - **Android**: `window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);`
     - **iOS**: Wrapping views with secure textfield layers or listening for `UIScreen.capturedDidChangeNotification`.
   - The screen physically turns pitch black on any screenshot or video screen recording.

---

#### 📋 Step-by-Step Implementation Tasks

##### 🎯 Phase 1: Access Control & Owner-Only Downloads
- [ ] **Task 1.1: Restrict Download Buttons in UI**:
  - Update `Feed.jsx`, `MyProfile.jsx`, and `UserProfile.jsx`: check if `currentUserId === post.user?._id || currentUserId === post.user`.
  - Only show the "Download Photo" button if the user is the original creator.
  - Hide avatar download button on foreign profiles in `UserProfile.jsx`.
- [ ] **Task 1.2: Creator Permission Toggle (`allowCrewDownloads`)**:
  - Add `allowCrewDownloads: { type: Boolean, default: false }` to `post.model.js`.
  - In `CreatePost.jsx`, add an optional privacy toggle: *"Allow crew members to download this photo"* (default: OFF).

##### 🎯 Phase 2: Client-Side Interaction Locks & Defocus Shield
- [ ] **Task 2.1: Reusable `ImageProtectionShield.jsx` Component**:
  - Create a lightweight protective wrapper around all post and profile images:
    - Transparent blocking pseudo-element to prevent right-click context menu.
    - Drag-and-drop event prevention.
    - Disable image copy shortcut keys (`Ctrl+C` on images).
- [ ] **Task 2.2: `useScreenshotProtection` Hook**:
  - Listen for `window.onblur`, `document.visibilitychange`, and `keydown` (`PrintScreen`).
  - When snipping tool opens, dynamically engage privacy blur over open modals and post lightboxes.
  - Clear clipboard text/image on `keyup` of `PrintScreen`.

##### 🎯 Phase 3: Forensic Dynamic Watermark Overlay
- [ ] **Task 3.1: Canvas/SVG Ghost Watermark Generator**:
  - Create `ViewerWatermarkOverlay.jsx` to render diagonal repeating text with viewer's `@username` at 10-12% opacity.
  - Seamlessly blends over lightbox photos without ruining normal viewing aesthetics.
  - Ensure watermark sits above the image element and cannot be deleted via simple element inspector without triggering canvas re-render.

##### 🎯 Phase 4: Snapchat-Style Creator Alert System
- [ ] **Task 4.1: Screenshot Detection Event Route**:
  - Add backend route `POST /api/posts/:id/screenshot-alert`.
  - Creates a high-priority alert notification in `notification.model.js` directed to the post creator.
- [ ] **Task 4.2: In-App Creator Alert Toast**:
  - Renders a distinctive notification badge: *"📸 @username captured a screenshot of your cabin photo"*.

##### 🎯 Phase 5: Mobile App Store Packaging (Capacitor Bridge)
- [ ] **Task 5.1: Native `FLAG_SECURE` Capacitor Plugin**:
  - Integrate `@capacitor-community/privacy-screen` or native Android flag to enable true hardware-level screenshot blackout on mobile devices.

---

### Smooth Background Uploads
- Safe automatic photo uploading that quietly tries again if your internet connection temporarily drops.

---

## 2. Future Enhancements & Scaling (Roadmap)

### Crew Milestone Celebrations (Confetti Sprinkles)
- **Milestone Ladder**: Trigger vibrant celebration sprinkles whenever you reach a crew milestone:
  - 1st member (*The Pioneer*)
  - 5th member (*The Squad*)
  - 10th member (*The Inner Circle*)
  - 25th, 50th, 100th, 500th, 1K, 10K, 100K, and 1M members!
- **Offline Celebration Delivery**:
  - If a member accepts your request while you are offline, OnBoard saves the celebration in an offline queue.
  - As soon as you open the app, the celebration sprinkles and achievement badge greet you automatically.

### High-Speed Performance & 10,000 User Scaling Plan
- **Lightning-Fast Memory Cache (Redis)**:
  - Save frequently viewed member profiles, bios, and crew counts in high-speed RAM.
  - Reduces database workload by 80–90%, making profiles load instantly.
- **Smart Database Optimization**:
  - Add compound indexes on usernames, crew lists, and post dates so searches return results in milliseconds.
- **Smooth Infinite Scroll (Pagination)**:
  - Load 10 to 15 posts at a time as members scroll, preventing lag and saving mobile data.
- **Multi-Core Server Power (Cluster Mode)**:
  - Run the Node.js server across all available processor cores with PM2 so thousands of users can be online simultaneously without delays.
- **Community Anti-Spam Shield**:
  - Protect login and connection requests with rate limiting to block bots and keep OnBoard safe.

---

## 3. 🧠 Autonomous Smart Feed & Reel Recommendation Engine (Zero-Budget AI Core)

> [!IMPORTANT]
> **⭐ HIGH-PRIORITY ARCHITECTURAL PILLAR: 100% ZERO-BUDGET RECOMMENDATION ENGINE ⭐**
> - **Budget Constraint**: Exactly **$0 / Zero Additional Cloud Costs**.
> - **Core Design Principle**: **Attention & Mathematical Scoring Over Expensive LLMs**.
> - **Why This Outperforms Naive Hardcoding**: Hardcoding emojis alone is easily tricked, misses the 97% of viewers who never comment, and fails on cold-start (0 comments). Instead, we replicate the actual engagement loops used by Instagram and TikTok—combining free Google Gemini AI (for upload-time classification) with lightning-fast in-database mathematical ranking inside Node.js & MongoDB.

---

### 🏷️ Key Architectural Badges & Core Principles
- **`[TAG: ZERO-BUDGET-FOREVER]`**: No paid OpenAI/ChatGPT keys or costly cloud GPU servers (Ollama VPS).
- **`[TAG: ATTENTION-DRIVEN]`**: Tracks dwell time, watch completion percentage, and replay loops as primary viral signals.
- **`[TAG: COLD-START TESTED]`**: Fair-chance creator rollout ladder (50 → 500 → 5,000 user cohorts).
- **`[TAG: USER HORIZONS]`**: Dynamic taste profile vector (`interestScores`) with one-tap vibe/category feed switches.

---

### 📐 The Mathematical Ranking Engine (Instant Node.js & MongoDB Pipeline)

Every post and reel receives an active ranking score calculated in milliseconds:

$$\text{Rank Score} = \frac{\text{Base Engagement Score} + (\text{User Category Affinity} \times 1.5) + \text{Cohort Bonus}}{(\text{Hours Since Published} + 2)^{1.4}}$$

#### 📊 Signal Weight Distribution:
- **🔄 Loop / Re-watch (100%+ Watch Time)**: `+4.0 pts` *(Highest indicator of dopamine & replay value)*
- **🚀 Direct Message Share**: `+3.5 pts` *(Proof of high-quality viral content)*
- **🔖 Bookmark / Save**: `+3.0 pts` *(High long-term utility or aesthetic value)*
- **💬 Meaningful Comment**: `+2.0 pts` *(Active community conversation)*
- **❤️ Simple Like**: `+1.0 pt` *(Low-effort baseline signal)*
- **⏩ Quick Skip (< 1.5s Dwell Time)**: `-3.5 pts` *(Content penalty: unengaging, misleading, or low-quality)*

---

### 📋 Detailed Step-by-Step Implementation Tasks

#### 🎯 Phase 1: Client-Side Telemetry & Attention Tracking (Frontend)
- [ ] **Task 1.1: Reel & Post Dwell Timer**: Implement an `IntersectionObserver` coupled with HTML5 video `timeupdate` to record exact watch duration down to milliseconds.
- [ ] **Task 1.2: Loop & Re-watch Detector**: Track video loop events (`ended` -> `play` cycle) to identify content that gets replayed multiple times.
- [ ] **Task 1.3: Quick-Skip Flagging**: If a user scrolls past a post or swipes away a reel within 1.5 seconds, dispatch a low-overhead background ping with a negative engagement event.
- [ ] **Task 1.4: Batch Telemetry Dispatch**: Debounce and batch interaction metrics every 5–10 seconds using `navigator.sendBeacon` or lightweight Axios calls to prevent API flooding.

#### 🎯 Phase 2: Schema Enhancements & Database Models (Backend / MongoDB)
- [ ] **Task 2.1: Post & Reel Scoring Schema**:
  - Add fields to `Post`: `categoryTags` (e.g. `["comedy", "gaming"]`), `engagementScore` (Number), `watchTimeTotal` (Number), `impressionsCount` (Number), `cohortStage` (`1` = test 50, `2` = 500, `3` = global).
- [ ] **Task 2.2: User Taste Profile Vector (`interestScores`)**:
  - Add `interestScores` Map/Subdocument to the `User` schema:
    ```json
    {
      "comedy": 18.5,
      "tech": 7.2,
      "lifestyle": 3.0,
      "gaming": 0.0
    }
    ```
- [ ] **Task 2.3: Fast MongoDB Compound Indexes**:
  - Create compound index `{ categoryTags: 1, engagementScore: -1, createdAt: -1 }` to enable instant aggregation sorting without in-memory bottlenecks.

#### 🎯 Phase 3: Zero-Cost Auto-Tagging via Free Google Gemini API
- [ ] **Task 3.1: Free Gemini Flash Client Integration**:
  - Set up the official `@google/genai` SDK using Google AI Studio's **free tier** (generous free requests/min with zero monthly fees).
- [ ] **Task 3.2: Upload-Time Tag Classifier**:
  - On post/reel creation, feed the caption, hashtags, and description into Gemini Flash with a constrained JSON prompt:
    > *"Categorize this post into exactly 1-2 standard tags: [comedy, tech, fitness, travel, food, music, education, gaming, art, lifestyle]. Return JSON: { tags: string[] }"*
- [ ] **Task 3.3: Graceful Fallback**: If caption is empty or API rate limit triggers, fallback to regex extraction of user hashtags or set tag as `general` without interrupting post creation.

#### 🎯 Phase 4: Cohort Ladder & Cold-Start Rollout Engine
- [ ] **Task 4.1: Test Batch Distribution (Stage 1 - 50 Users)**:
  - When a new post is published, inject it into the feed of the first 50 active users who have an interest in that category or are currently exploring the fresh feed.
- [ ] **Task 4.2: Retention Verification Worker**:
  - A lightweight server cron/event checks if average watch percentage across the first 50 impressions exceeds 55% or like-to-view ratio > 8%.
- [ ] **Task 4.3: Stage Escalation**:
  - If threshold is met, escalate `cohortStage` to 2 (expanded to 500 users), then 3 (featured on Explore / Horizon feed). If failed, retain post in normal chronological follower feed.

#### 🎯 Phase 5: "User Horizons" & Dynamic Feed Customizer (UI & Algorithm)
- [ ] **Task 5.1: Interactive Horizon Switcher**:
  - Provide a pill-tab bar at the top of the feed allowing members (like Steve) to toggle their horizon:
    - 🌐 **For You (Smart Algorithm Blend)**: 50% Personalized Taste + 30% Following Crew + 20% Fresh Cohort Discovery.
    - 😂 **Funny / Comedy Horizon**: Filters directly for high-scoring comedy posts & reels.
    - 👥 **Crew Only**: 100% chronological posts from connected friends.
- [ ] **Task 5.2: Live Taste Adaptation**:
  - As Steve watches funny videos, his `interestScores.comedy` automatically increments in real-time, instantly adjusting his future recommendations without requiring manual preference setup.

---

## 4. ⚖️ Legal, Privacy, Compliance & Trust Blueprint (Launch Readiness & Store Approval)

> [!IMPORTANT]
> **⭐ COMPLIANCE & LEGAL SHIELD ROADMAP ⭐**
> - **Core Objective**: Legally protect OnBoard, ensure 100% approval on Google Play & Apple App Store (Guideline 5.1.1 Data Collection & Storage), comply with the **Digital Personal Data Protection (DPDP) Act 2023 (India)**, **GDPR (EU)**, and **CCPA/CPRA (US)**, while establishing uncompromising user trust and accessibility.
> - **Sequencing Strategy**: Prioritized into **4 actionable execution tiers** based on legal liability, store rejections, and technical dependencies.

---

### 📊 Master Prioritization Matrix (Sequence of Execution)

| Tier | Focus Area | Urgency | Key Deliverables & Scope |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Mandatory Legal Blockers & App Store Gates** | 🚨 **Critical (Pre-Launch Blocker)** | • Dedicated Terms & Conditions page (`/terms`)<br>• DMCA & Copyright safe harbor notice<br>• Signup form legal consent checkbox/notice<br>• DPDP Act (India) Grievance Officer & SLA<br>• Permanent account & data cascade deletion |
| **Tier 2** | **Privacy Architecture, Data Minimization & Cookies** | 🛡️ **High (Pre-Public Scaling)** | • Cookie Policy & contextual consent banner<br>• Strict Data Minimization audit<br>• Third-party embeds & CDN disclosures<br>• Zero-fingerprint tracking & analytics hygiene |
| **Tier 3** | **Accessibility (WCAG 2.1 AA) & Inclusive UI** | ♿ **Medium (Quality & Inclusivity)** | • Image alt-text pipeline (auto + custom)<br>• 4.5:1 WCAG color contrast validation<br>• Keyboard-accessible forms & focus traps<br>• Descriptive ARIA labels on all icon buttons |
| **Tier 4** | **Consumer Protection, Commercial Terms & Risk Shield** | ⚖️ **Conditional & Post-Launch** | • Transparent business details & Impressum<br>• Removal of false claims / fake reviews<br>• Image copyright ownership & creator license<br>• Refund policy (triggers upon paid VIP/creator tiers)<br>• Proactive risk flagging (CSAM, defamation, hate speech) |

---

### 🚨 Tier 1: Mandatory Legal Blockers & App Store Mandates (Immediate Priority)

#### 1.1 Terms & Conditions (T&C / ToS) Page (`/terms`) & DMCA / IP Safe Harbor
- **Why It's Critical**: Without Terms of Service, the platform owner is personally liable for defamatory, copyright-infringing, or illicit content uploaded by users. Under US DMCA Section 512 and Indian IT Act Section 79 (Safe Harbor), intermediary immunity requires published terms and a designated copyright takedown agent.
- **OnBoard Current Status**: Missing dedicated page.
- **Implementation Tasks**:
  - [ ] **Task 1.1.1**: Create `TermsAndConditions.jsx` with clear sections:
    - User Eligibility (age 13+ requirement).
    - Permitted Use & Code of Conduct (prohibition of harassment, hate speech, spam, impersonation, illegal media).
    - User-Generated Content License (user owns their content; grants OnBoard a non-exclusive license to display and distribute within the platform).
    - Safe Harbor DMCA / Copyright Infringement Takedown Process with designated email (`copyright@onboard.social`).
    - Account Suspension & Termination Rights (OnBoard reserves right to terminate accounts violating safety guidelines).
    - Disclaimer of Warranties & Limitation of Liability.
  - [ ] **Task 1.1.2**: Register `/terms` route in `App.jsx` and add link to footers across `LandingPage.jsx`, `Authentication.jsx`, and `PrivacyPolicy.jsx`.

#### 1.2 Registration Form Explicit Legal Consent (`/auth`)
- **Why It's Critical**: Consent must be freely given, specific, and informed under GDPR Article 7 and DPDP Act Section 6. Unchecked background agreements are frequently struck down in court.
- **OnBoard Current Status**: Signup form currently submits without an explicit legal notice or clickable policy links.
- **Implementation Tasks**:
  - [ ] **Task 1.2.1**: Update `Authentication.jsx` (Sign Up view) to include an affirmative consent notice:
    > *"By creating an account, you acknowledge that you have read and agree to our [Terms of Service](/terms) and [Privacy Policy](/privacy-policy)."*
  - [ ] **Task 1.2.2**: Ensure links open safely in a new tab without interrupting registration form state.
  - [ ] **Task 1.2.3**: Record timestamp of terms acceptance (`termsAcceptedAt`) on user creation in `user.model.js`.

#### 1.3 DPDP Act (India) Compliance & Grievance Redressal Officer
- **Why It's Critical**: Section 10 of India's Digital Personal Data Protection Act 2023 and the Information Technology (Intermediary Guidelines) Rules require platforms operating in India to publish the name, official contact address, email, and 7-day to 15-day resolution mechanism of a designated **Data Protection / Grievance Officer**.
- **OnBoard Current Status**: `PrivacyPolicy.jsx` is missing the designated officer block.
- **Implementation Tasks**:
  - [ ] **Task 1.3.1**: Append dedicated **Grievance Redressal & Indian DPDP Act Compliance** section to `PrivacyPolicy.jsx`:
    - Officer Name / Title: *Grievance Officer, OnBoard Social*.
    - Contact Email: `grievance@onboard.social`.
    - Response SLA: Acknowledgment within 24 hours, resolution within 15 working days.
    - Mechanism for user rights: Right to access data summary, right to correction, right to withdraw consent.

#### 1.4 Permanent Account & Data Deletion ("Right to be Forgotten")
- **Why It's Critical**: **Apple App Store Guideline 5.1.1(v)** and Google Play Store policies explicitly mandate that any app allowing account creation must also offer account deletion initiated from within the app, purging all associated personal data.
- **OnBoard Current Status**: Backend cascade deletion controller exists (`DELETE /api/account/delete`); frontend double-confirmation trigger is integrated into `AccountSettingsModal.jsx`.
- **Implementation Tasks**:
  - [ ] **Task 1.4.1**: Audit cascade deletion pipeline in `account.controller.js` to ensure complete wipe of:
    - User credentials, profile documents, and avatars.
    - Posts, reels, comments, and media timeline records.
    - Squad memberships, direct conversations, and stored messages.
    - Cloud storage assets (Cloudinary/S3 image removals).
  - [ ] **Task 1.4.2**: Provide in-app data export option (*"Download My Data Archive"* in JSON format) complying with GDPR portability rights prior to deletion.

---

### 🛡️ Tier 2: Privacy Architecture, Data Minimization & Cookies (Pre-Scaling Priority)

#### 2.1 Cookie Policy & Contextual Consent Banner
- **Why It's Critical**: ePrivacy Directive and GDPR mandate prior consent for non-essential cookies. Essential session cookies (JWT authentication) do not require a blocking banner, but do require clear disclosure. Any analytics or tracking cookies (e.g. Google Analytics, Meta Pixel) legally require opt-in consent.
- **OnBoard Current Status**: OnBoard uses HttpOnly session cookies without third-party tracking cookies.
- **Implementation Tasks**:
  - [ ] **Task 2.1.1**: Create `CookiePolicy.jsx` (`/cookies`) explaining:
    - Strictly Necessary Cookies: Session authentication token (`token`), CSRF protection, and theme preference.
    - Functional Cookies: Sidebar state, player volume, and active tab preferences.
    - Third-Party / Analytics Cookies: None currently utilized (or opt-in details if integrated).
  - [ ] **Task 2.1.2**: Implement lightweight, unobtrusive `CookieConsentBanner.jsx` appearing once on initial visit with "Accept Essential" and "Cookie Settings" actions.

#### 2.2 Data Minimization Audit ("Collect Only Necessary Data")
- **Why It's Critical**: Under DPDP Act Section 6(1) and GDPR Article 5(1)(c), personal data collected must be adequate, relevant, and limited to what is strictly necessary in relation to the purposes for which they are processed.
- **OnBoard Current Status**: OnBoard collects minimal data (username, email, optional DOB for age gating, bio, avatar).
- **Implementation Tasks**:
  - [ ] **Task 2.2.1**: Audit signup and profile schemas: verify that phone numbers, real legal names, and precise GPS coordinates are never made mandatory fields.
  - [ ] **Task 2.2.2**: Ensure Live Location sharing (`LocationModal.jsx`, `ActiveLocationCenterModal.jsx`) is strictly opt-in, ephemeral (auto-expires in 1-8 hours), and never logged to permanent location history without active consent.

#### 2.3 Third-Party Embeds & CDN Disclosures
- **Why It's Critical**: When user browsers load assets from external CDNs (Unsplash, Google Fonts, FontAwesome, Cloudinary), the user's IP address and user-agent are transmitted to those third parties.
- **Implementation Tasks**:
  - [ ] **Task 2.3.1**: Disclose all third-party CDNs and media hosting partners in `PrivacyPolicy.jsx` (Google Fonts, Unsplash, FontAwesome CDN, VideoJS CDNs).
  - [ ] **Task 2.3.2**: Add `rel="noopener noreferrer"` to all outgoing external links in `ShareModal.jsx` and footer links to prevent `window.opener` leaks.

#### 2.4 Tracking & Analytics Hygiene
- **Why It's Critical**: Modern mobile operating systems (iOS App Tracking Transparency) reject apps that silently fingerprint devices or track users across external apps without explicit OS-level prompt.
- **Implementation Tasks**:
  - [ ] **Task 2.4.1**: Affirm in Privacy Policy that OnBoard does **not** sell user personal data, does not utilize cross-app tracking cookies, and does not conduct device fingerprinting.

---

### ♿ Tier 3: Accessibility (WCAG 2.1 AA) & Inclusive UI (Experience & Inclusivity)

#### 3.1 Image Alt-Text & Media Descriptions
- **Why It's Critical**: Screen readers depend on descriptive `alt` tags. Missing alt tags fail WCAG 2.1 Criterion 1.1.1 (Non-text Content) and harm SEO.
- **Implementation Tasks**:
  - [ ] **Task 3.1.1**: Add an optional "Image Description (Alt Text)" field in `CreatePost.jsx` so creators can provide accessibility captions for visually impaired members.
  - [ ] **Task 3.1.2**: Fallback automated alt-text generation: If no custom alt text is provided, generate descriptive fallback: `alt="Photo shared by @${post.author.userName}: ${post.caption.slice(0, 60)}"` instead of empty or generic `"image"` tags.
  - [ ] **Task 3.1.3**: Audit all avatar and icon images across `LandingPage.jsx`, `Feed.jsx`, `DualDeck.jsx`, and `NotificationCard.jsx` to ensure valid `alt` attributes.

#### 3.2 Accessible Color Contrast & Legibility Validation
- **Why It's Critical**: WCAG 2.1 Level AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.
- **Implementation Tasks**:
  - [ ] **Task 3.2.1**: Audit muted gray text classes (e.g. `text-slate-400` on white backgrounds) and bump to `text-slate-500` or `text-slate-600` where body readability is affected.
  - [ ] **Task 3.2.2**: Verify that active badge chips, status indicators, and gradient text retain adequate contrast against dark/light card backgrounds.

#### 3.3 Keyboard-Friendly Navigation & Focus Trapping
- **Why It's Critical**: WCAG 2.1 Criterion 2.1.1 requires all functionality to be operable via keyboard interface (`Tab`, `Shift+Tab`, `Enter`, `Escape`, `Arrow keys`).
- **Implementation Tasks**:
  - [ ] **Task 3.3.1**: Ensure `Escape` key reliably dismisses all active modals (`ShareModal.jsx`, `ReelPlayerModal.jsx`, `ExplorePostModal.jsx`, `ReportModal.jsx`).
  - [ ] **Task 3.3.2**: Add visible focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none`) to all form inputs, interactive pills, and custom buttons.

#### 3.4 Clear Interactive Button Labels & ARIA Attributes
- **Why It's Critical**: Icon-only buttons (like heart, comment, share, close, bookmark) are completely silent to screen reader users if missing `aria-label`.
- **Implementation Tasks**:
  - [ ] **Task 3.4.1**: Audit icon buttons across `Feed.jsx`, `ReelPlayerModal.jsx`, and `ShareModal.jsx`:
    - Add `aria-label="Like this post"`, `aria-label="Share this post"`, `aria-label="Close modal"`, `aria-label="Mute audio"`.
  - [ ] **Task 3.4.2**: Add `role="dialog"` and `aria-modal="true"` to custom glassmorphic modals.

---

### ⚖️ Tier 4: Consumer Protection, Commercial Terms & Risk Controls (Scale & Governance)

#### 4.1 Transparent Business Details, Developer Contact & Imprint (Impressum)
- **Why It's Critical**: Required under European e-Commerce Directive (Section 5 TMG in Germany / EU) and general consumer trust standards.
- **Implementation Tasks**:
  - [ ] **Task 4.1.1**: Maintain an official Developer / Contact page (`/developer`) with legitimate project ownership, developer credentials, and direct contact avenues.
  - [ ] **Task 4.1.2**: Provide support channel (`support@onboard.social`) for user assistance and account recovery.

#### 4.2 Removal of False Claims & Fabricated Social Proof
- **Why It's Critical**: FTC Guidelines (16 CFR Part 255) and Indian Consumer Protection Act 2019 penalize misleading claims and deceptive endorsements.
- **Implementation Tasks**:
  - [ ] **Task 4.2.1**: Audit landing page marketing copy (`LandingPage.jsx`):
    - Replace arbitrary statistical claims (`10,000+ people`, `99.9% uptime`) with authentic metrics or contextual Beta tags (*"Join early creators on the OnBoard Beta"*).
    - Ensure testimonials represent genuine feedback or are clearly designated as platform demonstrations.

#### 4.3 Image Copyright Safeguards, Creator License & Upload Disclaimers
- **Why It's Critical**: Protects platform from contributory copyright infringement claims when users upload third-party photography.
- **Implementation Tasks**:
  - [ ] **Task 4.3.1**: Display an upload disclaimer in `CreatePost.jsx`:
    > *"By posting, you confirm you own this content or have explicit permission to share it."*
  - [ ] **Task 4.3.2**: Provide copyright attribution metadata options for photographers and digital creators.

#### 4.4 Refund & Billing Policy (Conditional Trigger)
- **Why It's Critical**: **Only required once real money transactions occur** (e.g. Creator VIP Badges, paid subscription cabins, or digital goods).
- **Rule of Thumb**:
  - **Currently (Free Platform)**: No refund policy required. State in `/terms`: *"OnBoard is currently free to use. Should paid subscription tiers or creator tips be introduced, clear refund and cancellation terms will be provided prior to checkout."*
  - **Future Commercial Phase**: Implement a dedicated `RefundPolicy.jsx` (`/refund-policy`) detailing 14-day statutory withdrawal rights, creator payout dispute timelines, and payment processor (Stripe/Razorpay) terms.

#### 4.5 Emerging Risk Mitigation & Content Moderation Shield
- **Why It's Critical**: Intermediary liability laws worldwide require zero tolerance for illegal content (CSAM, terrorist content, non-consensual imagery, severe hate speech).
- **Implementation Tasks**:
  - [ ] **Task 4.5.1**: Maintain automated reporting flow (`ReportModal.jsx` -> `safety.controller.js`).
  - [ ] **Task 4.5.2**: Add admin review queue to flag reported posts for administrative takedown within 24 hours.
  - [ ] **Task 4.5.3**: Add rate-limiting on report submissions to prevent targeted malicious reporting brigades.

