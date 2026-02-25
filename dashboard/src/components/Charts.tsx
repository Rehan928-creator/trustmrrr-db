"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from "recharts";
import type { Database, Startup } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";

const CHART_COLORS = ["#333", "#3a3a3a", "#444", "#4a4a4a", "#555", "#5a5a5a", "#666", "#6a6a6a", "#777", "#888"];

type ChartView = "categories" | "countries" | "distribution" | "scatter" | "deals";

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border rounded-sm px-2.5 py-2 text-[0.65rem]" style={{ background: "#111" }}>
      <div className="text-text-secondary mb-0.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-text-primary">
          {p.name === "mrr" || p.name === "totalMRR"
            ? formatCurrency(p.value, true)
            : formatNumber(p.value)}
        </div>
      ))}
    </div>
  );
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function CategoriesChart({ db }: { db: Database }) {
  const data = useMemo(() => {
    return Object.entries(db.summary.categoriesBreakdown)
      .slice(0, 12)
      .map(([name, val]) => ({
        name: truncate(name, 14),
        fullName: name,
        totalMRR: val.totalMRR,
        count: val.count,
      }));
  }, [db]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#999" }}
          tickLine={false}
          axisLine={{ stroke: "#1a1a1a" }}
          height={35}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#777" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCurrency(v, true)}
          width={60}
        />
        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "#151515" }} />
        <Bar dataKey="totalMRR" name="mrr" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CountriesChart({ db }: { db: Database }) {
  const data = useMemo(() => {
    return Object.entries(db.summary.countryBreakdown)
      .filter(([k]) => k !== "Unknown")
      .slice(0, 15)
      .map(([code, val]) => ({
        name: code,
        totalMRR: val.totalMRR,
        count: val.count,
      }));
  }, [db]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#999" }}
          tickLine={false}
          axisLine={{ stroke: "#1a1a1a" }}
          interval={0}
          height={35}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#777" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCurrency(v, true)}
          width={60}
        />
        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "#151515" }} />
        <Bar dataKey="totalMRR" name="mrr" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DistributionChart({ startups }: { startups: Startup[] }) {
  const data = useMemo(() => {
    const buckets = [
      { name: "$0", min: 0, max: 0 },
      { name: "$1-100", min: 1, max: 100 },
      { name: "$100-500", min: 100, max: 500 },
      { name: "$500-1K", min: 500, max: 1000 },
      { name: "$1K-5K", min: 1000, max: 5000 },
      { name: "$5K-10K", min: 5000, max: 10000 },
      { name: "$10K-50K", min: 10000, max: 50000 },
      { name: "$50K-100K", min: 50000, max: 100000 },
      { name: "$100K+", min: 100000, max: Infinity },
    ];

    return buckets.map((b) => ({
      name: b.name,
      count: startups.filter((s) => {
        const m = s.mrr || 0;
        return m >= b.min && (b.max === Infinity ? true : m < b.max);
      }).length,
    }));
  }, [startups]);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#999" }}
          tickLine={false}
          axisLine={{ stroke: "#1a1a1a" }}
          height={35}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#777" }}
          tickLine={false}
          axisLine={false}
          width={45}
        />
        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "#151515" }} />
        <Bar dataKey="count" name="startups" radius={[2, 2, 0, 0]} fill="#555" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ScatterPlot({ startups }: { startups: Startup[] }) {
  const data = useMemo(() => {
    return startups
      .filter((s) => s.mrr && s.mrr > 0 && s.totalRevenue && s.totalRevenue > 0)
      .map((s) => ({
        name: s.name || s.slug,
        mrr: s.mrr!,
        revenue: s.totalRevenue!,
        subs: s.activeSubscriptions || 1,
      }))
      .slice(0, 300);
  }, [startups]);

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ScatterChart margin={{ top: 5, right: 10, bottom: 10, left: 5 }}>
        <XAxis
          dataKey="mrr"
          name="MRR"
          tick={{ fontSize: 11, fill: "#999" }}
          tickLine={false}
          axisLine={{ stroke: "#1a1a1a" }}
          tickFormatter={(v) => formatCurrency(v, true)}
          scale="log"
          domain={["auto", "auto"]}
        />
        <YAxis
          dataKey="revenue"
          name="Revenue"
          tick={{ fontSize: 10, fill: "#777" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCurrency(v, true)}
          scale="log"
          domain={["auto", "auto"]}
          width={65}
        />
        <ZAxis dataKey="subs" range={[20, 400]} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="border border-border rounded-sm px-2.5 py-2 text-[0.65rem]" style={{ background: "#111" }}>
                <div className="text-text-secondary mb-0.5">{d.name}</div>
                <div className="text-text-primary">MRR: {formatCurrency(d.mrr, true)}</div>
                <div className="text-text-primary">Rev: {formatCurrency(d.revenue, true)}</div>
              </div>
            );
          }}
        />
        <Scatter data={data} fill="#555" opacity={0.6} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ─── NEW: MRR vs Asking Price for for-sale startups ───
function DealScatter({ startups }: { startups: Startup[] }) {
  const data = useMemo(() => {
    return startups
      .filter((s) => s.onSale && s.mrr && s.mrr > 0 && s.askingPrice && s.askingPrice > 0)
      .map((s) => {
        const arr = s.mrr! * 12;
        const multiple = s.askingPrice! / arr;
        return {
          name: s.name || s.slug,
          mrr: s.mrr!,
          price: s.askingPrice!,
          multiple,
          growth: s.growth30d || 0,
          subs: s.activeSubscriptions || 1,
          category: s.userCategory || s.systemCategory || "Unknown",
        };
      });
  }, [startups]);

  // median multiple for reference line
  const medianMultiple = useMemo(() => {
    const multiples = data.map(d => d.multiple).sort((a, b) => a - b);
    if (multiples.length === 0) return 3;
    const mid = Math.floor(multiples.length / 2);
    return multiples.length % 2 !== 0 ? multiples[mid] : (multiples[mid - 1] + multiples[mid]) / 2;
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[0.6rem] text-text-dim">
          {data.length} for-sale startups · median multiple: {medianMultiple.toFixed(1)}x
        </div>
        <div className="flex items-center gap-3 text-[0.65rem]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green inline-block" /> below median</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red inline-block" /> above median</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 5, right: 10, bottom: 10, left: 5 }}>
          <XAxis
            dataKey="mrr"
            name="MRR"
            tick={{ fontSize: 11, fill: "#999" }}
            tickLine={false}
            axisLine={{ stroke: "#1a1a1a" }}
            tickFormatter={(v) => formatCurrency(v, true)}
            scale="log"
            domain={["auto", "auto"]}
            label={{ value: "MRR (monthly)", position: "insideBottom", offset: -2, fontSize: 10, fill: "#666" }}
          />
          <YAxis
            dataKey="price"
            name="Asking Price"
            tick={{ fontSize: 10, fill: "#777" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCurrency(v, true)}
            scale="log"
            domain={["auto", "auto"]}
            width={70}
            label={{ value: "Asking Price", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#666" }}
          />
          <ZAxis dataKey="subs" range={[30, 300]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="border border-border rounded-sm px-2.5 py-2 text-[0.65rem]" style={{ background: "#111" }}>
                  <div className="text-text-primary font-normal mb-1">{d.name}</div>
                  <div className="text-text-secondary">MRR: {formatCurrency(d.mrr, true)}/mo</div>
                  <div className="text-text-secondary">Price: {formatCurrency(d.price, true)}</div>
                  <div className={d.multiple < medianMultiple ? "text-green" : "text-red"}>
                    {d.multiple.toFixed(1)}x revenue multiple
                  </div>
                  {d.growth !== 0 && (
                    <div className="text-text-dim">Growth: {d.growth > 0 ? "+" : ""}{d.growth.toFixed(1)}%</div>
                  )}
                  <div className="text-text-dim">{d.category}</div>
                </div>
              );
            }}
          />
          <Scatter data={data}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.multiple < medianMultiple ? "#4ade80" : "#f87171"}
                opacity={d.multiple < medianMultiple ? 0.7 : 0.4}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Charts({ db }: { db: Database }) {
  const [view, setView] = useState<ChartView>("categories");

  const tabs: { key: ChartView; label: string }[] = [
    { key: "categories", label: "by category" },
    { key: "countries", label: "by country" },
    { key: "distribution", label: "mrr distribution" },
    { key: "scatter", label: "mrr vs revenue" },
    { key: "deals", label: "deal map" },
  ];

  return (
    <div
      className="border border-border rounded-sm animate-fade-in"
      style={{ background: "#0e0e0e", animationDelay: "350ms", animationFillMode: "backwards" }}
    >
      {/* tabs */}
      <div className="flex items-center gap-4 border-b border-border overflow-x-auto px-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-3 py-3 text-[0.75rem] transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
              view === tab.key
                ? "text-text-primary border-text-muted"
                : "text-text-muted hover:text-text-secondary border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* chart */}
      <div className="p-3">
        {view === "categories" && <CategoriesChart db={db} />}
        {view === "countries" && <CountriesChart db={db} />}
        {view === "distribution" && <DistributionChart startups={db.startups} />}
        {view === "scatter" && <ScatterPlot startups={db.startups} />}
        {view === "deals" && <DealScatter startups={db.startups} />}
      </div>
    </div>
  );
}
