# WL Pro — Weight & Wellness Tracker

A motivating, **Firebase-native** weight & wellness tracker. Log your weight, track daily
habits (calories, water, steps), capture progress photos, stay consistent with streaks &
milestones, and get nudged by a coach. Built with React + Firebase, with an optional
AI coach powered by an LLM.

> Live preview is built with React (frontend) + a lightweight FastAPI backend (only used
> for the AI coach). All user data lives in **Firebase Auth + Firestore**.

---

## ✨ Features

- **Google Sign-In** (Firebase Authentication)
- **Weight tracking** with an interactive trend chart and goal reference line
- **Weekly-average trend** that smooths out day-to-day noise
- **Daily habits**: calories, water and steps with quick-add
- **Progress photos** + a **Before/After compare slider**
- **Streaks, 12 badges & milestones** to keep you motivated
- **AI Coach** (GPT-5.4) for short, personalized encouragement — with a smart
  rule-based fallback if the LLM is unavailable
- **3 themes** (Clean Light, Calm Dark, Energetic) + **custom accent color**
- **kg / lbs** toggle
- Photos stored as compressed data URLs in Firestore → runs on Firebase's **free Spark plan**

---

## 🧱 Tech stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 19, Tailwind CSS, shadcn/ui, Recharts, framer-motion, lucide-react |
| Data/Auth | Firebase Authentication (Google), Cloud Firestore |
| AI Coach  | FastAPI + `emergentintegrations` (OpenAI GPT-5.4) |

---

## 📁 Project structure

```
/
├── frontend/                 # React app (the main application)
│   ├── src/
│   │   ├── firebase.js        # Firebase web config + init
│   │   ├── contexts/          # AuthContext, AppContext (data + theme + units)
│   │   ├── lib/               # units, stats, coach, badges, data (Firestore), image, color
│   │   ├── components/        # AppShell, charts, ProgressRing, CoachCard, ComparePhotos…
│   │   ├── views/             # Dashboard, Weight, Daily, Photos, Achievements, Settings
│   │   └── pages/Login.js
│   ├── firebase.json          # Firebase Hosting + Firestore config
│   ├── firestore.rules        # Per-user security rules
│   └── DEPLOY.md              # Firebase deployment guide
└── backend/                  # FastAPI (only powers the AI coach endpoint)
    └── server.py              # POST /api/coach
```

---

## 🚀 Getting started (local / dev)

### Prerequisites
- Node.js 18+ and **Yarn**
- Python 3.10+ (only if you want the AI coach)

### 1. Frontend
```bash
cd frontend
yarn install
yarn start          # runs on http://localhost:3000
```

Create `frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```
> In Emergent/hosted environments this points to the deployed backend URL instead.

### 2. Backend (AI coach — optional)
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Create `backend/.env`:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="wlpro"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=your-llm-key-here
```
> The AI coach uses `EMERGENT_LLM_KEY`. Without it (or if it has no balance), the app
> automatically falls back to the built-in rule-based coach — nothing breaks.

---

## 🔥 Firebase setup (required for login & data)

In the [Firebase Console](https://console.firebase.google.com) for your project:

1. **Authentication → Sign-in method →** enable **Google**.
2. **Firestore Database →** Create database (Production mode).
3. **Authentication → Settings → Authorized domains →** add your dev/preview/hosting domains.
4. Publish security rules:
   ```bash
   cd frontend
   firebase deploy --only firestore:rules
   ```

The web config lives in `frontend/src/firebase.js`. (Firebase web API keys are safe to
expose in client code; access is controlled by Firestore security rules.)

---

## 📦 Deploy to Firebase Hosting

```bash
cd frontend
yarn build
firebase deploy --only hosting
```

See **`frontend/DEPLOY.md`** for the full guide.

> Note: Firebase Hosting is static, so the FastAPI AI-coach backend doesn't run there —
> the app uses the rule-based coach on a pure Firebase deploy. To get the LLM coach in a
> Firebase deploy, move the endpoint to a Firebase Cloud Function (Blaze plan).

---

## 🗄️ Firestore data model

```
users/{uid}                         profile { displayName, unit, theme, accent, heightCm }
users/{uid}/weights/{id}            { weightKg, date(ISO), note }
users/{uid}/dailyLogs/{YYYY-MM-DD}  { date, calories, water, steps }
users/{uid}/photos/{id}             { dataUrl, date, weightKg }
users/{uid}/meta/goal               { targetWeightKg, startWeightKg, targetDate }
```

Weights are stored internally in **kilograms**; the UI converts to the user's chosen unit.

---

Built with [Emergent](https://emergent.sh).
