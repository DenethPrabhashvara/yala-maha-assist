"use client";

import type { Dict } from "../../lib/i18n";
import { useMemo, useState } from "react";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import coverage from "../../lib/coverage.json";

type Entry = { name: string; type: "tank" | "river" | "canal"; detail: string };
const ENTRIES = coverage as Entry[];

const simplify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9඀-෿஀-௿]+/g, " ").replace(/\b(wewa|tank|reservoir)\b/g, "").replace(/\s+/g, "");

export default function CoverageCheck({ t }: { t: Dict }) {
  const words = t.faq.lookup;
  const [query, setQuery] = useState("");
  const q = simplify(query);
  const matches = useMemo(
    () => (q.length < 2 ? [] : ENTRIES.filter((e) => simplify(`${e.name} ${e.detail}`).includes(q)).slice(0, 6)),
    [q],
  );

  return (
    <div className="site-mt-4">
      <label className="site-flex items-center gap-2.5 rounded-xl border border-default-200 bg-default-100 px-4 py-3 focus-within:border-default-800">
        <Search className="size-4 shrink-0 text-default-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={words.placeholder}
          aria-label={words.placeholder}
          className="w-full bg-transparent text-base text-default-900 outline-none placeholder:text-default-400"
        />
      </label>
      <div aria-live="polite" className="site-mt-3">
        {q.length >= 2 && matches.length > 0 && (
          <ul className="site-space-y-2">
            {matches.map((entry) => (
              <li key={`${entry.type}-${entry.name}`} className="site-flex items-start gap-2.5 text-base">
                <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-600" />
                <span>
                  <span className="font-semibold text-default-900">{entry.name}</span>
                  <span className="text-default-500">
                    {" "}
                    · {words[entry.type]}
                    {entry.detail ? ` · ${entry.detail}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {q.length >= 2 && matches.length === 0 && (
          <p className="site-flex items-start gap-2.5 text-base text-default-600">
            <XCircle className="mt-0.5 size-4.5 shrink-0 text-default-400" />
            {words.notCovered}
          </p>
        )}
      </div>
    </div>
  );
}
