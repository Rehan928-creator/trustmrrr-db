"use client";

import { useState } from "react";
import type { Startup } from "@/lib/types";

interface ExportButtonProps {
  startups: Startup[];
  totalCount: number;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCSV(startups: Startup[]): string {
  const headers = [
    "name", "slug", "country", "mrr", "totalRevenue", "estimatedARR",
    "last30DaysRevenue", "growth30d", "mrrGrowth30d", "customerCount",
    "activeSubscriptions", "revenuePerCustomer", "avgRevenuePerSubscription",
    "category", "businessType", "pricingModel", "paymentProvider",
    "founderName", "founderTwitter", "founderFollowers",
    "onSale", "askingPrice", "revenueMultiple", "mrrMultiple",
    "lookingForCofounder", "status", "website", "url",
  ];

  const escape = (v: unknown): string => {
    if (v === undefined || v === null) return "";
    const str = String(v);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = startups.map((s) =>
    headers.map((h) => {
      if (h === "category") return escape(s.userCategory || s.systemCategory || "");
      return escape((s as unknown as Record<string, unknown>)[h]);
    }).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function ExportButton({ startups, totalCount }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const isFiltered = startups.length < totalCount;
  const label = isFiltered ? `${startups.length} filtered` : `all ${startups.length}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-[0.65rem] text-text-muted hover:text-text-secondary border border-border rounded-sm px-2.5 py-1.5 transition-colors cursor-pointer"
      >
        export {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-50 border border-border rounded-sm py-1 min-w-[140px]"
            style={{ background: "#111" }}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-[0.65rem] text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors cursor-pointer"
              onClick={() => {
                const json = JSON.stringify(startups, null, 2);
                downloadFile(json, `trustmrrr-${startups.length}.json`, "application/json");
                setOpen(false);
              }}
            >
              download .json
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-[0.65rem] text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors cursor-pointer"
              onClick={() => {
                const csv = toCSV(startups);
                downloadFile(csv, `trustmrrr-${startups.length}.csv`, "text/csv");
                setOpen(false);
              }}
            >
              download .csv
            </button>
          </div>
        </>
      )}
    </div>
  );
}
