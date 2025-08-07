import React, { useEffect, useState } from 'react';
import { DownloadIcon, UploadIcon, RefreshCcw } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function LeadsDashboard() {
  const [leads, setLeads] = useState([]);
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/most_recent_leads_with_hyperlinks.csv`)
      .then((res) => res.text())
      .then((csv) => {
        const [headerLine, ...rows] = csv.trim().split("\n");
        const headerArr = headerLine.split(",");
        const data = rows.map((row) => row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/));
        setHeaders(headerArr);
        setLeads(data);
      })
      .catch((err) => console.error("CSV load failed:", err));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target.result;
      const [headerLine, ...rows] = csv.trim().split("\n");
      const headerArr = headerLine.split(",");
      const data = rows.map((row) => row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/));
      setHeaders(headerArr);
      setLeads(data);
    };
    reader.readAsText(file);
  };

  const triggerBackendRefresh = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/generate-leads`);
      const data = await res.json();
      alert(data.message || "Done!");
    } catch (err) {
      alert("Failed to trigger backend");
      console.error(err);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Real-Time Leads</h1>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="upload-input"
          />
          <label htmlFor="upload-input">
            <button className="flex gap-2 items-center px-4 py-2 bg-blue-600 text-white rounded">
              <UploadIcon className="w-4 h-4" /> Upload CSV
            </button>
          </label>
          <a href={`${BACKEND_URL}/most_recent_leads_with_hyperlinks.csv`} download>
            <button className="flex gap-2 items-center px-4 py-2 bg-indigo-600 text-white rounded">
              <DownloadIcon className="w-4 h-4" /> Download CSV
            </button>
          </a>
          <button onClick={triggerBackendRefresh} className="flex gap-2 items-center px-4 py-2 bg-green-600 text-white rounded">
            <RefreshCcw className="w-4 h-4" /> Generate Leads
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[80vh] border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="p-2 font-semibold border-b">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((row, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                {row.map((cell, j) => (
                  <td key={j} className="p-2 whitespace-nowrap">
                    {cell.includes("http") ? (
                      <a
                        href={cell.match(/https?:\/\/[^\s)]+/g)?.[0]}
                        className="text-blue-600 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {cell.replace(/\s*\(https?:\/\/[^\s)]+\)/, '')}
                      </a>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
