import React, { useState, useMemo } from "react";
import {
  LineChart as LineChartIcon,
  BarChart2,
  Layers,
  ShieldCheck,
  PackageOpen,
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Sun,
  Moon,
  Boxes,
} from "lucide-react";
import {
  ComposedChart,
  BarChart,
  Area,
  Bar,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ───────────────────────── Konstanta ───────────────────────── */

const KEYS = [
  {
    key: "Baru",
    pct: "pctBaru",
    label: "% Baru (Segel)",
    color: "#0090e7",
    dot: "bg-[#0090e7]",
    grad: "kb_baru",
    area: "kb_area_baru",
  },
  {
    key: "Bekas",
    pct: "pctBekas",
    label: "% Bekas (Second)",
    color: "#f59e0b",
    dot: "bg-[#f59e0b]",
    grad: "kb_bekas",
    area: "kb_area_bekas",
  },
  {
    key: "Rusak",
    pct: "pctRusak",
    label: "% Rusak",
    color: "#e11d48",
    dot: "bg-[#e11d48]",
    grad: "kb_rusak",
    area: "kb_area_rusak",
  },
];

const chartTypeOptions = [
  {
    id: "line",
    label: "Garis",
    icon: LineChartIcon,
    caption: "Tren persentase tiap kondisi dari bulan ke bulan.",
  },
  {
    id: "grouped-bar",
    label: "Batang",
    icon: BarChart2,
    caption: "Perbandingan persentase Baru, Bekas, dan Rusak di tiap bulan.",
  },
  {
    id: "stacked-bar",
    label: "Stacked Bar",
    icon: Layers,
    caption: "Satu batang = 100% barang pada bulan itu, terbagi per kondisi.",
  },
];

const defaultData = [
  {
    name: "Jan",
    fullMonth: "Januari",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
  {
    name: "Feb",
    fullMonth: "Februari",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
  {
    name: "Mar",
    fullMonth: "Maret",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
  {
    name: "Apr",
    fullMonth: "April",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
  {
    name: "Mei",
    fullMonth: "Mei",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
  {
    name: "Jun",
    fullMonth: "Juni",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
  {
    name: "Jul",
    fullMonth: "Juli",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
  {
    name: "Agu",
    fullMonth: "Agustus",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
  {
    name: "Sep",
    fullMonth: "September",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
  {
    name: "Okt",
    fullMonth: "Oktober",
    Baru: 6,
    Bekas: 5,
    Rusak: 3,
    pctBaru: 50,
    pctBekas: 34,
    pctRusak: 16,
  },
  {
    name: "Nov",
    fullMonth: "November",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
  {
    name: "Des",
    fullMonth: "Desember",
    Baru: 0,
    Bekas: 0,
    Rusak: 0,
    pctBaru: 0,
    pctBekas: 0,
    pctRusak: 0,
  },
];

/* Gaya tiap kartu (class Tailwind ditulis utuh agar terbaca compiler) */
const CARD_STYLES = {
  Baru: {
    Icon: ShieldCheck,
    light:
      "bg-gradient-to-br from-[#e3f3ff] via-white to-[#c4e4ff] border-sky-100 hover:border-sky-300",
    dark: "bg-gradient-to-br from-sky-950/70 via-slate-900 to-slate-900 border-sky-900/60 hover:border-sky-700",
    badge: "from-[#38bdf8] via-[#0284c7] to-[#0369a1]",
    badgeShadow:
      "shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-4px_8px_rgba(0,0,0,0.35),0_12px_24px_rgba(2,132,199,0.35)]",
    value: "text-[#0080e5]",
    trackLight: "bg-sky-100",
    trackDark: "bg-sky-950",
    bar: "from-sky-400 to-sky-600",
    ghostLight: "text-sky-200/80",
    ghostDark: "text-sky-800/30",
    ringLight: "border-sky-200/70",
    ringDark: "border-sky-800/30",
    corner: "from-[#38bdf8] to-[#0284c7]",
    chipLight: "bg-sky-100 text-sky-700",
    chipDark: "bg-sky-900/50 text-sky-300",
  },
  Bekas: {
    Icon: PackageOpen,
    light:
      "bg-gradient-to-br from-[#fff4d1] via-white to-[#ffe3a0] border-amber-100 hover:border-amber-300",
    dark: "bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border-amber-900/50 hover:border-amber-700",
    badge: "from-[#fbbf24] via-[#f59e0b] to-[#d97706]",
    badgeShadow:
      "shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-4px_8px_rgba(0,0,0,0.35),0_12px_24px_rgba(245,158,11,0.35)]",
    value: "text-[#f59e0b]",
    trackLight: "bg-amber-100",
    trackDark: "bg-amber-950",
    bar: "from-amber-300 to-amber-500",
    ghostLight: "text-amber-200/80",
    ghostDark: "text-amber-800/30",
    ringLight: "border-amber-200/70",
    ringDark: "border-amber-800/30",
    corner: "from-[#fbbf24] to-[#f59e0b]",
    chipLight: "bg-amber-100 text-amber-700",
    chipDark: "bg-amber-900/50 text-amber-300",
  },
  Rusak: {
    Icon: AlertTriangle,
    light:
      "bg-gradient-to-br from-[#ffe6ed] via-white to-[#ffc8d6] border-rose-100 hover:border-rose-300",
    dark: "bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-900 border-rose-900/50 hover:border-rose-700",
    badge: "from-[#fb7185] via-[#e11d48] to-[#be123c]",
    badgeShadow:
      "shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-4px_8px_rgba(0,0,0,0.35),0_12px_24px_rgba(225,29,72,0.35)]",
    value: "text-[#e11d48]",
    trackLight: "bg-rose-100",
    trackDark: "bg-rose-950",
    bar: "from-rose-400 to-rose-600",
    ghostLight: "text-rose-200/80",
    ghostDark: "text-rose-800/30",
    ringLight: "border-rose-200/70",
    ringDark: "border-rose-800/30",
    corner: "from-[#fb7185] to-[#e11d48]",
    chipLight: "bg-rose-100 text-rose-700",
    chipDark: "bg-rose-900/50 text-rose-300",
  },
  Insight: {
    Icon: CalendarDays,
    light:
      "bg-gradient-to-br from-[#ede9ff] via-white to-[#d9cdff] border-violet-100 hover:border-violet-300",
    dark: "bg-gradient-to-br from-violet-950/60 via-slate-900 to-slate-900 border-violet-900/50 hover:border-violet-700",
    badge: "from-[#c084fc] via-[#8b5cf6] to-[#6d28d9]",
    badgeShadow:
      "shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-4px_8px_rgba(0,0,0,0.35),0_12px_24px_rgba(139,92,246,0.35)]",
    value: "text-[#7c3aed]",
    ghostLight: "text-violet-200/80",
    ghostDark: "text-violet-800/30",
    ringLight: "border-violet-200/70",
    ringDark: "border-violet-800/30",
    corner: "from-[#c084fc] to-[#8b5cf6]",
    chipLight: "bg-violet-100 text-violet-700",
    chipDark: "bg-violet-900/50 text-violet-300",
  },
};

const fmtNum = (n, d = 1) =>
  Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: d });
const sumPct = (r) =>
  (Number(r.pctBaru) || 0) +
  (Number(r.pctBekas) || 0) +
  (Number(r.pctRusak) || 0);
const sumUnits = (r) =>
  (Number(r.Baru) || 0) + (Number(r.Bekas) || 0) + (Number(r.Rusak) || 0);

/* ───────────────────────── Bentuk grafik kustom ───────────────────────── */

/* Batang berdiri: ujung atas membulat + kilau tipis */
const PillarBar = ({ x, y, width, height, fill }) => {
  if (!height || height <= 0 || !width) return null;
  const r = Math.min(9, width / 2, height);
  const d = `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
  return (
    <g>
      <path d={d} fill={fill} />
      {height > r + 8 && width > 10 && (
        <rect
          x={x + 3}
          y={y + r}
          width={3}
          height={height - r - 6}
          rx={1.5}
          fill="#fff"
          opacity={0.3}
        />
      )}
    </g>
  );
};

/* Segmen stacked bar: hanya segmen paling atas yang membulat, ada angka di dalam */
const StackSegment = ({ x, y, width, height, fill, isTop, label, isDark }) => {
  if (!height || height <= 0 || !width) return null;
  const r = isTop ? Math.min(10, width / 2, height) : 0;
  const d = isTop
    ? `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`
    : `M${x},${y} H${x + width} V${y + height} H${x} Z`;
  return (
    <g>
      <path
        d={d}
        fill={fill}
        stroke={isDark ? "#0f172a" : "#ffffff"}
        strokeWidth={1.5}
      />
      {height >= 18 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={800}
          fill="#fff"
        >
          {label}
        </text>
      )}
    </g>
  );
};

/* Label angka di atas batang */
const valueLabel = (color, isDark) => (props) => {
  const { x, y, width, value } = props;
  if (!value || Number(value) <= 0) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 7}
      textAnchor="middle"
      fontSize={11}
      fontWeight={800}
      fill={color}
      stroke={isDark ? "#0f172a" : "#ffffff"}
      strokeWidth={3}
      paintOrder="stroke"
    >
      {fmtNum(value)}%
    </text>
  );
};

/* Titik garis: hanya muncul pada bulan yang punya data, lengkap dengan angka */
const makeDot = (k, isDark) => (p) => {
  const { cx, cy, payload, index } = p;
  const id = `dot-${k.key}-${index}`;
  if (cx == null || cy == null || !payload || sumPct(payload) <= 0)
    return <g key={id} />;
  return (
    <g key={id}>
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={isDark ? "#0f172a" : "#fff"}
        stroke={k.color}
        strokeWidth={3}
      />
      <text
        x={cx}
        y={cy - 13}
        textAnchor="middle"
        fontSize={11}
        fontWeight={800}
        fill={k.color}
        stroke={isDark ? "#0f172a" : "#fff"}
        strokeWidth={3}
        paintOrder="stroke"
      >
        {fmtNum(payload[k.pct])}%
      </text>
    </g>
  );
};

/* ───────────────────────── Komponen utama ───────────────────────── */

/* backgroundImage: otomatis memakai gambar bawaan (BG_KONDISI di bagian paling bawah file).
   Boleh diganti lewat prop jika ingin gambar lain. */
export default function GrafikKondisiBarang({
  data = [],
  backgroundImage = BG_KONDISI,
}) {
  const [activeKondisi, setActiveKondisi] = useState({
    Baru: true,
    Bekas: true,
    Rusak: true,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chartType, setChartType] = useState("line");

  const isDark = isDarkMode;
  const toggleKondisi = (key) =>
    setActiveKondisi((prev) => ({ ...prev, [key]: !prev[key] }));

  const chartData = data && data.length > 0 ? data : defaultData;
  const activeKeys = KEYS.filter((k) => activeKondisi[k.key]);
  const currentType =
    chartTypeOptions.find((c) => c.id === chartType) || chartTypeOptions[0];
  const HeaderIcon = currentType.icon;

  /* Bulan puncak: jumlah unit terbanyak (jika tidak ada unit, pakai jumlah persen) */
  const { activeData, noData, hasUnits, monthUnits } = useMemo(() => {
    const withUnits = chartData.some((r) => sumUnits(r) > 0);
    const score = (r) => (withUnits ? sumUnits(r) : sumPct(r));
    const peak = chartData.reduce(
      (best, r) => (score(r) > score(best) ? r : best),
      chartData[0],
    );
    return {
      activeData: peak,
      noData: score(peak) <= 0,
      hasUnits: withUnits,
      monthUnits: sumUnits(peak),
    };
  }, [chartData]);

  const dominant = useMemo(() => {
    const best = KEYS.reduce(
      (a, k) =>
        (Number(activeData[k.pct]) || 0) > (Number(activeData[a.pct]) || 0)
          ? k
          : a,
      KEYS[0],
    );
    return best;
  }, [activeData]);

  /* Warna tema untuk elemen chart */
  const axisText = isDark ? "#94a3b8" : "#475569";
  const axisLine = isDark ? "#475569" : "#cbd5e1";
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  /* Definisi gradasi (dipakai semua jenis grafik) */
  const defs = (
    <defs>
      <linearGradient id="kb_baru" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="kb_bekas" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fcd34d" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="kb_rusak" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="100%" stopColor="#be123c" />
      </linearGradient>
      <linearGradient id="kb_area_baru" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0090e7" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#0090e7" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="kb_area_bekas" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.32} />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="kb_area_rusak" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e11d48" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#e11d48" stopOpacity={0.02} />
      </linearGradient>
    </defs>
  );

  const commonProps = {
    data: chartData,
    margin: { top: 26, right: 20, left: 0, bottom: 5 },
  };

  const commonAxis = (
    <>
      {defs}
      <CartesianGrid
        strokeDasharray="4 4"
        vertical={false}
        stroke={gridColor}
      />
      <XAxis
        dataKey="name"
        interval={0}
        tickLine={false}
        axisLine={{ stroke: axisLine }}
        tick={{ fill: axisText, fontSize: 13, fontWeight: 600 }}
        padding={{ left: 12, right: 12 }}
        dy={8}
      />
      <YAxis
        domain={[0, 100]}
        ticks={[0, 25, 50, 75, 100]}
        tickFormatter={(v) => `${v}%`}
        width={48}
        tickLine={false}
        axisLine={false}
        tick={{ fill: axisText, fontSize: 12, fontWeight: 600 }}
      />
      {!noData && (
        <ReferenceLine
          x={activeData.name}
          stroke={isDark ? "#a78bfa" : "#8b5cf6"}
          strokeDasharray="5 5"
          strokeOpacity={0.55}
        />
      )}
      <Tooltip
        cursor={
          chartType === "line"
            ? {
                stroke: isDark ? "#64748b" : "#94a3b8",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }
            : {
                fill: isDark
                  ? "rgba(148,163,184,0.08)"
                  : "rgba(99,102,241,0.07)",
              }
        }
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const d = payload[0].payload;
          return (
            <div
              className={`border rounded-xl p-3 text-sm shadow-xl backdrop-blur-md min-w-[160px] ${
                isDark
                  ? "bg-slate-800/95 border-slate-700 text-slate-200"
                  : "bg-white/95 border-slate-100 text-slate-700"
              }`}
            >
              <div
                className={`font-bold border-b pb-2 mb-2 text-center ${isDark ? "border-slate-700 text-slate-100" : "border-slate-100 text-slate-800"}`}
              >
                {d.fullMonth}
              </div>
              {KEYS.filter((k) => activeKondisi[k.key]).map((k) => (
                <div
                  key={k.key}
                  className="flex items-center justify-between gap-4 font-bold my-1"
                  style={{ color: k.color }}
                >
                  <span>{k.key}</span>
                  <span>
                    {fmtNum(d[k.pct])}%
                    {d[k.key] !== undefined && (
                      <span className="ml-1.5 text-[11px] font-semibold opacity-70">
                        ({fmtNum(d[k.key], 0)} Unit)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          );
        }}
      />
    </>
  );

  const renderChart = () => {
    if (chartType === "line") {
      return (
        <ComposedChart {...commonProps}>
          {commonAxis}
          {activeKeys.map((k) => (
            <Area
              key={k.key}
              type="linear"
              dataKey={k.pct}
              stroke={k.color}
              strokeWidth={3}
              strokeLinejoin="round"
              fill={`url(#${k.area})`}
              dot={makeDot(k, isDark)}
              activeDot={{
                r: 7,
                fill: k.color,
                stroke: "#fff",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      );
    }

    if (chartType === "grouped-bar") {
      return (
        <BarChart {...commonProps} barGap={4} barCategoryGap="14%">
          {commonAxis}
          {activeKeys.map((k) => (
            <Bar
              key={k.key}
              dataKey={k.pct}
              barSize={16}
              fill={`url(#${k.grad})`}
              shape={<PillarBar />}
              background={{
                fill: isDark
                  ? "rgba(148,163,184,0.07)"
                  : "rgba(148,163,184,0.12)",
                radius: 8,
              }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey={k.pct}
                content={valueLabel(k.color, isDark)}
              />
            </Bar>
          ))}
        </BarChart>
      );
    }

    if (chartType === "stacked-bar") {
      return (
        <BarChart {...commonProps} barCategoryGap="22%">
          {commonAxis}
          {activeKeys.map((k) => (
            <Bar
              key={k.key}
              dataKey={k.pct}
              stackId="kondisi"
              barSize={34}
              fill={`url(#${k.grad})`}
              isAnimationActive={false}
              shape={(p) => {
                const row = p.payload || {};
                const topKey = [...activeKeys]
                  .reverse()
                  .find((a) => (Number(row[a.pct]) || 0) > 0)?.key;
                return (
                  <StackSegment
                    x={p.x}
                    y={p.y}
                    width={p.width}
                    height={p.height}
                    fill={p.fill}
                    isTop={topKey === k.key}
                    isDark={isDark}
                    label={`${fmtNum(row[k.pct])}%`}
                  />
                );
              }}
            />
          ))}
        </BarChart>
      );
    }

    return null;
  };

  /* Kartu persentase (Baru / Bekas / Rusak) */
  const conditionCards = [
    {
      id: "Baru",
      pct: "pctBaru",
      label: "% Baru (Segel)",
      note: "Barang masih tersegel",
    },
    {
      id: "Bekas",
      pct: "pctBekas",
      label: "% Bekas (Second)",
      note: "Barang pernah dipakai",
    },
    {
      id: "Rusak",
      pct: "pctRusak",
      label: "% Rusak",
      note: "Perlu perbaikan atau ganti",
    },
  ];

  return (
    <div
      className={`relative p-6 sm:p-8 rounded-[2.5rem] font-sans w-full max-w-6xl mx-auto overflow-hidden shadow-2xl transition-colors duration-500 border ${
        isDark
          ? "bg-slate-950 border-slate-800 shadow-blue-950/30"
          : "bg-[#f8f7e6] border-white shadow-blue-900/10"
      }`}
    >
      {/* Gambar latar */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Lapisan gelap untuk mode gelap */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 bg-slate-950/80 ${isDark ? "opacity-100" : "opacity-0"}`}
      />

      {/* ── Header ── */}
      <div
        className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-7 relative z-10 rounded-3xl border p-4 backdrop-blur-md transition-colors duration-300 ${
          isDark
            ? "bg-slate-900/70 border-slate-700/70"
            : "bg-white/70 border-white/80 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-14 h-14 rounded-[22px] bg-gradient-to-br from-[#38bdf8] via-[#0284c7] to-[#0369a1] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-4px_8px_rgba(0,0,0,0.3),0_10px_20px_rgba(2,132,199,0.35)] transition-transform duration-300 hover:scale-105">
            <HeaderIcon className="w-7 h-7 text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" />
          </div>
          <div>
            <h3
              className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${isDark ? "text-white" : "text-[#1e293b]"}`}
            >
              Grafik Tren Persentase Kondisi Barang Bulanan
            </h3>
            <p
              className={`text-sm font-semibold mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Tampilan {currentType.label.toLowerCase()}, persentase per bulan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {/* Filter legenda */}
          <div
            className={`flex items-center gap-4 px-5 py-2.5 rounded-full shadow-sm border backdrop-blur-md transition-colors duration-300 ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-white/75 border-white"}`}
          >
            {KEYS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleKondisi(item.key)}
                aria-pressed={activeKondisi[item.key]}
                className={`flex items-center gap-2 text-xs sm:text-sm transition-all cursor-pointer select-none font-bold ${
                  activeKondisi[item.key]
                    ? isDark
                      ? "text-slate-200"
                      : "text-slate-700"
                    : "text-slate-400 line-through opacity-50"
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full ${activeKondisi[item.key] ? item.dot : "bg-slate-300"}`}
                />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Pilihan jenis grafik */}
          <div
            className={`flex items-center p-1 rounded-full border shadow-sm backdrop-blur-md transition-colors duration-300 ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-white/80 border-white"}`}
          >
            {chartTypeOptions.map((option) => {
              const IconComponent = option.icon;
              const isActive = chartType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setChartType(option.id)}
                  title={`Tampilkan grafik ${option.label}`}
                  aria-pressed={isActive}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white shadow-md shadow-blue-500/30"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mode gelap */}
          <button
            type="button"
            onClick={() => setIsDarkMode((p) => !p)}
            title={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
            className={`p-2.5 rounded-full transition-all duration-300 shadow-md border cursor-pointer ${
              isDark
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Kotak grafik ── */}
      <div
        className={`relative z-10 rounded-3xl border shadow-sm p-4 sm:p-6 mb-6 backdrop-blur-sm transition-colors duration-300 ${
          isDark
            ? "bg-slate-900/90 border-slate-800"
            : "bg-white/90 border-white"
        }`}
      >
        <div
          className={`relative w-full h-[340px] rounded-2xl border ${isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-gradient-to-b from-slate-50/80 to-white"}`}
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"} 1px, transparent 0)`,
            backgroundSize: "22px 22px",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>

          {noData && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold border ${isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-500"}`}
              >
                Belum ada data kondisi barang
              </span>
            </div>
          )}
        </div>

        {/* Keterangan grafik + statistik singkat */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3">
          <p
            className={`text-xs font-medium max-w-2xl ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            {currentType.caption}
          </p>
          {!noData && (
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isDark ? "bg-violet-900/40 text-violet-300" : "bg-violet-100 text-violet-700"}`}
            >
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              Puncak: {activeData.fullMonth || activeData.name}
              {hasUnits && `, ${fmtNum(monthUnits, 0)} Unit`}
            </span>
          )}
        </div>
      </div>

      {/* ── 4 kartu ringkasan ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
        {conditionCards.map((c) => {
          const s = CARD_STYLES[c.id];
          const Icon = s.Icon;
          const pct = Number(activeData[c.pct]) || 0;
          return (
            <div
              key={c.id}
              className={`relative rounded-[2rem] pt-7 pb-9 px-5 border flex flex-col items-center text-center transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 overflow-hidden group ${isDark ? s.dark : s.light}`}
            >
              <div
                className={`absolute -right-10 -top-10 w-36 h-36 rounded-full border-[16px] pointer-events-none ${isDark ? s.ringDark : s.ringLight}`}
              />
              <Icon
                className={`absolute -left-7 -bottom-7 w-36 h-36 -rotate-12 pointer-events-none ${isDark ? s.ghostDark : s.ghostLight}`}
                strokeWidth={1.3}
              />

              <div className="relative z-10 flex flex-col items-center w-full">
                <div
                  className={`w-16 h-16 mb-4 rounded-[24px] bg-gradient-to-br ${s.badge} ${s.badgeShadow} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1`}
                >
                  <Icon className="w-8 h-8 text-white stroke-[2.2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />
                </div>

                <div
                  className={`text-4xl font-black tracking-tight ${s.value}`}
                >
                  {fmtNum(pct)}%
                </div>
                <div
                  className={`text-sm font-bold mt-1.5 ${isDark ? "text-slate-200" : "text-slate-700"}`}
                >
                  {c.label}
                </div>
                <div className="text-xs font-semibold mt-0.5 text-slate-400">
                  ({activeData.name})
                </div>

                {/* Bar progres */}
                <div
                  className={`w-full max-w-[150px] h-2 rounded-full mt-4 overflow-hidden ${isDark ? s.trackDark : s.trackLight}`}
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${s.bar}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                {hasUnits ? (
                  <span
                    className={`mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isDark ? s.chipDark : s.chipLight}`}
                  >
                    <Boxes className="w-3 h-3" />
                    {fmtNum(activeData[c.id], 0)} Unit
                  </span>
                ) : (
                  <span className="mt-3 text-[11px] font-medium text-slate-400">
                    {c.note}
                  </span>
                )}
              </div>

              <button
                type="button"
                aria-label={`Lihat detail ${c.id}`}
                className={`absolute bottom-0 right-0 w-11 h-11 bg-gradient-to-br ${s.corner} rounded-tl-2xl rounded-br-[2rem] flex items-center justify-center cursor-pointer shadow-[inset_0_2px_3px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 active:scale-95`}
              >
                <ChevronRight className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
              </button>
            </div>
          );
        })}

        {/* Kartu insight bulan puncak */}
        {(() => {
          const s = CARD_STYLES.Insight;
          const Icon = s.Icon;
          return (
            <div
              className={`relative rounded-[2rem] pt-7 pb-9 px-6 border flex flex-col items-center text-center transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 overflow-hidden group ${isDark ? s.dark : s.light}`}
            >
              <div
                className={`absolute -right-10 -top-10 w-36 h-36 rounded-full border-[16px] pointer-events-none ${isDark ? s.ringDark : s.ringLight}`}
              />
              <Icon
                className={`absolute -left-7 -bottom-7 w-36 h-36 -rotate-12 pointer-events-none ${isDark ? s.ghostDark : s.ghostLight}`}
                strokeWidth={1.3}
              />

              <div className="relative z-10 flex flex-col items-center w-full">
                <div
                  className={`w-16 h-16 mb-4 rounded-[24px] bg-gradient-to-br ${s.badge} ${s.badgeShadow} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1`}
                >
                  <Icon className="w-8 h-8 text-white stroke-[2.2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]" />
                </div>

                {noData ? (
                  <p
                    className={`text-sm font-bold leading-relaxed ${isDark ? "text-slate-200" : "text-slate-800"}`}
                  >
                    Belum ada data kondisi barang untuk ditampilkan.
                  </p>
                ) : (
                  <>
                    <div
                      className={`text-2xl font-black tracking-tight ${s.value}`}
                    >
                      {activeData.fullMonth || activeData.name}
                    </div>
                    <p
                      className={`text-sm font-bold leading-relaxed mt-1.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}
                    >
                      Lonjakan signifikan terjadi pada bulan{" "}
                      {activeData.fullMonth || activeData.name}.
                    </p>
                    <span
                      className={`mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${isDark ? s.chipDark : s.chipLight}`}
                    >
                      Dominan: {dominant.key} {fmtNum(activeData[dominant.pct])}
                      %
                    </span>
                    {hasUnits && (
                      <span className="mt-1.5 text-[11px] font-medium text-slate-400">
                        {fmtNum(monthUnits, 0)} Unit tercatat
                      </span>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                aria-label="Lihat detail insight bulan"
                className={`absolute bottom-0 right-0 w-11 h-11 bg-gradient-to-br ${s.corner} rounded-tl-2xl rounded-br-[2rem] flex items-center justify-center cursor-pointer shadow-[inset_0_2px_3px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 active:scale-95`}
              >
                <ChevronRight className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* ───────────────────────── Gambar latar (tertanam di kode) ───────────────────────── */
const BG_KONDISI =
  "data:image/jpeg;base64,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";
