import { useEffect, useMemo, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const COL_P_INDEX = 15;

function parseCsv(csv) {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };
  const split = (line) =>
    line
      .match(/("([^"]|"")*"|[^,]*)/g)
      .filter(Boolean)
      .map((s) =>
        s
          .replace(/^"(.*)"$/, "$1")
          .replace(/""/g, '"')
          .trim()
      );
  let headers = split(lines[0]);
  let rows = lines.slice(1).map(split);

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
    return path && path !== "/"
      ? `${host}${path.length > 24 ? path.slice(0, 24) + "…" : path}`
      : host;
  } catch {
    return url.length > 28 ? url.slice(0, 28) + "…" : url;
  }
}

function convertPhilippinesToUK(dateTimeStr) {
  if (!dateTimeStr || typeof dateTimeStr !== "string") return dateTimeStr;

  const dateTimePattern = /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}$/;
  if (!dateTimePattern.test(dateTimeStr.trim())) return dateTimeStr;

  try {
    const [datePart, timePart] = dateTimeStr.trim().split(/\s+/);
    const [month, day, year] = datePart.split("/");
    const [hour, minute, second] = timePart.split(":");

    const philippinesDate = new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      second
    );

    const ukDate = new Date(philippinesDate.getTime() - 7 * 60 * 60 * 1000);

    return ukDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.warn("Failed to convert timestamp:", dateTimeStr, error);
    return dateTimeStr;
  }
}

function isTimestampColumn(header, value) {
  const timestampHeaders = ["timestamp", "time", "date", "created", "updated"];
  const headerLower = (header || "").toLowerCase();
  const hasTimestampHeader = timestampHeaders.some((keyword) =>
    headerLower.includes(keyword)
  );

  if (!hasTimestampHeader) return false;

  const dateTimePattern = /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}$/;
  return dateTimePattern.test(String(value || "").trim());
}

function getIndustryColor(industry) {
  const colors = {
    Hospitality: "bg-orange-100 text-orange-800 border-orange-200",
    Miscellaneous: "bg-purple-100 text-purple-800 border-purple-200",
    Technology: "bg-blue-100 text-blue-800 border-blue-200",
    Healthcare: "bg-green-100 text-green-800 border-green-200",
    Finance: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Education: "bg-indigo-100 text-indigo-800 border-indigo-200",
    Retail: "bg-pink-100 text-pink-800 border-pink-200",
    Manufacturing: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[industry] || "bg-slate-100 text-slate-800 border-slate-200";
}

function formatPhoneNumber(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
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
      onLogin?.(data.user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border-white/20 p-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6 animate-bounce">
              <span className="text-white font-bold text-3xl">📊</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Welcome Back</h1>
            <p className="text-white/80 text-lg">
              Access your leads command center
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label className="block text-white/90 text-sm font-semibold mb-3">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="block text-white/90 text-sm font-semibold mb-3">
                Password
              </label>
              <input
                type="password"
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {err && (
              <div className="bg-red-500/20 border-red-400/50 rounded-2xl px-5 py-4 text-red-200 backdrop-blur-sm animate-shake">
                <div className="flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>{err}</span>
                </div>
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold py-4 rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 shadow-2xl transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */
function LeadsDashboard({ onLogout }) {
  const [headers, setHeaders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [dark, setDark] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDesc, setSortDesc] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    dark ? root.classList.add("dark") : root.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/most_recent_leads_with_hyperlinks.csv`,
          { credentials: "include" }
        );
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
      const res = await fetch(`${BACKEND_URL}/generate-leads`, {
        credentials: "include",
      });
      const data = await res.json();
      alert(data.message || "Done!");
    } catch (err) {
      console.error(err);
      alert("Failed to trigger backend");
    }
  };

  const logout = async () => {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    onLogout?.();
  };

  const industries = useMemo(() => {
    const industryIndex = headers.indexOf("Industry Type");
    if (industryIndex === -1) return [];
    const uniqueIndustries = [
      ...new Set(leads.map((row) => row[industryIndex]).filter(Boolean)),
    ];
    return uniqueIndustries.sort();
  }, [headers, leads]);

  const filtered = useMemo(() => {
    let result = leads;

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((row) =>
        row.some((c) =>
          String(c || "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    if (selectedIndustry) {
      const industryIndex = headers.indexOf("Industry Type");
      if (industryIndex !== -1) {
        result = result.filter(
          (row) => row[industryIndex] === selectedIndustry
        );
      }
    }

    if (sortBy) {
      const sortIndex = headers.indexOf(sortBy);
      if (sortIndex !== -1) {
        result = [...result].sort((a, b) => {
          const aVal = String(a[sortIndex] || "");
          const bVal = String(b[sortIndex] || "");
          const comparison = aVal.localeCompare(bVal);
          return sortDesc ? -comparison : comparison;
        });
      }
    }

    return result;
  }, [leads, query, selectedIndustry, headers, sortBy, sortDesc]);

  const handleSort = (header) => {
    if (sortBy === header) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(header);
      setSortDesc(false);
    }
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        dark
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      }`}
    >
      <div
        className={`backdrop-blur-xl shadow-2xl border-b transition-all duration-500 ${
          dark
            ? "bg-slate-800/50 border-slate-700"
            : "bg-white/80 border-gray-200/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className={`text-5xl font-black bg-gradient-to-r `}>
                  Real-Time Leads
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div
                    className={`px-4 py-2 rounded-full font-bold text-sm ${
                      dark
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {filtered.length.toLocaleString()} leads
                  </div>
                  <div
                    className={`px-4 py-2 rounded-full font-bold text-sm ${
                      dark
                        ? "bg-green-500/20 text-green-300"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    🇬🇧 UK Timezone
                  </div>
                  {selectedIndustry && (
                    <div
                      className={`px-4 py-2 rounded-full font-bold text-sm ${getIndustryColor(
                        selectedIndustry
                      )}`}
                    >
                      {selectedIndustry}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* <button
                onClick={() => setDark(!dark)}
                className={`px-5 py-3 backdrop-blur rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg ${
                  dark
                    ? "bg-slate-700/60 border-slate-600 text-white hover:bg-slate-600/60"
                    : "bg-white/60 border-gray-200 text-gray-700 hover:bg-white/80"
                }`}
              >
                {dark ? "☀️ Light" : "🌙 Dark"}
              </button> */}

              <button
                onClick={logout}
                className={`px-5 py-3 border-0 bg-transparent font-semibold hover:scale-105 `}
              >
                🚪 Logout
              </button>

              <label className="relative cursor-pointer group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className={`px-5 py-3 backdrop-blur rounded-2xl font-semibold transition-all group-hover:scale-105 shadow-lg ${
                    dark
                      ? "bg-slate-700/60 border-slate-600 text-white hover:bg-slate-600/60"
                      : "bg-white/60 border-gray-200 text-gray-700 hover:bg-white/80"
                  }`}
                >
                  📁 Upload CSV
                </div>
              </label>

              <a
                href={`${BACKEND_URL}/most_recent_leads_with_hyperlinks.csv`}
                download
                className={`px-5 py-3 backdrop-blur rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg ${
                  dark
                    ? "bg-slate-700/60 border-slate-600 text-white hover:bg-slate-600/60"
                    : "bg-white/60 border-gray-200 text-gray-700 hover:bg-white/80"
                }`}
              >
                💾 Download
              </a>

              <button
                onClick={triggerBackendRefresh}
                className="px-6 py-3 border-0 bg-transparent hover:scale-105"
              >
                ⚡ Generate Leads
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div
          className={`backdrop-blur-xl rounded-3xl shadow-2xl p-6 transition-all duration-500 ${
            dark
              ? "bg-slate-800/50 border-slate-700"
              : "bg-white/70 border-white/50"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search companies, phones, postcodes, addresses..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={`w-full pl-14 pr-6 py-4 rounded-2xl border-2 font-medium focus:outline-none focus:ring-4 transition-all duration-300 ${
                    dark
                      ? "bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500/30 focus:border-blue-400"
                      : "bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-blue-500/20 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>

            <div>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className={`w-full px-5 py-4 rounded-2xl border-2 font-medium focus:outline-none focus:ring-4 transition-all duration-300 ${
                  dark
                    ? "bg-slate-700/50 border-slate-600 text-white focus:ring-purple-500/30 focus:border-purple-400"
                    : "bg-white/50 border-gray-200 text-gray-900 focus:ring-purple-500/20 focus:border-purple-500"
                }`}
              >
                <option value="">🏢 All Industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(query || selectedIndustry) && (
            <div className="flex items-center space-x-3 mt-6 pt-6 border-t border-gray-200/50">
              <span
                className={`font-semibold ${
                  dark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Active filters:
              </span>
              {query && (
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${
                    dark
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  <span>Search: "{query}"</span>
                  <button
                    onClick={() => setQuery("")}
                    className="hover:bg-blue-500/20 rounded-full p-1"
                  >
                    ×
                  </button>
                </div>
              )}
              {selectedIndustry && (
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${getIndustryColor(
                    selectedIndustry
                  )}`}
                >
                  <span>{selectedIndustry}</span>
                  <button
                    onClick={() => setSelectedIndustry("")}
                    className="hover:bg-black/10 rounded-full p-1"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div
          className={`backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
            dark
              ? "bg-slate-800/50 border-slate-700"
              : "bg-white/70 border-white/50"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6 animate-spin"></div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    dark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Loading your leads...
                </h3>
                <p className={`${dark ? "text-gray-400" : "text-gray-600"}`}>
                  Fetching the latest data from your sources
                </p>
              </div>
            </div>
          ) : errMsg ? (
            <div className="p-20 text-center">
              <div className="text-8xl mb-6">💥</div>
              <h3 className="text-2xl font-bold text-red-500 mb-4">
                Oops! Something went wrong
              </h3>
              <p
                className={`text-lg ${
                  dark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {errMsg}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`border-b-2 transition-all duration-500 ${
                      dark
                        ? "bg-slate-700/50 border-slate-600"
                        : "bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200"
                    }`}
                  >
                    <th
                      className={`px-6 py-6 text-left text-sm font-bold uppercase tracking-wider ${
                        dark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      #
                    </th>
                    {headers.map((h, i) => {
                      const isTimestamp = isTimestampColumn(h, "");
                      const isActive = sortBy === h;
                      return (
                        <th
                          key={i}
                          className={`px-6 py-6 text-left text-sm font-bold uppercase tracking-wider cursor-pointer hover:bg-black/5 transition-all ${
                            dark
                              ? "text-gray-300 hover:bg-white/5"
                              : "text-gray-700"
                          } ${isActive ? "bg-blue-50" : ""}`}
                          onClick={() => handleSort(h)}
                        >
                          <div className="flex items-center space-x-2">
                            {isTimestamp && (
                              <span className="text-green-500">🕒</span>
                            )}
                            <span>{isTimestamp ? `${h} (UK)` : h}</span>
                            {isActive && (
                              <span className="text-blue-500">
                                {sortDesc ? "↓" : "↑"}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filtered.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${
                        rIdx % 2 === 0
                          ? dark
                            ? "bg-slate-800/30 hover:bg-slate-700/50"
                            : "bg-white/50 hover:bg-blue-50/80"
                          : dark
                          ? "bg-slate-700/30 hover:bg-slate-600/50"
                          : "bg-gray-50/30 hover:bg-blue-50/80"
                      }`}
                    >
                      <td
                        className={`px-6 py-5 text-sm font-bold ${
                          dark ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            dark
                              ? "bg-slate-600 text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {rIdx + 1}
                        </div>
                      </td>
                      {headers.map((header, cIdx) => {
                        const cell = row[cIdx] ?? "";
                        const url = extractUrl(cell);
                        const isTimestamp = isTimestampColumn(header, cell);
                        const isIndustry = header === "Industry Type";
                        const isPhone = header.toLowerCase().includes("phone");

                        const displayValue = isTimestamp
                          ? convertPhilippinesToUK(cell)
                          : cell;
                        const label = url
                          ? shortenUrl(url)
                          : isPhone
                          ? formatPhoneNumber(displayValue)
                          : String(displayValue);

                        return (
                          <td key={cIdx} className="px-6 py-5 align-top">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg hover:scale-105 group"
                                title={String(cell)}
                              >
                                <span>{label}</span>
                              </a>
                            ) : isIndustry ? (
                              <div
                                className={`inline-flex items-center px-3 py-2 rounded-xl font-semibold text-sm ${getIndustryColor(
                                  displayValue
                                )}`}
                              >
                                {displayValue}
                              </div>
                            ) : (
                              <div
                                className={`text-sm ${
                                  isTimestamp
                                    ? `inline-flex items-center px-3 py-2 rounded-xl font-bold shadow-lg ${
                                        dark
                                          ? "bg-green-500/20 text-green-300"
                                          : "bg-green-100 text-green-800"
                                      }`
                                    : isPhone
                                    ? `font-mono font-semibold ${
                                        dark ? "text-blue-300" : "text-blue-700"
                                      }`
                                    : dark
                                    ? "text-gray-300"
                                    : "text-gray-900"
                                }`}
                                title={String(displayValue)}
                              >
                                {label}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length === 0 && !loading && !errMsg && (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">🔍</div>
              <h3
                className={`text-2xl font-bold mb-4 ${
                  dark ? "text-white" : "text-gray-700"
                }`}
              >
                No leads found
              </h3>
              <p
                className={`text-lg ${
                  dark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Try adjusting your search criteria or filters
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
                  >
                    Clear search
                  </button>
                )}
                {selectedIndustry && (
                  <button
                    onClick={() => setSelectedIndustry("")}
                    className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-all"
                  >
                    Clear industry filter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`backdrop-blur-xl rounded-2xl p-6 transition-all duration-500 ${
                dark
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-white/60 border-gray-200/50"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
                <div>
                  <div
                    className={`text-2xl font-bold ${
                      dark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {filtered.length.toLocaleString()}
                  </div>
                  <div
                    className={`text-sm ${
                      dark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Total Leads
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`backdrop-blur-xl rounded-2xl p-6 transition-all duration-500 ${
                dark
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-white/60 border-gray-200/50"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">🏢</span>
                </div>
                <div>
                  <div
                    className={`text-2xl font-bold ${
                      dark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {industries.length}
                  </div>
                  <div
                    className={`text-sm ${
                      dark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Industries
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`backdrop-blur-xl rounded-2xl p-6 transition-all duration-500 ${
                dark
                  ? "bg-slate-800/50 border-slate-700"
                  : "bg-white/60 border-gray-200/50"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">🕒</span>
                </div>
                <div>
                  <div
                    className={`text-2xl font-bold ${
                      dark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Live
                  </div>
                  <div
                    className={`text-sm ${
                      dark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Real-time Data
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) setUser(data.user);
        }
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) return null;
  if (!user) return <Login onLogin={setUser} />;
  return (
    <LeadsDashboard
      onLogout={() => (window.location.href = window.location.href)}
    />
  );
}
