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
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../firebase";

const userDoc = (uid) => doc(db, "users", uid);
const sub = (uid, name) => collection(db, "users", uid, name);

export async function ensureProfile(user) {
  const docRef = userDoc(user.uid);
  const snap = await getDoc(docRef);
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
    await setDoc(docRef, data);
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

export function updateWeight(uid, id, { weightKg, date, note }) {
  return updateDoc(doc(db, "users", uid, "weights", id), {
    weightKg,
    date,
    note: note || "",
  });
}

export function deleteWeight(uid, id) {
  return deleteDoc(doc(db, "users", uid, "weights", id));
}

export function subscribeDailyLogs(uid, cb) {
  const q = query(sub(uid, "dailyLogs"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export function upsertDailyLog(uid, dateKey, patch) {
  const logRef = doc(db, "users", uid, "dailyLogs", dateKey);
  return setDoc(logRef, { date: dateKey, ...patch }, { merge: true });
}

export function subscribePhotos(uid, cb) {
  const q = query(sub(uid, "photos"), orderBy("date", "desc"));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

export async function addPhoto(uid, { dataUrl, date, weightKg, note }) {
  const photoRef = ref(storage, `users/${uid}/photos/${Date.now()}.jpg`);
  await uploadString(photoRef, dataUrl, "data_url");
  const downloadURL = await getDownloadURL(photoRef);
  return addDoc(sub(uid, "photos"), {
    imageUrl: downloadURL,
    storagePath: photoRef.fullPath,
    date,
    weightKg: weightKg ?? null,
    note: note || "",
    createdAt: serverTimestamp(),
  });
}

export async function deletePhoto(uid, id, storagePath) {
  if (storagePath) {
    try { await deleteObject(ref(storage, storagePath)); } catch {}
  }
  return deleteDoc(doc(db, "users", uid, "photos", id));
}

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
