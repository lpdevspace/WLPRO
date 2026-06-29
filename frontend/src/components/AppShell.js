import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LineChart,
  Activity,
  Camera,
  Trophy,
  Settings,
  LogOut,
  Dumbbell,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true, id: "dashboard" },
  { to: "/app/weight", label: "Weight", icon: LineChart, id: "weight" },
  { to: "/app/daily", label: "Daily", icon: Activity, id: "daily" },
  { to: "/app/photos", label: "Photos", icon: Camera, id: "photos" },
  { to: "/app/achievements", label: "Awards", icon: Trophy, id: "achievements" },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { profile } = useApp();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/60 p-5 backdrop-blur md:flex">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span className="font-heading text-xl font-extrabold tracking-tight">
            WL&nbsp;Pro
          </span>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.id}
              to={n.to}
              end={n.end}
              data-testid={`nav-${n.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <n.icon className="h-[18px] w-[18px]" />
              {n.label}
            </NavLink>
          ))}
          <NavLink
            to="/app/settings"
            data-testid="nav-settings"
            className={({ isActive }) =>
              `mt-1 flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <Settings className="h-[18px] w-[18px]" />
            Settings
          </NavLink>
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-[var(--radius)] border border-border p-3">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {(profile?.displayName || user?.email || "U")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {profile?.displayName || "Athlete"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            data-testid="logout-btn"
            className="text-muted-foreground transition-colors hover:text-destructive"
            title="Sign out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="font-heading text-lg font-extrabold">WL Pro</span>
        </div>
        <button onClick={logout} data-testid="logout-btn-mobile" className="text-muted-foreground">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Main content */}
      <main className="px-4 pb-28 pt-6 md:ml-64 md:px-10 md:pb-12 md:pt-10">
        <div key={location.pathname} className="animate-float-up mx-auto max-w-6xl">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card/90 px-2 py-2 backdrop-blur md:hidden">
        {NAV.map((n) => (
          <NavLink
            key={n.id}
            to={n.to}
            end={n.end}
            data-testid={`bottomnav-${n.id}`}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
