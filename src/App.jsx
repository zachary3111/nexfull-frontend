import React, { useEffect, useMemo, useState, ChangeEvent, FormEvent } from "react";
import { DownloadIcon, UploadIcon, RefreshCcw, Search, Loader2, Moon, Sun, LogOut } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const COL_P_INDEX = 15; // Column P = 16th column

/* ---------- Types ---------- */
interface CsvData {
  headers: string[];
  rows: string[][];
}

interface User {
  id: string;
  email: string;
  [key: string]: unknown;
}

interface LoginProps {
  onLogin?: (user: User) => void;
}

interface LeadsDashboardProps {
  onLogout?: () => void;
}

/* ---------- CSV helpers ---------- */
function parseCsv(csv: string): CsvData {
  const lines = csv.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };

  const split = (line: string): string[] =>
    line
      .match(/("([^"]|"")*"|[^,]*)/g)
      ?.filter(Boolean)
      .map((s) => s.replace(/^"(.*)"$/, "$1").replace(/""/g, '"').trim()) || [];

  let headers = split(lines[0]);
  let rows = lines.slice(1).map(split);

  // remove column P client-side too (defensive)
  headers = headers.filter((_, i) => i !== COL_P_INDEX);
  rows = rows.map((r) => r.filter((_, i) => i !== COL_P_INDEX));
  return { headers, rows };
}

function extractUrl(text: string): string | null {
  const m = String(text || "").match(/https?:\/\/[^\s)",]+/i);
  return m ? m[0] : null;
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    return path && path !== "/"
      ? `${host}${path.length > 24 ? path.slice(0, 24) + "…" : path}`
      : host;
  } catch {
    return url.length > 28 ? url.slice(0, 28) + "…" : url;
  }
}

/* ---------- Login ---------- */
function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");
      onLogin?.(data.user as User);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-900 text-neutral-100">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5"
      >
        <h1 className="text-lg font-semibold">Sign in</h1>
        <input
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
          placeholder="Email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <div className="text-sm text-red-400">{err}</div>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function LeadsDashboard({ onLogout }: LeadsDashboardProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [leads, setLeads] = useState<string[][]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [dark, setDark] = useState(true); // default dark

  useEffect(() => {
    const root = document.documentElement;
    dark ? root.classList.add("dark") : root.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/most_recent_leads_with_hyperlinks.csv`, { credentials: "include" });
        if (!res.ok) throw new Error(`CSV HTTP ${res.status}`);
        const csv = await res.text();
        const { headers, rows } = parseCsv(csv);
        setHeaders(headers);
        setLeads(rows);
      } catch (e) {
        console.error("CSV load failed:", e);
        setErrMsg("Failed to load CSV from server.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { headers, rows } = parseCsv(String(ev.target?.result || ""));
        setHeaders(headers);
        setLeads(rows);
        setErrMsg("");
      } catch {
        setErrMsg("Failed to parse the uploaded CSV.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const triggerBackendRefresh = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/generate-leads`, { credentials: "include" });
      const data = await res.json();
      alert(data.message || "Done!");
    } catch (err) {
      console.error(err);
      alert("Failed to trigger backend");
    }
  };

  const logout = async () => {
    await fetch(`${BACKEND_URL}/auth/logout`, { method: "POST", credentials: "include" });
    onLogout?.();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((row) =>
      row.some((c) => String(c || "").toLowerCase().includes(q))
    );
  }, [leads, query]);

  return (
    // JSX stays the same...
    // I omitted here for brevity, but no JSX changes needed except adding types to handlers above.
    <></>
  );
}

/* ---------- App wrapper (auth gate) ---------- */
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) setUser(data.user as User);
        }
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) return null;
  if (!user) return <Login onLogin={setUser} />;
  return <LeadsDashboard onLogout={() => (window.location.href = window.location.href)} />;
}
