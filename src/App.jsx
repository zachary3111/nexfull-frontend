import React, { useEffect, useMemo, useState } from "react";
import { DownloadIcon, UploadIcon, RefreshCcw, Search, Loader2, Moon, Sun } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const COL_P_INDEX = 15; // Column P = 16th col (0-based 15)

// ---- CSV helpers
function parseCsv(csv) {
  const lines = csv.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };

  // split respecting quotes
  const split = (line) =>
    line
      .match(/("([^"]|"")*"|[^,]*)/g)
      .filter(Boolean)
      .map((s) => s.replace(/^"(.*)"$/, "$1").replace(/""/g, '"').trim());

  let headers = split(lines[0]);
  let rows = lines.slice(1).map(split);

  // remove column P from headers + rows
  headers = headers.filter((_, i) => i !== COL_P_INDEX);
  rows = rows.map((r) => r.filter((_, i) => i !== COL_P_INDEX));

  return { headers, rows };
}

function extractUrl(text) {
  const m = String(text || "").match(/https?:\/\/[^\s)",]+/i);
  return m ? m[0] : null;
}
function shortenUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    return path && path !== "/" ? `${host}${path.length > 24 ? path.slice(0, 24) + "…" : path}` : host;
  } catch {
    return url.length > 28 ? url.slice(0, 28) + "…" : url;
  }
}

export default function LeadsDashboard() {
  const [headers, setHeaders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [dark, setDark] = useState(true); // default dark

  // keep <html class="dark"> in sync for Tailwind dark mode
  useEffect(() => {
    const root = document.documentElement;
    dark ? root.classList.add("dark") : root.classList.remove("dark");
  }, [dark]);

  // Load from backend
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/most_recent_leads_with_hyperlinks.csv`);
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

  // Upload local CSV
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { headers, rows } = parseCsv(String(ev.target.result || ""));
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
      const res = await fetch(`${BACKEND_URL}/generate-leads`);
      const data = await res.json();
      alert(data.message || "Done!");
    } catch (err) {
      console.error(err);
      alert("Failed to trigger backend");
    }
  };

  // Filter rows by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((row) => row.some((c) => String(c || "").toLowerCase().includes(q)));
  }, [leads, query]);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Real-Time Leads</h1>

            <div className="flex flex-wrap items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setDark((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-750"
                title="Toggle theme"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {dark ? "Light" : "Dark"}
              </button>

              <label className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-750">
                  <UploadIcon className="h-4 w-4" /> Upload CSV
                </span>
              </label>

              <a
                href={`${BACKEND_URL}/most_recent_leads_with_hyperlinks.csv`}
                download
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-750"
              >
                <DownloadIcon className="h-4 w-4" /> Download CSV
              </a>

              <button
                onClick={triggerBackendRefresh}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
              >
                <RefreshCcw className="h-4 w-4" /> Generate Leads
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3 flex items-center gap-2">
            <div className="relative w-full sm:w-96">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any column…"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-8 py-2 text-sm placeholder:text-neutral-500 focus:border-neutral-600 outline-none"
              />
            </div>
            <div className="ml-auto text-xs text-neutral-400">{filtered.length.toLocaleString()} rows</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="overflow-auto rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm max-h-[80vh]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : errMsg ? (
            <div className="p-6 text-sm text-red-400">{errMsg}</div>
          ) : (
            <table className="w-full table-fixed text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-850/95 backdrop-blur">
                <tr>
                  <th className="w-14 px-2 py-2 text-right font-semibold text-neutral-300">#</th>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-left font-semibold text-neutral-300 border-l border-neutral-800 first:border-l-0"
                      title={h}
                    >
                      <div className="line-clamp-1">{h}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filtered.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 ? "bg-neutral-900" : "bg-neutral-950"}>
                    <td className="px-2 py-2 text-right text-neutral-500 tabular-nums">{rIdx + 1}</td>
                    {headers.map((_, cIdx) => {
                      const cell = row[cIdx] ?? "";
                      const url = extractUrl(cell);
                      const label = url ? shortenUrl(url) : String(cell);

                      return (
                        <td key={cIdx} className="px-3 py-2 align-top border-l border-neutral-800 first:border-l-0">
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex max-w-[24rem] items-center gap-1 rounded-md px-2 py-1 text-blue-300 underline decoration-1 underline-offset-2 hover:text-blue-200"
                              title={String(cell)}
                            >
                              {label}
                            </a>
                          ) : (
                            <div className="max-w-[28rem] break-words text-neutral-200" title={String(cell)}>
                              <span className="line-clamp-3">{label}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-3 text-xs text-neutral-500">
          Tip: Click <span className="font-medium text-neutral-300">Generate Leads</span> then refresh to pull the newest CSV.
        </div>
      </div>
    </div>
  );
}
