import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  ensureProfile,
  subscribeProfile,
  subscribeWeights,
  subscribeDailyLogs,
  subscribePhotos,
  subscribeGoal,
  updateProfile,
} from "../lib/data";
import { computeStats } from "../lib/stats";
import { hexToHslString, contrastForeground } from "../lib/color";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [weights, setWeights] = useState([]);
  const [logs, setLogs] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [goal, setGoalState] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setWeights([]);
      setLogs([]);
      setPhotos([]);
      setGoalState(null);
      return;
    }
    setDataLoading(true);
    ensureProfile(user).catch(() => {});
    const unsubs = [
      subscribeProfile(user.uid, (p) => {
        setProfile(p);
        setDataLoading(false);
      }),
      subscribeWeights(user.uid, setWeights),
      subscribeDailyLogs(user.uid, setLogs),
      subscribePhotos(user.uid, setPhotos),
      subscribeGoal(user.uid, setGoalState),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [user]);

  const unit = profile?.unit || "kg";
  const theme = profile?.theme || "light";
  const accent = profile?.accent || "";

  // Apply theme + custom accent to the document root.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (accent && /^#?[0-9a-fA-F]{3,6}$/.test(accent)) {
      const hsl = hexToHslString(accent);
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
      root.style.setProperty("--primary-foreground", contrastForeground(accent));
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--primary-foreground");
    }
  }, [theme, accent]);

  const stats = useMemo(
    () => computeStats(weights, logs, goal, photos),
    [weights, logs, goal, photos],
  );

  const setUnit = (u) => user && updateProfile(user.uid, { unit: u });
  const setTheme = (t) => user && updateProfile(user.uid, { theme: t });
  const setAccent = (a) => user && updateProfile(user.uid, { accent: a });

  return (
    <AppContext.Provider
      value={{
        uid: user?.uid,
        profile,
        weights,
        logs,
        photos,
        goal,
        stats,
        unit,
        theme,
        accent,
        dataLoading,
        setUnit,
        setTheme,
        setAccent,
        updateProfile: (patch) => user && updateProfile(user.uid, patch),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
