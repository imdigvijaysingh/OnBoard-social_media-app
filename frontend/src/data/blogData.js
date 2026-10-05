/**
 * SEO-Optimized Blog Posts for OnBoard
 */
export const BLOG_POSTS = [
  {
    id: 1,
    slug: "why-gen-z-is-leaving-instagram",
    title: "Why Gen Z is Leaving Instagram: The Rise of Anti-Algorithmic Social Platforms",
    subtitle: "How manufactured perfection, endless ads, and algorithm fatigue are driving the next generation toward authentic micro-communities.",
    date: "April 18, 2026",
    isoDate: "2026-04-18",
    readTime: "5 min read",
    author: "Digvijay Singh",
    authorRole: "Founder & Lead Developer at OnBoard",
    category: "Culture",
    tags: ["Gen Z", "Social Media", "Digital Wellness", "Authenticity"],
    metaDescription: "Explore why Gen Z is abandoning Instagram and TikTok for anti-algorithmic, intimate social apps like OnBoard that prioritize real connection over influencer clout.",
    excerpt: "Instagram used to be a place to see what your friends were doing this weekend. Today, it's a digital shopping mall filled with sponsored reels, AI-generated thirst traps, and algorithmic noise. Here is why the next generation is moving to OnBoard.",
    content: `
### The Great Social Media Fatigue

If you ask any Gen Z smartphone user how they feel about Instagram or TikTok in 2026, the answer is almost always the same: **exhausted**.

What started as photo-sharing platforms for friends have mutated into hyper-optimized dopamine casinos. Feeds are saturated with algorithmic suggestions from accounts you never followed, sponsored product placements, and relentless 5-second video hooks engineered to keep your eyeballs glued to glass.

The outcome? **Zero real connection.**

---

### The Death of the "Grid Vanity"

For nearly a decade, social platforms rewarded a very specific behavior:
1. **Posed perfection**: Flawless lighting, filtered skin, and curated lifestyles.
2. **Follower accumulation**: Treating friends as metrics rather than people.
3. **Passive consumption**: Scrolling through hundreds of strangers' videos without interacting with anyone you actually know.

Gen Z is actively rejecting this model. The cultural resurgence of "photo dumps", private Finstas, BeReal, and intimate group chats on Discord proved that young people crave **raw, unpolished, low-stakes digital connection**.

---

### Enter OnBoard: Reclaiming the Digital Living Room

When designing **OnBoard**, developer Digvijay Singh had a simple thesis:

> *"Social media shouldn't feel like a public stage where you're performing for applause. It should feel like a living room where you hang out with your crew."*

Here is how OnBoard solves the social fatigue equation:

#### 1. The "Crew" Model Over "Followers"
On traditional platforms, you have "Followers" — a one-way, parasocial broadcast mechanism. OnBoard introduces **Crew Members**. You don't hoard thousands of strangers; you build a tight-knit circle of people you actually embark on life's journey with.

#### 2. 100% Chronological Feeds
No black-box algorithms rearranging your timeline to maximize outrage or ad impressions. If your friend posted 10 minutes ago, you see it. When you're caught up, you're free to put down your phone and live your life.

#### 3. Zero Algorithmic Ads
Your personal data isn't harvested to sell you fast fashion or dropshipped gadgets. OnBoard is built from the ground up as a pure social canvas.

---

### What The Future of Social Looks Like

The platforms that will define the next decade are not the ones with the most addictive slot-machine feeds. They are the ones that foster **genuine belonging**.

By prioritizing intentional community, candid photo crops, and direct interactions without algorithmic manipulation, OnBoard is pioneering the post-Instagram era. Are you ready to get OnBoard?
    `
  },
  {
    id: 2,
    slug: "engineering-onboard-mern-stack-architecture",
    title: "Behind the Build: Engineering OnBoard with React, Node.js & Modern UI Architecture",
    subtitle: "A technical deep dive into building a fast, scalable, and responsive social media app from scratch.",
    date: "April 12, 2026",
    isoDate: "2026-04-12",
    readTime: "7 min read",
    author: "Digvijay Singh",
    authorRole: "Full Stack Engineer & UI Architect",
    category: "Engineering",
    tags: ["MERN Stack", "React", "Node.js", "Web Performance", "Architecture"],
    metaDescription: "Learn the full architecture behind OnBoard: client-side image cropping with HTML Canvas, JWT authentication with secure cookies, and responsive SPA design.",
    excerpt: "Building a production-ready social media platform involves solving complex frontend and backend challenges: asynchronous image manipulation, responsive layouts, and rock-solid session security. Here's how OnBoard was engineered.",
    content: `
### Architecting a Modern Social Media Stack

Building **OnBoard** wasn't just about crafting a pretty interface—it was about engineering a system capable of handling media uploads, real-time board requests, secure user sessions, and buttery-smooth client-side routing.

Here is an under-the-hood breakdown of the technologies and architectural decisions that power the platform.

---

### 1. The Frontend: Speed, Fluidity & Zero-Lag UX

On the client side, OnBoard is built with **React** bundled through **Vite**. The primary engineering goals were sub-second initial loads, zero layout shifts, and seamless page transitions.

#### Custom Canvas Image Cropper
Rather than uploading raw multi-megabyte camera images directly to the server, OnBoard processes images directly on the user's device using HTML5 Canvas and \`react-image-crop\`:
- Users can visually adjust aspect ratios and center crops.
- The canvas computes exact scale transformations based on natural media width and pixel dimensions.
- High-efficiency JPEG blobs are generated in memory, drastically reducing network payload and server storage demands.

\`\`\`javascript
// Client-side canvas export pipeline
canvas.toBlob((blob) => {
  formData.append("image", blob, "post-image.jpg");
}, "image/jpeg", 0.92);
\`\`\`

#### Universal Scroll Restoration
In Single Page Applications (SPAs), navigating between routes preserves previous scroll positions by default. We implemented a centralized router listener and DOM MutationObserver that resets window and modal viewports to \`top: 0\` instantly on every navigation event and popup trigger.

---

### 2. The Backend: RESTful APIs & Resilient State

The backend runs on **Node.js** with an **Express.js** REST API and **MongoDB** managed via Mongoose.

#### Security-First Session Cookies
Rather than storing authentication tokens in \`localStorage\` (which leaves apps vulnerable to Cross-Site Scripting / XSS attacks), OnBoard implements **HTTP-only, SameSite Secure Cookies** containing signed JSON Web Tokens (JWT).

#### Atomic Board Requests System
The "Crew" relationship model supports multiple states:
1. \`requested\` (Pending approval)
2. \`boarded\` (Mutual Crew status)
3. \`unboarded\` (Revoked connection)

Database operations utilize atomic MongoDB array operators (\`$addToSet\`, \`$pull\`) to eliminate race conditions when simultaneous connection requests occur.

---

### 3. Glassmorphic UI Design System

Rather than relying on generic CSS frameworks, OnBoard uses a bespoke CSS token design system:
- High-performance GPU-accelerated backdrops (\`backdrop-filter: blur(12px)\`).
- Curated color palettes with tailored HSL accents (\`#5445FF\` primary indigo).
- Full responsiveness spanning ultra-wide desktop monitors down to 320px mobile viewports.

---

### Summary

Modern web engineering is about striking the perfect balance between developer velocity and end-user performance. By pairing clean MERN fundamentals with modern client-side optimizations, OnBoard delivers a silky-smooth social experience that scales.
    `
  },
  {
    id: 3,
    slug: "power-of-micro-communities-crew-vs-followers",
    title: "The Power of Micro-Communities: Why 'Crew Members' Beat 'Followers' Every Time",
    subtitle: "Rethinking social mechanics: Why high-resonance circles drive 10x more genuine engagement than passive audiences.",
    date: "April 5, 2026",
    isoDate: "2026-04-05",
    readTime: "4 min read",
    author: "Digvijay Singh",
    authorRole: "Product Designer & Developer",
    category: "Product",
    tags: ["Community", "Product Design", "UX", "Psychology"],
    metaDescription: "Understand the Dunbar Number and why OnBoard replaced the follower model with reciprocal Crew Members to build authentic digital communities.",
    excerpt: "Humans are biologically wired to maintain roughly 150 stable relationships. Discover how OnBoard leverages cognitive anthropology to build healthier digital networks.",
    content: `
### The Myth of the Infinite Audience

In 2012, social networks convinced everyone that success was measured by a single number: your **follower count**.

If you had 10,000 followers, you were "important". If you had 200, you were "nobody".

Fast forward to today: millions of people have thousands of "followers", yet they feel more isolated than ever. Why? Because the follower metric is built on a fundamental psychological illusion: **confusing an audience with a community**.

---

### Dunbar's Number and Social Bandwidth

Anthropologist Robin Dunbar famously proved that the human brain can comfortably maintain social relationships with only about **150 individuals** at a time. Within that 150, our innermost circle—our true support system—consists of just **5 to 15 people**.

Traditional social platforms ignore this biological reality:
- They encourage you to broadcast private moments to 2,000 loose acquaintances.
- This creates **performance anxiety**: You hesitate before posting because you wonder what an old high school classmate or random recruiter will think.
- Result: People stop posting candidly, and feeds become sterile ghost towns.

---

### How OnBoard Reinvents the Social Contract

OnBoard discards the broadcast-follower model entirely in favor of the **Crew System**.

#### 1. Mutuality by Default
You don't simply "follow" someone into their private updates without consent. You send a **Board Request**. When accepted, both individuals become **Crew Members**, traveling through life's updates together.

#### 2. Low-Stakes Posting
When you know your posts are only seen by people who actually care about your journey, the pressure to look like a glossy magazine model disappears. You can post a quick photo of your desk, an unfinished code snippet, or a late-night thought without second-guessing yourself.

#### 3. Meaningful Signals
When a Crew Member likes or comments on your post on OnBoard, it isn't algorithmic bot engagement. It's someone in your circle taking a moment to acknowledge your life.

---

### Quality Over Quantity

The future belongs to intentional networks. By prioritizing the people who actually matter, OnBoard transforms social media from an anxiety trigger into a genuine place of belonging.
    `
  },
  {
    id: 4,
    slug: "privacy-first-zero-ad-data-security",
    title: "Privacy First: How We Built Zero-Ad Data Security into OnBoard's DNA",
    subtitle: "No trackers, no surveillance capitalism, no selling your personal habits. Here is how your data is protected.",
    date: "March 28, 2026",
    isoDate: "2026-03-28",
    readTime: "5 min read",
    author: "Digvijay Singh",
    authorRole: "Creator & Security Lead",
    category: "Privacy",
    tags: ["Data Privacy", "Cybersecurity", "Zero Tracking", "Ethics"],
    metaDescription: "Discover how OnBoard is engineered with privacy as a foundational principle: encrypted transmissions, hashed passwords, zero third-party ad pixels.",
    excerpt: "Most social media apps view you as the product, not the customer. Learn how OnBoard is engineered to protect user privacy without compromise.",
    content: `
### If It's Free, Are You Really the Product?

For the past twenty years, Big Tech has operated on an insidious business model known as **surveillance capitalism**:
1. Give away a free app.
2. Track every click, pause, scroll speed, and message.
3. Package your psychological profile and sell real-time access to advertisers.

At **OnBoard**, we fundamentally reject this paradigm. Your digital journey belongs to you—not to advertisers, data brokers, or hedge funds.

---

### The Four Pillars of OnBoard's Privacy Architecture

#### 1. Zero Third-Party Tracking Pixels
Look at the network tab of standard social apps, and you'll find requests to Facebook Graph, Google Tag Manager, TikTok Pixels, and dozens of ad exchange trackers. 

OnBoard contains **zero third-party trackers**. We do not track what you look at outside our app, we do not monitor your clipboard, and we do not sell your telemetry.

#### 2. End-to-End Session Protection
Authentication relies on cryptographic JSON Web Tokens signed with strong server-side secrets. These tokens are stored strictly within **HttpOnly, SameSite=Strict cookies**.
- JavaScript running in the browser cannot read or steal your session token.
- Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) vectors are mitigated by design.

#### 3. Salted & Hashed Passwords
We never store plaintext passwords. All credentials are processed with salted cryptographic hashing algorithms before touching the database. Even in the event of an infrastructure breach, your master passwords remain mathematically irreversible.

#### 4. Absolute Account Ownership
You have complete control over your content. When you delete a post or your account on OnBoard, it is **permanently purged** from our primary databases—not archived in hidden data lakes.

---

### The Clean Social Experience

Privacy isn't just about technical compliance; it's about peace of mind. By building a platform that doesn't spy on you, OnBoard lets you share your moments with confidence.
    `
  }
];
