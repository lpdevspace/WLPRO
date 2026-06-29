# WL Pro — Weight & Wellness Tracker (PRD)

## Original problem statement
"Come up with ideas for a new weight tracker app to track and encourage me." Built as a
**Firebase-native** app so the user can deploy to Firebase.

## User choices
- Full health tracking: weight, calories, water, steps, progress photos
- Encouragement: streaks + badges/milestones AND a coach with motivational tips
- Auth: secure Google login (Firebase Auth)
- Units: toggle BOTH kg and lbs
- Themes: 3 built-in (Clean Light, Calm Dark, Energetic) + custom accent generator
- Deploy target: **Firebase Hosting**

## Architecture
- React 19 SPA (CRA/craco), Tailwind + shadcn/ui, Recharts, framer-motion, lucide-react.
- Firebase: Auth (Google), Firestore (data). **No backend / FastAPI used.**
- Progress photos stored as compressed data URLs in Firestore (client-side canvas resize),
  so the app runs on the **free Spark plan** — no Cloud Storage / Blaze required.
- Theme system: CSS variables via `data-theme` on <html>; custom accent injects
  `--primary`/`--ring` inline (hex→HSL, auto-contrast foreground).
- Firestore model:
  - `users/{uid}` profile { displayName, email, photoURL, unit, theme, accent, heightCm }
  - `users/{uid}/weights/{id}` { weightKg, date(ISO), note }
  - `users/{uid}/dailyLogs/{YYYY-MM-DD}` { date, calories, water, steps }
  - `users/{uid}/photos/{id}` { dataUrl, date, weightKg }
  - `users/{uid}/meta/goal` { targetWeightKg, startWeightKg, targetDate }

## Implemented (2026-06)
- Google sign-in landing page (Login.js) — VERIFIED rendering + auth init/resolve.
- App shell: desktop sidebar + mobile bottom nav, 6 sections.
- Dashboard: greeting, coach card, goal progress ring, stat cards, weight trend chart.
- Weight: add/delete weigh-ins, history with deltas, trend chart, goal reference line.
- Daily: calories / water / steps trackers with quick-add + recent days.
- Photos: upload (compressed), timeline grid, delete.
- Achievements: 12 data-driven badges with unlock progress.
- Settings: unit toggle (kg/lbs), theme switcher, accent presets + custom color, goal config, profile.
- Rule-based coach (lib/coach.js) — LLM-upgradeable later via Cloud Functions (user chose C).
- Firebase deploy config: firebase.json, .firebaserc, firestore.rules, firestore.indexes.json, DEPLOY.md.

## Verification status
- Build compiles cleanly; login screen + Firebase auth initialization VERIFIED via screenshot.
- Authenticated flows (Firestore CRUD, dashboard, logging) are IMPLEMENTED but NOT
  end-to-end tested, because real Google OAuth + the user's Firebase Console setup are
  required and cannot be automated here.

## Backlog / Next
- P1: LLM-powered coach via Firebase Cloud Functions (Blaze) — user wants later.
- P1: BMI insights (height already captured), weekly/monthly averages, CSV export.
- P2: Reminders/notifications, photo before/after compare slider, body measurements.
- P2: PWA/offline support, social share of milestones.
