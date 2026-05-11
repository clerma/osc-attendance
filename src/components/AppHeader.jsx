import { Link, useLocation } from "react-router-dom";
import { Users, Sparkles, LogOut, BarChart3, UsersRound } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";

export default function AppHeader() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const isAdmin = profile?.role === "admin";

  const navLinkStyle = (active) => ({
    color: active ? "#1F568C" : "#6B7A92",
    backgroundColor: active ? "#A7CEF2" : "transparent",
  });

  return (
    <header className="border-b" style={{ borderColor: "#DDDDDD" }}>
      <div className="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#1F568C" }}
          >
            <Users size={18} color="#F9F5F4" strokeWidth={2.2} />
          </div>
          <div>
            <div
              className="text-[11px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: "#468FD8" }}
            >
              OSC · Internal Tool
            </div>
            <div
              className="serif text-lg leading-none mt-0.5"
              style={{ color: "#1F568C" }}
            >
              Attendance
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full"
                style={navLinkStyle(location.pathname.startsWith("/dashboard"))}
              >
                <BarChart3 size={13} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full"
                style={navLinkStyle(location.pathname.startsWith("/admin"))}
              >
                <UsersRound size={13} />
                <span className="hidden sm:inline">Users</span>
              </Link>
            </>
          )}
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "#A7CEF2", color: "#1F568C" }}
          >
            <Sparkles size={12} />
            <span className="font-medium">Prototype</span>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full"
            style={{ color: "#6B7A92" }}
            title="Sign out"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
