# WL Pro — Firebase Deployment Guide

WL Pro is a **Firebase-native** React app: Google Sign-In (Firebase Auth) + Firestore
for all data. Progress photos are stored as compressed data URLs in Firestore, so it
runs entirely on the **free Spark plan** — no Cloud Storage / Blaze required.

## 1. One-time Firebase Console setup (required for the app to work)

1. **Enable Google sign-in**
   - Firebase Console → **Authentication** → **Sign-in method** → enable **Google**.
2. **Create Firestore**
   - Firebase Console → **Firestore Database** → **Create database** (Production mode).
3. **Authorize your domains** (so Google login popup is allowed)
   - Authentication → **Settings** → **Authorized domains** → add:
     - your preview domain (e.g. `weight-tracker-184.preview.emergentagent.com`)
     - your Firebase hosting domains: `wlpro-c9e0e.web.app` and `wlpro-c9e0e.firebaseapp.com`

## 2. Publish security rules

```bash
cd frontend
firebase deploy --only firestore:rules
```

These rules (in `firestore.rules`) ensure each user can only access their own data.

## 3. Build & deploy to Firebase Hosting

```bash
cd frontend
yarn install
yarn build
firebase deploy --only hosting
```

(First time only: `npm i -g firebase-tools && firebase login`.)

Your app will be live at: https://wlpro-c9e0e.web.app

## Data model (Firestore)

```
users/{uid}                         -> profile { displayName, unit, theme, accent, heightCm }
users/{uid}/weights/{id}            -> { weightKg, date, note }
users/{uid}/dailyLogs/{YYYY-MM-DD}  -> { date, calories, water, steps }
users/{uid}/photos/{id}             -> { dataUrl, date, weightKg }
users/{uid}/meta/goal               -> { targetWeightKg, startWeightKg, targetDate }
```
