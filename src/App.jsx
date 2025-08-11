import React, { useEffect, useMemo, useState } from "react";
import { DownloadIcon, UploadIcon, RefreshCcw, Search, Loader2 } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

function parseCsv(csv) {
  const lines = csv.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };

  // CSV-safe split: respects commas inside quotes
  const split = (line) =>
    line
      .match(/("([^"]|"")*"|[^,]*)/g)
      .filter(Boolean)
      .map((s) => s.replace(/^"(.*)"$/, "$1").replace(/""/g, '"').trim());

  const headers = split(lines[0]);
  const rows = lines.slice(1).map(split);
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
    const short = path && path !== "/" ? `${host}${path.length > 24 ? path.slice(0, 24) + "…" : path}` : host;
    return short;
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

  // Load CSV from backend
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

  // Quick text filter across all cells
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((row) => row.some((c) => String(c || "").toLowerCase().includes(q)));
  }, [leads, query]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Real-Time Leads</h1>

            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Upload CSV"
                />
                <span className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-50 active:scale-[.99]">
                  <UploadIcon className="h-4 w-4" /> Upload CSV
                </span>
              </label>

              <a
                href={`${BACKEND_URL}/most_recent_leads_with_hyperlinks.csv`}
                download
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-50 active:scale-[.99]"
              >
                <DownloadIcon className="h-4 w-4" /> Download CSV
              </a>

              <button
                onClick={triggerBackendRefresh}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-emerald-700 active:scale-[.99]"
              >
                <RefreshCcw className="h-4 w-4" /> Generate Leads
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3 flex items-center gap-2">
            <div className="relative w-full sm:w-96">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any column…"
                className="w-full rounded-lg border bg-white px-8 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-400"
              />
            </div>
            <div className="ml-auto text-xs text-neutral-500">{filtered.length.toLocaleString()} rows</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="overflow-auto rounded-xl border bg-white shadow-sm max-h-[80vh]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-neutral-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : errMsg ? (
            <div className="p-6 text-sm text-red-600">{errMsg}</div>
          ) : (
            <table className="w-full table-fixed text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-100/95 backdrop-blur">
                <tr>
                  <th className="w-14 px-2 py-2 text-right font-semibold text-neutral-700">#</th>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-left font-semibold text-neutral-700 border-l first:border-l-0"
                      title={h}
                    >
                      <div className="line-clamp-1">{h}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 ? "bg-neutral-50/60" : ""}>
                    <td className="px-2 py-2 text-right text-neutral-500 tabular-nums">{rIdx + 1}</td>
                    {headers.map((_, cIdx) => {
                      const cell = row[cIdx] ?? "";
                      const url = extractUrl(cell);
                      const label = url ? shortenUrl(url) : String(cell);

                      return (
                        <td key={cIdx} className="px-3 py-2 align-top border-l first:border-l-0">
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex max-w-[24rem] items-center gap-1 rounded-md px-2 py-1 text-blue-700 underline decoration-1 underline-offset-2 hover:text-blue-800"
                              title={String(cell)}
                            >
                              {label}
                            </a>
                          ) : (
                            <div className="max-w-[28rem] break-words text-neutral-800" title={String(cell)}>
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
          Tip: Click <span className="font-medium">Generate Leads</span> then refresh to pull the newest CSV.
        </div>
      </div>
    </div>
  );
}
