// ============================================================================
// Shoonaya Support & Troubleshooting Knowledge Corpus
// Grounded operational, astronomical, practice, and platform documentation
// used by the RAG first-tier support agent.
// ============================================================================

export interface SupportFaqItem {
  id: string;
  title: string;
  category:
    | 'calendar_panchang'
    | 'sadhana_japa'
    | 'account_auth'
    | 'app_bug'
    | 'spiritual_content'
    | 'billing_donation'
    | 'general';
  keywords: string[];
  summary: string;
  steps?: string[];
  actionLinks?: Array<{ label: string; href: string }>;
}

export const SHOONAYA_SUPPORT_CORPUS: SupportFaqItem[] = [
  // ── 1. Calendar & Panchang Astrometry ──────────────────────────────────────
  {
    id: 'panchang-city-difference',
    title: 'Why do festival or Ekadashi dates differ between cities?',
    category: 'calendar_panchang',
    keywords: ['date', 'different', 'city', 'ekadashi', 'festival', 'timezone', 'location', 'wrong date', 'uk', 'usa'],
    summary:
      'An observance date depends on the local sunrise and the calendar profile for your location. A Tithi ends at the same instant everywhere, but if that instant falls before sunrise in one city and after sunrise in another, the civil date can differ by one day. Dates that the app has not confirmed are shown as unconfirmed rather than as a final date.',
    steps: [
      'Open Settings -> Location to verify your current city and timezone are set accurately.',
      'Check the Panchang view for your city to see the exact sunrise time and Tithi transition moment.',
      'If travelling across timezones, enable "Auto-detect location" or select your current pilgrimage city.',
    ],
  },
  {
    id: 'brahma-muhurta-timing',
    title: 'How is Brahma Muhurta calculated for my city?',
    category: 'calendar_panchang',
    keywords: ['brahma muhurta', 'morning', 'wake up', '4 am', 'sunrise', 'timing', 'muhurta'],
    summary:
      'Brahma Muhurta begins exactly two Muhurtas (approximately 1 hour and 36 minutes) prior to local civil sunrise and concludes 48 minutes prior to sunrise. Because sunrise changes daily across the solar seasons, your Brahma Muhurta notification dynamically shifts to match true astronomical sunrise rather than a static alarm clock.',
    steps: [
      'Enable Brahma Muhurta alerts under Settings -> Notifications -> Brahma Muhurta Reminders.',
      'Ensure device battery-saver mode does not restrict background notifications before sunrise.',
    ],
  },

  // ── 2. Sadhana & Japa Counter ──────────────────────────────────────────────
  {
    id: 'japa-counter-sync',
    title: 'How does the Tactile Japa Mala counter track and sync counts?',
    category: 'sadhana_japa',
    keywords: ['japa', 'mala', 'counter', 'beads', 'haptic', 'sync', 'offline', 'lost counts', 'streak'],
    summary:
      'The Tactile Japa counter records mantra repetitions locally on your device in real-time with zero latency. Even if you lose internet connectivity while meditating or at a remote ashram, every bead and completed round (27, 54, or 108 beads) is saved locally and safely synced to your profile as soon as a connection is restored.',
    steps: [
      'Choose your preferred bead length (27, 54, or 108 beads) from the Japa drawer.',
      'Ensure haptic vibration and audio bells are toggled to your liking.',
      'If your streak appears delayed after an offline session, pull down to refresh or check connectivity.',
    ],
  },
  {
    id: 'gyan-chaupar-rules',
    title: 'What is Gyan Chaupar and how do I play it?',
    category: 'sadhana_japa',
    keywords: ['gyan chaupar', 'game', 'board', 'karma', 'play', 'snakes', 'ladders', 'dice'],
    summary:
      'Gyan Chaupar is the ancient contemplative wisdom game from which modern Snakes & Ladders evolved. The board consists of 72 squares representing states of consciousness, virtues (which carry the seeker upward toward Vaikuntha or Moksha), and karmic vices (which cause the seeker to descend to purify their intent).',
    steps: [
      'Roll the sacred cowrie or dice to advance your counter.',
      'Read the introspective contemplation attached to each square you land on.',
      'Complete the journey to reach the summit of liberation (Square 68/72).',
    ],
    actionLinks: [
      { label: 'Play Gyan Chaupar Online', href: '/play/gyan-chaupar' },
    ],
  },

  // ── 3. Account, Auth & Tradition ───────────────────────────────────────────
  {
    id: 'change-tradition',
    title: 'Can I change my spiritual tradition in Shoonaya?',
    category: 'account_auth',
    keywords: ['tradition', 'sanatan', 'sikh', 'jain', 'buddhist', 'switch', 'change profile', 'lock'],
    summary:
      'You choose your tradition when you create your account, and it is locked afterwards because it decides which calendar, texts and observances you are shown. If you chose the wrong one, send us a message with this form and a person will help.',
    steps: [
      'Tell us which tradition you chose and which one you want, using "I still need help" below.',
      'Your japa counts, practice history and notes stay with your account.',
    ],
    actionLinks: [
      { label: 'Explore Traditions', href: '/traditions' },
    ],
  },
  {
    id: 'data-privacy-security',
    title: 'Is my personal spiritual practice data private and encrypted?',
    category: 'account_auth',
    keywords: ['privacy', 'encryption', 'secure', 'data', 'delete account', 'journal', 'kundali'],
    summary:
      'Yes, absolute reverence for devotee privacy is an uncompromisable core principle of Shoonaya. Your journal entries, japa counts, birth chart details (Kundali), and family Kul trees are strictly private to you. We never sell user data, run third-party advertising trackers, or feed private devotee reflections into public AI models.',
    steps: [
      'You can export your personal data at any time from Settings -> Privacy.',
      'If you ever wish to remove your account, select "Delete Account" to permanently erase all personal records.',
    ],
    actionLinks: [
      { label: 'Read Privacy Policy', href: '/privacy' },
    ],
  },

  // ── 4. App Troubleshooting & Bugs ──────────────────────────────────────────
  {
    id: 'notification-troubleshooting',
    title: 'Why am I not receiving Panchang, Japa or Vrat notifications?',
    category: 'app_bug',
    keywords: ['notification', 'not working', 'push', 'alert', 'reminders', 'silent', 'missing', 'android'],
    summary:
      'Push notification delivery requires both system-level permission on your device OS and active preference toggles inside Shoonaya. On modern Android devices, aggressive battery management (Doze Mode) may also delay morning alerts.',
    steps: [
      'Check device Settings -> Apps -> Shoonaya -> Notifications and ensure all categories are allowed.',
      'On Android (Samsung, Xiaomi, OnePlus), exempt Shoonaya from "Battery Optimization" to allow background alarms.',
      'In Shoonaya Settings -> Notifications, verify that the specific reminder (e.g. Ekadashi, Japa, Brahma Muhurta) is toggled ON.',
    ],
  },
  {
    id: 'cache-refresh-issue',
    title: 'How do I clear app cache if a screen appears blank or outdated?',
    category: 'app_bug',
    keywords: ['cache', 'blank screen', 'stuck', 'white screen', 'update', 'reload', 'error', 'bug'],
    summary:
      'If a recent software deployment or network interruption causes an older cached bundle to load, a swift client cache refresh will immediately restore normal operation.',
    steps: [
      'On the website: press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac), or clear the browser cache for shoonaya.com.',
      'On Android App: Long-press the Shoonaya app icon -> App Info -> Storage & Cache -> Clear Cache (not Data).',
      'Restart the app to fetch the latest canonical assets and database feeds.',
    ],
    actionLinks: [
      { label: 'Refresh Home Screen', href: '/' },
    ],
  },

  // ── 5. Platform Availability & Support ─────────────────────────────────────
  {
    id: 'ios-and-android-platforms',
    title: 'Where can I download Shoonaya on mobile and tablet?',
    category: 'general',
    keywords: ['download', 'play store', 'app store', 'iphone', 'ios', 'android', 'apk', 'mobile app'],
    summary:
      'Shoonaya is available for Android through the official Google Play Store. The Get Shoonaya page lists every current way to install it, including iPhone and iPad.',
    steps: [
      'For Android: Search for "Shoonaya" on Google Play or visit the direct store link.',
      'For iPhone / iPad: see the Get Shoonaya page for the current options.',
    ],
  },
  {
    id: 'pricing-and-donations',
    title: 'Is Shoonaya free? Are there subscriptions or hidden charges?',
    category: 'billing_donation',
    keywords: ['free', 'cost', 'subscription', 'price', 'donation', 'charges', 'payment'],
    summary:
      'Shoonaya is completely free for all devotees. All sacred features — the astronomical Panchang, Japa Mala counter, Pathshala scriptures, Dharmic hero biographies, Kundali chart views, and community Mandalis — are provided without paywalls or advertisements.',
    actionLinks: [
      { label: 'About Shoonaya Philosophy', href: '/what-is-shoonaya' },
    ],
  },
];
