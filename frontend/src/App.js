import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Dumbbell } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import AppShell from "@/components/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/views/Dashboard";
import WeightView from "@/views/WeightView";
import DailyView from "@/views/DailyView";
import PhotosView from "@/views/PhotosView";
import AchievementsView from "@/views/AchievementsView";
import SettingsView from "@/views/SettingsView";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground">
        <Dumbbell className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted-foreground">Loading WL Pro…</p>
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  return <AppShell>{children}</AppShell>;
}

function Landing() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/app" replace />;
  return <Login />;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <AppProvider>
          <Toaster position="top-center" richColors />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<Protected><Dashboard /></Protected>} />
              <Route path="/app/weight" element={<Protected><WeightView /></Protected>} />
              <Route path="/app/daily" element={<Protected><DailyView /></Protected>} />
              <Route path="/app/photos" element={<Protected><PhotosView /></Protected>} />
              <Route
                path="/app/achievements"
                element={<Protected><AchievementsView /></Protected>}
              />
              <Route path="/app/settings" element={<Protected><SettingsView /></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
