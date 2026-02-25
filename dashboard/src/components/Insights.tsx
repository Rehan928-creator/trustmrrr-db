"use client";

import { useMemo, useState } from "react";
import type { Startup, Database } from "@/lib/types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getGrowthColor,
  getCountryFlag,
} from "@/lib/format";
import { StartupDetail } from "./StartupDetail";

// ─── DEAL SCORE: lower = better deal ───
function computeDealScore(s: Startup): number | null {
  if (!s.onSale || !s.askingPrice || !s.mrr || s.mrr <= 0) return null;
  const annualRev = s.mrr * 12;
  const multiple = s.askingPrice / annualRev;
  // factor in growth (positive growth = better deal)
  const growthBonus = s.growth30d ? Math.max(-50, Math.min(50, s.growth30d)) / 100 : 0;
  // factor in subscriber count (more subs = more stable)
  const subStability = s.activeSubscriptions && s.activeSubscriptions > 10 ? 0.9 : 1.1;
  // factor in revenue age (more total rev = more proven)
  const revenueProof = s.totalRevenue && s.totalRevenue > annualRev * 2 ? 0.9 : 1.0;
  return Math.max(0, multiple * subStability * revenueProof * (1 - growthBonus));
}

// ─── WHALE RISK: revenue concentration ───
function computeWhaleRisk(s: Startup): { level: "low" | "medium" | "high" | "extreme" | null; arps: number | null } {
  if (!s.mrr || s.mrr <= 0) return { level: null, arps: null };
  const subs = s.activeSubscriptions || 0;
  if (subs === 0) return { level: null, arps: null };
  const arps = s.mrr / subs;
  // If ARPS is > 50% of MRR, extreme whale risk (1-2 customers paying everything)
  if (arps > s.mrr * 0.3) return { level: "extreme", arps };
  if (arps > s.mrr * 0.1) return { level: "high", arps };
  if (arps > 500) return { level: "medium", arps };
  return { level: "low", arps };
}

interface InsightsProps {
  db: Database;
}

type InsightTab = "deals" | "growing" | "dying" | "cofounders";

function DealCard({ s, score }: { s: Startup; score: number }) {
  const [open, setOpen] = useState(false);
  const annualRev = (s.mrr || 0) * 12;
  const whale = computeWhaleRisk(s);

  return (
    <>
      <div
        className="border border-border/50 rounded-sm p-3 cursor-pointer transition-colors hover:border-border-hover"
        style={{ background: "#0c0c0c" }}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {s.country && <span className="text-[0.7rem]">{getCountryFlag(s.country)}</span>}
              <span className="text-[0.75rem] text-text-primary truncate">{s.name}</span>
            </div>
            <div className="text-[0.6rem] text-text-dim mt-0.5">
              {s.userCategory || s.systemCategory || "—"}
              {s.founderName && <span> · {s.founderName}</span>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[0.8rem] text-text-primary font-normal">
              {formatCurrency(s.askingPrice, true)}
            </div>
            <div className="text-[0.6rem] text-green">
              {score.toFixed(1)}x score
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-[0.6rem]">
          <div>
            <div className="text-text-dim">mrr</div>
            <div className="text-text-secondary">{formatCurrency(s.mrr, true)}</div>
          </div>
          <div>
            <div className="text-text-dim">arr</div>
            <div className="text-text-secondary">{formatCurrency(annualRev, true)}</div>
          </div>
          <div>
            <div className="text-text-dim">growth</div>
            <div className={getGrowthColor(s.growth30d)}>
              {s.growth30d !== undefined ? formatPercent(s.growth30d) : "—"}
            </div>
          </div>
          <div>
            <div className="text-text-dim">subs</div>
            <div className="text-text-secondary">
              {s.activeSubscriptions ? formatNumber(s.activeSubscriptions, true) : "—"}
            </div>
          </div>
        </div>

        {whale.level && whale.level !== "low" && (
          <div className={`mt-2 text-[0.55rem] ${
            whale.level === "extreme" ? "text-red" : whale.level === "high" ? "text-amber" : "text-text-muted"
          }`}>
            {whale.level} whale risk · {formatCurrency(whale.arps, true)}/sub
          </div>
        )}

        {s.sellerMessage && (
          <div className="mt-2 text-[0.6rem] text-text-dim italic line-clamp-2">
            &ldquo;{s.sellerMessage}&rdquo;
          </div>
        )}
      </div>
      {open && <StartupDetail startup={s} onClose={() => setOpen(false)} />}
    </>
  );
}

function GrowthCard({ s }: { s: Startup }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="flex items-center gap-3 py-2 px-3 border border-border/30 rounded-sm cursor-pointer transition-colors hover:border-border-hover"
        style={{ background: "#0c0c0c" }}
        onClick={() => setOpen(true)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {s.country && <span className="text-[0.65rem]">{getCountryFlag(s.country)}</span>}
            <span className="text-[0.7rem] text-text-primary truncate">{s.name}</span>
            {s.onSale && <span className="for-sale-tag ml-1">{formatCurrency(s.askingPrice, true)}</span>}
          </div>
          <div className="text-[0.55rem] text-text-dim mt-0.5">
            {formatCurrency(s.mrr, true)}/mo · {s.activeSubscriptions ? formatNumber(s.activeSubscriptions, true) + " subs" : ""} · {s.userCategory || s.systemCategory || ""}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-[0.8rem] font-normal ${getGrowthColor(s.growth30d)}`}>
            {formatPercent(s.growth30d)}
          </div>
          <div className="text-[0.55rem] text-text-dim">30d</div>
        </div>
      </div>
      {open && <StartupDetail startup={s} onClose={() => setOpen(false)} />}
    </>
  );
}

function DyingCard({ s, reason }: { s: Startup; reason: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="flex items-center gap-3 py-2 px-3 border border-border/30 rounded-sm cursor-pointer transition-colors hover:border-border-hover"
        style={{ background: "#0c0c0c" }}
        onClick={() => setOpen(true)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {s.country && <span className="text-[0.65rem]">{getCountryFlag(s.country)}</span>}
            <span className="text-[0.7rem] text-text-primary truncate">{s.name}</span>
            {s.onSale && <span className="for-sale-tag ml-1">{formatCurrency(s.askingPrice, true)}</span>}
          </div>
          <div className="text-[0.55rem] text-text-dim mt-0.5">
            {formatCurrency(s.mrr, true)}/mo · {s.userCategory || s.systemCategory || ""}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[0.6rem] text-red">{reason}</div>
          {s.growth30d !== undefined && (
            <div className={`text-[0.7rem] ${getGrowthColor(s.growth30d)}`}>
              {formatPercent(s.growth30d)}
            </div>
          )}
        </div>
      </div>
      {open && <StartupDetail startup={s} onClose={() => setOpen(false)} />}
    </>
  );
}

function CofounderCard({ s }: { s: Startup }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="border border-border/30 rounded-sm p-3 cursor-pointer transition-colors hover:border-border-hover"
        style={{ background: "#0c0c0c" }}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {s.country && <span className="text-[0.65rem]">{getCountryFlag(s.country)}</span>}
              <span className="text-[0.7rem] text-text-primary truncate">{s.name}</span>
            </div>
            {s.description && (
              <div className="text-[0.6rem] text-text-dim mt-1 line-clamp-2">{s.description}</div>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-[0.55rem] text-text-dim">
              <span>{formatCurrency(s.mrr, true)}/mo</span>
              <span>·</span>
              <span>{s.userCategory || s.systemCategory || "—"}</span>
              {s.founderName && (
                <>
                  <span>·</span>
                  <span>{s.founderName}</span>
                </>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <span className="pill pill-amber text-[0.55rem]">looking for cofounder</span>
          </div>
        </div>
      </div>
      {open && <StartupDetail startup={s} onClose={() => setOpen(false)} />}
    </>
  );
}

export function Insights({ db }: InsightsProps) {
  const [tab, setTab] = useState<InsightTab>("deals");

  // ─── DEAL RADAR ───
  const deals = useMemo(() => {
    return db.startups
      .filter((s) => s.onSale && s.askingPrice && s.mrr && s.mrr > 0)
      .map((s) => ({ startup: s, score: computeDealScore(s)! }))
      .filter((d) => d.score !== null && d.score > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 20);
  }, [db.startups]);

  // ─── FASTEST GROWING ───
  const growing = useMemo(() => {
    return db.startups
      .filter((s) => s.growth30d !== undefined && s.growth30d > 5 && s.mrr && s.mrr > 50)
      .sort((a, b) => (b.growth30d || 0) - (a.growth30d || 0))
      .slice(0, 20);
  }, [db.startups]);

  // ─── DYING / AT RISK ───
  const dying = useMemo(() => {
    const atRisk: { startup: Startup; reason: string }[] = [];

    db.startups.forEach((s) => {
      if (!s.mrr || s.mrr <= 0) return;

      const reasons: string[] = [];
      if (s.growth30d !== undefined && s.growth30d < -20) reasons.push(`${s.growth30d.toFixed(0)}% decline`);
      if (s.apiKeyExpired) reasons.push("api expired");
      if (s.mrrGrowth30d !== undefined && s.mrrGrowth30d < -30) reasons.push("mrr crashing");

      if (reasons.length > 0) {
        atRisk.push({ startup: s, reason: reasons.join(" · ") });
      }
    });

    return atRisk
      .sort((a, b) => (a.startup.growth30d || 0) - (b.startup.growth30d || 0))
      .slice(0, 20);
  }, [db.startups]);

  // ─── COFOUNDER OPPORTUNITIES ───
  const cofounders = useMemo(() => {
    return db.startups
      .filter((s) => s.lookingForCofounder === true)
      .sort((a, b) => (b.mrr || 0) - (a.mrr || 0));
  }, [db.startups]);

  const tabs: { key: InsightTab; label: string; count: number }[] = [
    { key: "deals", label: "deal radar", count: deals.length },
    { key: "growing", label: "fastest growing", count: growing.length },
    { key: "dying", label: "at risk", count: dying.length },
    { key: "cofounders", label: "cofounders", count: cofounders.length },
  ];

  return (
    <div
      className="border border-border rounded-sm animate-fade-in"
      style={{ background: "#0e0e0e", animationDelay: "300ms", animationFillMode: "backwards" }}
    >
      {/* tabs */}
      <div className="flex items-center border-b border-border overflow-x-auto">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-[0.7rem] transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
              tab === t.key
                ? "text-text-primary border-text-muted"
                : "text-text-muted hover:text-text-secondary border-transparent"
            } ${i > 0 ? "ml-1" : ""}`}
          >
            {t.label}
            <span className="ml-1.5 text-[0.55rem] text-text-dim">{t.count}</span>
          </button>
        ))}
      </div>

      {/* content */}
      <div className="p-4">
        {tab === "deals" && (
          <div>
            <p className="text-[0.65rem] text-text-dim mb-3">
              for-sale startups ranked by deal score (revenue multiple adjusted for growth, subscriber stability, and revenue history). lower = better deal.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {deals.map((d) => (
                <DealCard key={d.startup.slug} s={d.startup} score={d.score} />
              ))}
            </div>
          </div>
        )}

        {tab === "growing" && (
          <div>
            <p className="text-[0.65rem] text-text-dim mb-3">
              startups with highest 30-day revenue growth. minimum $50 mrr and +5% growth to filter noise.
            </p>
            <div className="space-y-1.5">
              {growing.map((s) => (
                <GrowthCard key={s.slug} s={s} />
              ))}
            </div>
          </div>
        )}

        {tab === "dying" && (
          <div>
            <p className="text-[0.65rem] text-text-dim mb-3">
              startups showing decline signals: negative growth, expired api keys, crashing mrr. potential distressed acquisition targets.
            </p>
            <div className="space-y-1.5">
              {dying.map((d) => (
                <DyingCard key={d.startup.slug} s={d.startup} reason={d.reason} />
              ))}
            </div>
          </div>
        )}

        {tab === "cofounders" && (
          <div>
            <p className="text-[0.65rem] text-text-dim mb-3">
              {cofounders.length} startups actively looking for a cofounder. sorted by mrr.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cofounders.map((s) => (
                <CofounderCard key={s.slug} s={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
