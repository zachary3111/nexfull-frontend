<div className="overflow-auto rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm max-h-[80vh]">
  {loading ? (
    <div className="flex items-center justify-center gap-2 p-10 text-neutral-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading…
    </div>
  ) : errMsg ? (
    <div className="p-6 text-sm text-red-400">{errMsg}</div>
  ) : (
    <table className="w-full text-sm border-collapse">
      <thead className="sticky top-0 z-10 bg-neutral-850/95 backdrop-blur">
        <tr>
          <th
            className="sticky left-0 z-20 w-14 px-2 py-2 text-right font-semibold text-neutral-300 bg-neutral-850 border-b border-neutral-800"
          >
            #
          </th>
          {headers.map((h, i) => (
            <th
              key={i}
              className="px-3 py-2 text-left font-semibold text-neutral-300 border-b border-neutral-800 border-l first:border-l-0 whitespace-nowrap"
              title={h}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filtered.map((row, rIdx) => (
          <tr key={rIdx} className={rIdx % 2 ? "bg-neutral-900" : "bg-neutral-950"}>
            <td
              className="sticky left-0 z-10 px-2 py-2 text-right text-neutral-500 tabular-nums bg-neutral-900 border-b border-neutral-800"
            >
              {rIdx + 1}
            </td>
            {headers.map((_, cIdx) => {
              const cell = row[cIdx] ?? "";
              const url = extractUrl(cell);
              const label = url ? shortenUrl(url) : String(cell);

              return (
                <td
                  key={cIdx}
                  className="px-3 py-2 align-top border-b border-neutral-800 border-l first:border-l-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-[20rem]"
                >
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 underline decoration-1 underline-offset-2 hover:text-blue-200"
                      title={String(cell)}
                    >
                      {label}
                    </a>
                  ) : (
                    <span title={String(cell)}>{label}</span>
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
