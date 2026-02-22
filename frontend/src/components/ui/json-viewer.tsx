"use client";

import { useState } from "react";

export function JsonViewer({ value }: { value: unknown }) {
  const [collapsed, setCollapsed] = useState(false);
  const text = JSON.stringify(value, null, 2);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <button className="text-sm font-medium text-sap-700" onClick={() => setCollapsed((v) => !v)}>
          {collapsed ? "Expand JSON" : "Collapse JSON"}
        </button>
        <button
          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:border-slate-300"
          onClick={() => navigator.clipboard.writeText(text)}
        >
          Copy
        </button>
      </div>
      {!collapsed ? <pre className="max-h-[460px] overflow-auto p-3 text-xs text-slate-800">{text}</pre> : null}
    </div>
  );
}
