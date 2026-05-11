import { useState } from "react";
import { Users, Mail, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + "/" },
      });
      if (err) throw err;
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grain min-h-screen flex items-center justify-center px-5 py-10">
      <div
        className="w-full max-w-sm rounded-2xl p-7"
        style={{
          backgroundColor: "white",
          boxShadow:
            "0 1px 0 rgba(31,86,140,0.04), 0 16px 48px -20px rgba(31,86,140,0.18)",
          border: "1px solid #ECE7E6",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#1F568C" }}
          >
            <Users size={20} color="#F9F5F4" strokeWidth={2.2} />
          </div>
          <div>
            <div
              className="text-[11px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: "#468FD8" }}
            >
              OSC · Internal Tool
            </div>
            <div
              className="serif text-xl leading-none mt-0.5"
              style={{ color: "#1F568C" }}
            >
              Attendance
            </div>
          </div>
        </div>

        <h1
          className="serif text-2xl mb-2"
          style={{ color: "#1F568C", fontWeight: 500 }}
        >
          Sign in
        </h1>
        <p className="text-sm mb-6" style={{ color: "#4A5A75" }}>
          We'll email you a magic link. Use your OSC staff email.
        </p>

        {sent ? (
          <div
            className="p-4 rounded-lg text-sm"
            style={{
              backgroundColor: "#F0F6FC",
              color: "#1F568C",
              border: "1px solid #DDE9F5",
            }}
          >
            Check your inbox. Tap the link on this device to finish signing in.
          </div>
        ) : (
          <form onSubmit={send} className="space-y-3">
            <label
              className="block text-[11px] uppercase tracking-wider font-semibold"
              style={{ color: "#6B7A92" }}
            >
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                color="#6B7A92"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@oursaviorschurch.org"
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none"
                style={{
                  border: "1px solid #DDDDDD",
                  backgroundColor: "#FBFAF8",
                  color: "#1A2942",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                backgroundColor: sending ? "#C5D5E5" : "#1F568C",
                color: "white",
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending…
                </>
              ) : (
                "Send link"
              )}
            </button>
            {error && (
              <div
                className="text-sm p-2.5 rounded-md"
                style={{ backgroundColor: "#FEF2EC", color: "#9C4221" }}
              >
                {error}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
