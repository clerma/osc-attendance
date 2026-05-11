import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./lib/auth.jsx";
import { supabase } from "./lib/supabase.js";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppHeader from "./components/AppHeader.jsx";

import Login from "./pages/Login.jsx";
import Counter from "./pages/Counter.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.jsx"));

function Shell({ children }) {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: "#F9F5F4",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#1A2942",
      }}
    >
      <AppHeader />
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-sm"
      style={{ color: "#6B7A92" }}
    >
      Loading…
    </div>
  );
}

function ProfileBootstrap({ children }) {
  const { session, profile, refreshProfile } = useAuth();

  useEffect(() => {
    if (!session?.user) return;
    if (profile) return;
    (async () => {
      const { user } = session;
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          role: "volunteer",
        },
        { onConflict: "id", ignoreDuplicates: true }
      );
      await refreshProfile();
    })();
  }, [session, profile, refreshProfile]);

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileBootstrap>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Shell>
                    <Counter />
                  </Shell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireAdmin>
                  <Shell>
                    <Dashboard />
                  </Shell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <Shell>
                    <AdminUsers />
                  </Shell>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ProfileBootstrap>
    </AuthProvider>
  );
}
