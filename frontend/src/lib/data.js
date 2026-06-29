import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const userDoc = (uid) => doc(db, "users", uid);
const sub = (uid, name) => collection(db, "users", uid, name);

// ---------- Profile ----------
export async function ensureProfile(user) {
  const ref = userDoc(user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const data = {
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      unit: "kg",
      theme: "light",
      accent: "",
      heightCm: null,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return data;
  }
  return snap.data();
}

export function subscribeProfile(uid, cb) {
  return onSnapshot(userDoc(uid), (snap) => cb(snap.exists() ? snap.data() : null));
}

export function updateProfile(uid, patch) {
  return updateDoc(userDoc(uid), patch);
}

// ---------- Weights ----------
export function subscribeWeights(uid, cb) {
  const q = query(sub(uid, "weights"), orderBy("date", "asc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export function addWeight(uid, { weightKg, date, note }) {
  return addDoc(sub(uid, "weights"), {
    weightKg,
    date,
    note: note || "",
    createdAt: serverTimestamp(),
  });
}

export function deleteWeight(uid, id) {
  return deleteDoc(doc(db, "users", uid, "weights", id));
}

// ---------- Daily logs (calories / water / steps) keyed by YYYY-MM-DD ----------
export function subscribeDailyLogs(uid, cb) {
  const q = query(sub(uid, "dailyLogs"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export function upsertDailyLog(uid, dateKey, patch) {
  const ref = doc(db, "users", uid, "dailyLogs", dateKey);
  return setDoc(ref, { date: dateKey, ...patch }, { merge: true });
}

// ---------- Photos (data URLs) ----------
export function subscribePhotos(uid, cb) {
  const q = query(sub(uid, "photos"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export function addPhoto(uid, { dataUrl, date, weightKg, note }) {
  return addDoc(sub(uid, "photos"), {
    dataUrl,
    date,
    weightKg: weightKg ?? null,
    note: note || "",
    createdAt: serverTimestamp(),
  });
}

export function deletePhoto(uid, id) {
  return deleteDoc(doc(db, "users", uid, "photos", id));
}

// ---------- Goal (single doc) ----------
export function subscribeGoal(uid, cb) {
  return onSnapshot(doc(db, "users", uid, "meta", "goal"), (snap) =>
    cb(snap.exists() ? snap.data() : null),
  );
}

export function setGoal(uid, { targetWeightKg, targetDate, startWeightKg }) {
  return setDoc(doc(db, "users", uid, "meta", "goal"), {
    targetWeightKg,
    targetDate: targetDate || null,
    startWeightKg,
    updatedAt: serverTimestamp(),
  });
}
