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
  const growthBonus = s.growth30d ? Math.max(-50, Math.min(50, s.growth30d)) / 100 : 0;
  const subStability = s.activeSubscriptions && s.activeSubscriptions > 10 ? 0.9 : 1.1;
  const revenueProof = s.totalRevenue && s.totalRevenue > annualRev * 2 ? 0.9 : 1.0;
  return Math.max(0, multiple * subStability * revenueProof * (1 - growthBonus));
}

interface InsightsProps {
  db: Database;
}

type InsightTab = "deals" | "growing" | "dying" | "cofounders";

// ─── DEAL CARD ───
function DealCard({ s, score, rank }: { s: Startup; score: number; rank: number }) {
  const [open, setOpen] = useState(false);
  const subs = s.activeSubscriptions || 0;
  const whaleRisk = s.mrr && subs > 0 && s.mrr / subs > s.mrr * 0.3;

  return (
    <>
      <tr
        className="table-row border-b border-border/30 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <td className="px-3 py-3 text-text-dim text-[0.7rem] w-8">{rank}</td>
        <td className="px-3 py-3 text-left">
          <div className="flex items-center gap-2">
            {s.country && <span className="text-sm">{getCountryFlag(s.country)}</span>}
            <div>
              <div className="text-[0.8rem] text-text-primary">{s.name}</div>
              <div className="text-[0.7rem] text-text-muted">
                {s.userCategory || s.systemCategory || "—"}
                {s.founderName && <span className="text-text-dim"> · {s.founderName}</span>}
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-right">
          <div className="text-[0.85rem] text-text-primary">{formatCurrency(s.askingPrice, true)}</div>
        </td>
        <td className="px-3 py-3 text-right">
          <div className="text-[0.8rem] text-green">{score.toFixed(1)}x</div>
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {formatCurrency(s.mrr, true)}<span className="text-text-dim">/mo</span>
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {formatCurrency((s.mrr || 0) * 12, true)}
        </td>
        <td className={`px-3 py-3 text-right text-[0.8rem] tabular-nums ${getGrowthColor(s.growth30d)}`}>
          {s.growth30d !== undefined ? formatPercent(s.growth30d) : "—"}
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {subs > 0 ? formatNumber(subs, true) : "—"}
          {whaleRisk && <span className="text-red ml-1" title="whale risk">!!</span>}
        </td>
      </tr>
      {open && <StartupDetail startup={s} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── GROWTH ROW ───
function GrowthRow({ s, rank }: { s: Startup; rank: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        className="table-row border-b border-border/30 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <td className="px-3 py-3 text-text-dim text-[0.7rem] w-8">{rank}</td>
        <td className="px-3 py-3 text-left">
          <div className="flex items-center gap-2">
            {s.country && <span className="text-sm">{getCountryFlag(s.country)}</span>}
            <div>
              <div className="text-[0.8rem] text-text-primary">
                {s.name}
                {s.onSale && <span className="for-sale-tag ml-2">{formatCurrency(s.askingPrice, true)}</span>}
              </div>
              <div className="text-[0.7rem] text-text-muted">
                {s.userCategory || s.systemCategory || "—"}
              </div>
            </div>
          </div>
        </td>
        <td className={`px-3 py-3 text-right text-[0.9rem] font-normal tabular-nums ${getGrowthColor(s.growth30d)}`}>
          {formatPercent(s.growth30d)}
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {formatCurrency(s.mrr, true)}<span className="text-text-dim">/mo</span>
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {formatCurrency(s.totalRevenue, true)}
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {s.activeSubscriptions ? formatNumber(s.activeSubscriptions, true) : "—"}
        </td>
      </tr>
      {open && <StartupDetail startup={s} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── DYING ROW ───
function DyingRow({ s, reason, rank }: { s: Startup; reason: string; rank: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        className="table-row border-b border-border/30 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <td className="px-3 py-3 text-text-dim text-[0.7rem] w-8">{rank}</td>
        <td className="px-3 py-3 text-left">
          <div className="flex items-center gap-2">
            {s.country && <span className="text-sm">{getCountryFlag(s.country)}</span>}
            <div>
              <div className="text-[0.8rem] text-text-primary">
                {s.name}
                {s.onSale && <span className="for-sale-tag ml-2">{formatCurrency(s.askingPrice, true)}</span>}
              </div>
              <div className="text-[0.7rem] text-text-muted">
                {s.userCategory || s.systemCategory || "—"}
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-right">
          <div className="text-[0.75rem] text-red">{reason}</div>
        </td>
        <td className={`px-3 py-3 text-right text-[0.85rem] tabular-nums ${getGrowthColor(s.growth30d)}`}>
          {s.growth30d !== undefined ? formatPercent(s.growth30d) : "—"}
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {formatCurrency(s.mrr, true)}<span className="text-text-dim">/mo</span>
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {formatCurrency(s.totalRevenue, true)}
        </td>
      </tr>
      {open && <StartupDetail startup={s} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── COFOUNDER ROW ───
function CofounderRow({ s, rank }: { s: Startup; rank: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        className="table-row border-b border-border/30 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <td className="px-3 py-3 text-text-dim text-[0.7rem] w-8">{rank}</td>
        <td className="px-3 py-3 text-left">
          <div className="flex items-center gap-2">
            {s.country && <span className="text-sm">{getCountryFlag(s.country)}</span>}
            <div>
              <div className="text-[0.8rem] text-text-primary">{s.name}</div>
              <div className="text-[0.7rem] text-text-muted">
                {s.userCategory || s.systemCategory || "—"}
                {s.founderName && <span className="text-text-dim"> · {s.founderName}</span>}
              </div>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {formatCurrency(s.mrr, true)}<span className="text-text-dim">/mo</span>
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {formatCurrency(s.totalRevenue, true)}
        </td>
        <td className="px-3 py-3 text-right text-[0.8rem] text-text-secondary tabular-nums">
          {s.activeSubscriptions ? formatNumber(s.activeSubscriptions, true) : "—"}
        </td>
        <td className="px-3 py-3 text-left text-[0.7rem] text-text-dim max-w-[300px] truncate">
          {s.description || "—"}
        </td>
      </tr>
      {open && <StartupDetail startup={s} onClose={() => setOpen(false)} />}
    </>
  );
}

export function Insights({ db }: InsightsProps) {
  const [tab, setTab] = useState<InsightTab>("deals");

  const deals = useMemo(() => {
    return db.startups
      .filter((s) => s.onSale && s.askingPrice && s.mrr && s.mrr > 0)
      .map((s) => ({ startup: s, score: computeDealScore(s)! }))
      .filter((d) => d.score !== null && d.score > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 20);
  }, [db.startups]);

  const growing = useMemo(() => {
    return db.startups
      .filter((s) => s.growth30d !== undefined && s.growth30d > 5 && s.mrr && s.mrr > 50)
      .sort((a, b) => (b.growth30d || 0) - (a.growth30d || 0))
      .slice(0, 20);
  }, [db.startups]);

  const dying = useMemo(() => {
    const atRisk: { startup: Startup; reason: string }[] = [];
    db.startups.forEach((s) => {
      if (!s.mrr || s.mrr <= 0) return;
      const reasons: string[] = [];
      if (s.growth30d !== undefined && s.growth30d < -20) reasons.push(`${s.growth30d.toFixed(0)}% decline`);
      if (s.apiKeyExpired) reasons.push("api expired");
      if (s.mrrGrowth30d !== undefined && s.mrrGrowth30d < -30) reasons.push("mrr crashing");
      if (reasons.length > 0) atRisk.push({ startup: s, reason: reasons.join(" · ") });
    });
    return atRisk.sort((a, b) => (a.startup.growth30d || 0) - (b.startup.growth30d || 0)).slice(0, 20);
  }, [db.startups]);

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
      className="border border-border rounded-sm overflow-hidden animate-fade-in"
      style={{ background: "#0e0e0e", animationDelay: "300ms", animationFillMode: "backwards" }}
    >
      {/* tabs */}
      <div className="flex items-center gap-4 border-b border-border overflow-x-auto px-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-3 text-[0.75rem] transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
              tab === t.key
                ? "text-text-primary border-text-muted"
                : "text-text-muted hover:text-text-secondary border-transparent"
            }`}
          >
            {t.label} <span className="text-[0.6rem] text-text-dim opacity-60">{t.count}</span>
          </button>
        ))}
      </div>

      {/* content */}
      <div className="overflow-x-auto">
        {tab === "deals" && (
          <div>
            <div className="px-4 pt-3 pb-2">
              <p className="text-[0.7rem] text-text-muted">
                for-sale startups ranked by deal score (revenue multiple adjusted for growth, subscriber stability, revenue history). lower = better deal.
              </p>
            </div>
            <table className="w-full text-[0.8rem]">
              <thead>
                <tr className="border-b border-border" style={{ background: "#0c0c0c" }}>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-left w-8">#</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-left">startup</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">price</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">score</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">mrr</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">arr</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">growth</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">subs</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d, i) => (
                  <DealCard key={d.startup.slug} s={d.startup} score={d.score} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "growing" && (
          <div>
            <div className="px-4 pt-3 pb-2">
              <p className="text-[0.7rem] text-text-muted">
                startups with highest 30-day revenue growth. min $50 mrr and +5% growth to filter noise.
              </p>
            </div>
            <table className="w-full text-[0.8rem]">
              <thead>
                <tr className="border-b border-border" style={{ background: "#0c0c0c" }}>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-left w-8">#</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-left">startup</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">30d growth</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">mrr</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">revenue</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">subs</th>
                </tr>
              </thead>
              <tbody>
                {growing.map((s, i) => (
                  <GrowthRow key={s.slug} s={s} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "dying" && (
          <div>
            <div className="px-4 pt-3 pb-2">
              <p className="text-[0.7rem] text-text-muted">
                startups with decline signals: negative growth, expired api keys, crashing mrr. potential distressed acquisition targets.
              </p>
            </div>
            <table className="w-full text-[0.8rem]">
              <thead>
                <tr className="border-b border-border" style={{ background: "#0c0c0c" }}>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-left w-8">#</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-left">startup</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">signals</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">growth</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">mrr</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">revenue</th>
                </tr>
              </thead>
              <tbody>
                {dying.map((d, i) => (
                  <DyingRow key={d.startup.slug} s={d.startup} reason={d.reason} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "cofounders" && (
          <div>
            <div className="px-4 pt-3 pb-2">
              <p className="text-[0.7rem] text-text-muted">
                {cofounders.length} startups actively looking for a cofounder. sorted by mrr.
              </p>
            </div>
            <table className="w-full text-[0.8rem]">
              <thead>
                <tr className="border-b border-border" style={{ background: "#0c0c0c" }}>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-left w-8">#</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-left">startup</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">mrr</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">revenue</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-right">subs</th>
                  <th className="px-3 py-2 text-[0.65rem] text-text-muted uppercase tracking-wider text-left">description</th>
                </tr>
              </thead>
              <tbody>
                {cofounders.map((s, i) => (
                  <CofounderRow key={s.slug} s={s} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
