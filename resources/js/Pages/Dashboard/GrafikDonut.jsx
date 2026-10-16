import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart as PieChartIcon,
  TrendingUp,
  ShoppingCart,
  RotateCcw,
  HandCoins,
  HardHat,
  Building2,
} from "lucide-react";

// ==========================================================
// KONFIGURASI JENIS TRANSAKSI
// (warna, ikon, dan kunci data dikumpulkan di satu tempat)
// ==========================================================

const TYPES = [
  {
    key: "pembelian",
    name: "Pembelian",
    keys: ["Pembelian", "PEMBELIAN"],
    fallback: 104,
    from: "#6ee7a8",
    to: "#00b84a",
    glow: "rgba(0,200,83,0.55)",
    icon: ShoppingCart,
  },
  {
    key: "pengembalian",
    name: "Pengembalian",
    keys: ["Pengembalian", "PENGEMBALIAN"],
    fallback: 33,
    from: "#ffe082",
    to: "#ff9f00",
    glow: "rgba(255,170,0,0.55)",
    icon: RotateCcw,
  },
  {
    key: "peminjaman",
    name: "Peminjaman",
    keys: ["Peminjaman", "PEMINJAMAN"],
    fallback: 12,
    from: "#7cc4ff",
    to: "#1e6fe0",
    glow: "rgba(30,136,229,0.55)",
    icon: HandCoins,
  },
  {
    key: "proyek",
    name: "Proyek",
    keys: ["Proyek", "PROYEK", "Barang ke Site", "BARANG_KE_SITE"],
    fallback: 28,
    from: "#ff9e80",
    to: "#e82e00",
    glow: "rgba(255,61,0,0.55)",
    icon: HardHat,
  },
  {
    key: "nonproyek",
    name: "Non Proyek",
    keys: [
      "Non Proyek",
      "NON_PROYEK",
      "Pemakaian Internal",
      "PEMAKAIAN_INTERNAL",
    ],
    fallback: 2,
    from: "#e1a8ee",
    to: "#9a2fb0",
    glow: "rgba(171,71,188,0.55)",
    icon: Building2,
  },
];

const pickValue = (src, keys, fallback) => {
  for (const k of keys) {
    if (src[k] !== undefined && src[k] !== null) return Number(src[k]) || 0;
  }
  return fallback;
};

// ==========================================================
// IKON GLOSSY (lencana rapi dengan kilap & bayangan berwarna)
// ==========================================================

function IconBadge({ Icon, from, to, glow, size = 40 }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[14px] text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)`,
        boxShadow: `0 8px 16px -6px ${glow}, inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -3px 5px rgba(0,0,0,0.16)`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1/2 rounded-t-[14px] bg-gradient-to-b from-white/40 to-transparent"
      />
      <Icon
        className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
        style={{ width: size * 0.46, height: size * 0.46 }}
        strokeWidth={2.4}
      />
    </span>
  );
}

// ==========================================================
// DONUT 3D (SVG buatan sendiri: tebal, bercahaya, ada bayangan)
// ==========================================================

const CX = 150;
const CY = 96;
const RX = 100;
const RY = 60;
const IRX = 58;
const IRY = 34;
const DEPTH = 16;

const fmt = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
const pt = (a, rx, ry) => [CX + rx * Math.cos(a), CY + ry * Math.sin(a)];

const ringArc = (a0, a1) => {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${fmt(pt(a0, RX, RY))} A${RX} ${RY} 0 ${large} 1 ${fmt(pt(a1, RX, RY))} L${fmt(pt(a1, IRX, IRY))} A${IRX} ${IRY} 0 ${large} 0 ${fmt(pt(a0, IRX, IRY))} Z`;
};

const ringPath = (a0, a1) =>
  a1 - a0 > Math.PI * 2 - 0.02
    ? ringArc(a0, a0 + Math.PI) + ringArc(a0 + Math.PI, a1)
    : ringArc(a0, a1);

const FULL_RING =
  `M${CX - RX} ${CY} a${RX} ${RY} 0 1 0 ${2 * RX} 0 a${RX} ${RY} 0 1 0 ${-2 * RX} 0 Z ` +
  `M${CX - IRX} ${CY} a${IRX} ${IRY} 0 1 0 ${2 * IRX} 0 a${IRX} ${IRY} 0 1 0 ${-2 * IRX} 0 Z`;

function Donut3D({ items, total, active, setActive, shownTotal }) {
  const empty = total === 0;
  const gap = 0.035;

  const segs = useMemo(() => {
    if (empty) {
      return [
        {
          key: "e1",
          a0: -Math.PI / 2,
          a1: Math.PI / 2,
          from: "#e2e8f0",
          to: "#cbd5e1",
          idx: -1,
        },
        {
          key: "e2",
          a0: Math.PI / 2,
          a1: Math.PI * 1.5,
          from: "#e2e8f0",
          to: "#cbd5e1",
          idx: -1,
        },
      ];
    }
    const live = items.filter((it) => it.value > 0);
    let start = -Math.PI / 2;
    return live.map((it) => {
      const span = (it.value / total) * Math.PI * 2;
      const g = live.length > 1 ? gap / 2 : 0;
      const seg = {
        key: it.key,
        a0: start + g,
        a1: start + span - g,
        from: it.from,
        to: it.to,
        idx: items.indexOf(it),
      };
      start += span;
      return seg;
    });
  }, [items, total, empty]);

  const activeItem = active !== null && active >= 0 ? items[active] : null;
  const layers = [];
  for (let k = DEPTH; k >= 2; k -= 2) layers.push(k);

  return (
    <svg
      viewBox="0 0 300 206"
      className="h-full w-full text-white dark:text-slate-400"
      role="img"
      aria-label={`Donut distribusi transaksi, total ${total} unit`}
    >
      <defs>
        <radialGradient id="gd-podium" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.05" />
        </radialGradient>
        <radialGradient
          id="gd-spec"
          gradientUnits="userSpaceOnUse"
          cx="105"
          cy="55"
          r="140"
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="gd-blur" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        {[...segs].map((s) => (
          <linearGradient
            key={s.key}
            id={`gd-g-${s.key}`}
            x1="0.15"
            y1="0"
            x2="0.85"
            y2="1"
          >
            <stop offset="0" stopColor={s.from} />
            <stop offset="1" stopColor={s.to} />
          </linearGradient>
        ))}
      </defs>

      {/* Panggung kaca + bayangan jatuh */}
      <ellipse
        cx={CX}
        cy={CY + DEPTH - 2}
        rx="132"
        ry="80"
        fill="url(#gd-podium)"
      />
      <ellipse
        cx={CX}
        cy={CY + DEPTH - 2}
        rx="132"
        ry="80"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.8"
        strokeWidth="1"
      />
      <ellipse
        cx={CX}
        cy={CY + DEPTH - 2}
        rx="117"
        ry="70"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeDasharray="2 5"
      />
      <ellipse
        cx={CX}
        cy={CY + DEPTH + 22}
        rx="104"
        ry="30"
        fill="#1e3a8a"
        opacity="0.28"
        filter="url(#gd-blur)"
      />

      {/* Lapis 1: dinding/ketebalan donut (semua segmen) */}
      <g style={{ filter: "brightness(0.58) saturate(1.1)" }}>
        {segs.map((s) => {
          const d = ringPath(s.a0, s.a1);
          const on = s.idx === active;
          return (
            <g
              key={s.key}
              style={{
                transform: `translateY(${on ? -6 : 0}px)`,
                opacity: active === null || on || s.idx === -1 ? 1 : 0.45,
                transition: "transform .25s ease, opacity .25s ease",
              }}
            >
              {layers.map((k) => (
                <path
                  key={k}
                  d={d}
                  transform={`translate(0 ${k})`}
                  fill={s.to}
                />
              ))}
            </g>
          );
        })}
      </g>

      {/* Lapis 2: permukaan atas (bisa di-hover) */}
      {segs.map((s) => {
        const on = s.idx === active;
        return (
          <g
            key={s.key}
            style={{
              transform: `translateY(${on ? -6 : 0}px)`,
              opacity: active === null || on || s.idx === -1 ? 1 : 0.45,
              transition: "transform .25s ease, opacity .25s ease",
              cursor: s.idx === -1 ? "default" : "pointer",
            }}
            onMouseEnter={() => s.idx !== -1 && setActive(s.idx)}
            onMouseLeave={() => setActive(null)}
          >
            <path
              d={ringPath(s.a0, s.a1)}
              fill={`url(#gd-g-${s.key})`}
              stroke="#ffffff"
              strokeOpacity="0.55"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </g>
        );
      })}

      {/* Kilau cahaya di permukaan */}
      <path
        d={FULL_RING}
        fill="url(#gd-spec)"
        fillRule="evenodd"
        pointerEvents="none"
      />
      <ellipse
        cx={CX}
        cy={CY}
        rx={RX - 1}
        ry={RY - 1}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
        pointerEvents="none"
      />

      {/* Teks tengah */}
      <g pointerEvents="none" textAnchor="middle">
        <text
          x={CX}
          y={CY + 6}
          fontSize="26"
          fontWeight="900"
          className="fill-slate-800 dark:fill-white"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {(activeItem ? activeItem.value : shownTotal).toLocaleString("id-ID")}
        </text>
        <text
          x={CX}
          y={CY + 21}
          fontSize="8"
          fontWeight="800"
          letterSpacing="1.2"
          className="fill-slate-500 dark:fill-slate-400"
        >
          {activeItem ? activeItem.name.toUpperCase() : "TOTAL UNIT"}
        </text>
      </g>
    </svg>
  );
}

// ==========================================================
// LATAR KARTU
// ==========================================================

// ----------------------------------------------------------
// WALLPAPER KARTU: mesh aurora + pita sutra (satin ribbons)
// + bola kaca. Ada versi terang & gelap.
// ----------------------------------------------------------

const NOISE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>',
)}")`;

const SILK_FAMILIES = [
  {
    d: "M-60 650 C60 520 170 610 250 440 S385 210 470 110",
    n: 16,
    gap: 6.5,
    w: 1.5,
  },
  {
    d: "M-60 770 C100 690 210 760 310 600 S430 400 480 340",
    n: 14,
    gap: 7.5,
    w: 1.3,
  },
  {
    d: "M-60 470 C50 390 160 430 240 300 S380 90 470 -10",
    n: 12,
    gap: 7,
    w: 1.2,
  },
];

function Silk({ id, palette, glowOpacity, lineBoost, className }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${className}`}
      viewBox="0 0 400 760"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        {SILK_FAMILIES.map((_, i) => (
          <linearGradient
            key={i}
            id={`${id}-g${i}`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="760"
            x2="400"
            y2="0"
          >
            <stop offset="0" stopColor={palette[i][0]} />
            <stop offset="1" stopColor={palette[i][1]} />
          </linearGradient>
        ))}
        <radialGradient id={`${id}-orb`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.45" stopColor={palette[1][0]} stopOpacity="0.35" />
          <stop offset="1" stopColor={palette[0][1]} stopOpacity="0.1" />
        </radialGradient>
      </defs>

      {SILK_FAMILIES.map((f, i) => (
        <g key={i}>
          {/* Cahaya lembut di bawah pita */}
          <path
            d={f.d}
            stroke={`url(#${id}-g${i})`}
            strokeWidth="70"
            strokeLinecap="round"
            opacity={glowOpacity}
            filter={`url(#${id}-glow)`}
          />
          {/* Garis-garis satin sejajar */}
          <g filter={`url(#${id}-soft)`}>
            {Array.from({ length: f.n }, (_, k) => (
              <path
                key={k}
                d={f.d}
                transform={`translate(0 ${k * f.gap})`}
                stroke={`url(#${id}-g${i})`}
                strokeWidth={f.w}
                strokeLinecap="round"
                strokeOpacity={Math.max(
                  0.06,
                  (0.8 - (k * 0.75) / f.n) * lineBoost,
                )}
              />
            ))}
          </g>
        </g>
      ))}

      {/* Bola kaca */}
      <g>
        <circle
          cx="345"
          cy="96"
          r="44"
          fill={`url(#${id}-orb)`}
          stroke="#ffffff"
          strokeOpacity="0.6"
        />
        <ellipse
          cx="333"
          cy="80"
          rx="18"
          ry="9"
          fill="#ffffff"
          opacity="0.55"
          transform="rotate(-25 333 80)"
        />
        <circle
          cx="46"
          cy="690"
          r="30"
          fill={`url(#${id}-orb)`}
          stroke="#ffffff"
          strokeOpacity="0.55"
        />
        <ellipse
          cx="38"
          cy="680"
          rx="11"
          ry="5.5"
          fill="#ffffff"
          opacity="0.5"
          transform="rotate(-25 38 680)"
        />
        <circle
          cx="378"
          cy="470"
          r="14"
          fill={`url(#${id}-orb)`}
          stroke="#ffffff"
          strokeOpacity="0.5"
        />
      </g>
    </svg>
  );
}

function CardBackground() {
  return (
    <>
      {/* Mesh aurora - terang */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 dark:hidden"
        style={{
          backgroundColor: "#eaf1ff",
          backgroundImage: [
            "radial-gradient(60% 40% at 8% 4%, rgba(255,255,255,0.95) 0%, transparent 70%)",
            "radial-gradient(55% 38% at 100% 10%, rgba(196,181,253,0.75) 0%, transparent 70%)",
            "radial-gradient(60% 40% at 92% 52%, rgba(125,211,252,0.65) 0%, transparent 70%)",
            "radial-gradient(65% 45% at 0% 70%, rgba(165,180,252,0.7) 0%, transparent 70%)",
            "radial-gradient(60% 40% at 70% 100%, rgba(249,168,212,0.5) 0%, transparent 70%)",
          ].join(","),
        }}
      />
      {/* Mesh aurora - gelap */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden dark:block"
        style={{
          backgroundColor: "#070b1f",
          backgroundImage: [
            "radial-gradient(60% 40% at 8% 4%, rgba(59,130,246,0.35) 0%, transparent 70%)",
            "radial-gradient(55% 38% at 100% 10%, rgba(124,58,237,0.4) 0%, transparent 70%)",
            "radial-gradient(60% 40% at 92% 52%, rgba(14,165,233,0.28) 0%, transparent 70%)",
            "radial-gradient(65% 45% at 0% 70%, rgba(79,70,229,0.35) 0%, transparent 70%)",
            "radial-gradient(60% 40% at 70% 100%, rgba(219,39,119,0.25) 0%, transparent 70%)",
          ].join(","),
        }}
      />

      {/* Pita sutra */}
      <Silk
        id="gd-l"
        className="dark:hidden"
        glowOpacity={0.3}
        lineBoost={0.9}
        palette={[
          ["#4f86ff", "#9b7dff"],
          ["#38bdf8", "#6366f1"],
          ["#a78bfa", "#f0abfc"],
        ]}
      />
      <Silk
        id="gd-d"
        className="hidden dark:block"
        glowOpacity={0.35}
        lineBoost={1.2}
        palette={[
          ["#3b82f6", "#8b5cf6"],
          ["#22d3ee", "#6366f1"],
          ["#c084fc", "#f472b6"],
        ]}
      />

      {/* Tekstur & kilau tepi */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-multiply dark:opacity-[0.08] dark:mix-blend-overlay"
        style={{ backgroundImage: NOISE }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-30px_50px_-40px_rgba(30,64,175,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      />
    </>
  );
}

// ==========================================================
// ANGKA TOTAL NAIK PELAN (mati otomatis jika reduce-motion)
// ==========================================================

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !target) {
      setValue(target);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ==========================================================
// KOMPONEN UTAMA
// ==========================================================

/**
 * Props:
 *  - donutPenerimaan: objek { Pembelian, Pengembalian, Peminjaman, Proyek, 'Non Proyek' }
 *  - footerLabel:     teks tombol bawah
 *  - onFooterClick:   (opsional) handler klik tombol bawah
 *  - className:       (opsional) kelas tambahan untuk kartu, mis. "lg:col-span-1"
 */
export default function GrafikDonutDistribusi({
  donutPenerimaan = {},
  footerLabel = "Data Transaksi Akan Ditampilkan Di Sini",
  onFooterClick,
  className = "lg:col-span-1",
}) {
  const [active, setActive] = useState(null);

  const { items, total } = useMemo(() => {
    const raw = TYPES.map((t) => ({
      ...t,
      value: pickValue(donutPenerimaan, t.keys, t.fallback),
    }));
    const sum = raw.reduce((acc, it) => acc + it.value, 0);
    return {
      total: sum,
      items: raw.map((it) => ({
        ...it,
        pct: sum > 0 ? ((it.value / sum) * 100).toFixed(1) : "0.0",
      })),
    };
  }, [donutPenerimaan]);

  const shownTotal = useCountUp(total);

  return (
    <section
      className={`relative isolate flex flex-col overflow-hidden rounded-[32px] border border-blue-100/80 bg-gradient-to-br from-[#f7faff] via-[#e9f0ff] to-[#d9e5ff] p-5
                text-center shadow-[0_30px_60px_-34px_rgba(37,99,235,0.55)] ring-1 ring-white/80
                dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-[#0b1230] dark:ring-white/5 ${className}`}
    >
      <style>{`
                @keyframes gd-in { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: none; } }
                .gd-in { animation: gd-in .7s cubic-bezier(.2,.8,.2,1) both; }
                @media (prefers-reduced-motion: reduce) { .gd-in { animation: none; } }
            `}</style>

      <CardBackground />

      {/* Header */}
      <header className="relative flex items-center gap-3 text-left">
        <IconBadge
          Icon={PieChartIcon}
          from="#7aa2ff"
          to="#2f5bf0"
          glow="rgba(47,91,240,0.55)"
          size={44}
        />
        <div className="min-w-0">
          <h3 className="text-base font-extrabold leading-tight tracking-tight text-slate-800 dark:text-slate-100">
            Distribusi Mutasi Transaksi
          </h3>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Ringkasan per jenis transaksi
          </p>
        </div>
      </header>

      {/* Donut */}
      <div
        className="gd-in relative mx-auto mt-2 h-[210px] w-full max-w-[320px]"
        onMouseLeave={() => setActive(null)}
      >
        <Donut3D
          items={items}
          total={total}
          active={active}
          setActive={setActive}
          shownTotal={shownTotal}
        />
      </div>

      {/* Daftar transaksi */}
      <ul className="relative mt-1 flex flex-col gap-2.5">
        {items.map((item, i) => {
          const on = active === i;
          const barW = item.value > 0 ? Math.max(Number(item.pct), 2) : 0;
          return (
            <li
              key={item.key}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={`flex items-center gap-3 rounded-2xl border border-white/90 bg-white/80 px-3 py-2.5 backdrop-blur-md transition-all duration-200
                                dark:border-slate-800 dark:bg-slate-900/70 ${on ? "-translate-y-0.5" : ""} ${item.value === 0 ? "opacity-70" : ""}`}
              style={{
                boxShadow: on
                  ? `0 0 0 1.5px ${item.to}88, 0 14px 26px -14px ${item.glow}`
                  : "0 8px 18px -14px rgba(30,64,175,0.45)",
              }}
            >
              <IconBadge
                Icon={item.icon}
                from={item.from}
                to={item.to}
                glow={item.glow}
              />

              <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left">
                <span className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
                  {item.name}
                </span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.12)] dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barW}%`,
                      background: `linear-gradient(90deg, ${item.to}, ${item.from})`,
                      boxShadow: `0 0 8px ${item.glow}`,
                    }}
                  />
                </div>
              </div>

              <div className="ml-1 flex shrink-0 flex-col items-end leading-none">
                <span className="text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {item.value.toLocaleString("id-ID")}
                </span>
                <span className="mt-1 text-[11px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                  {item.pct}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Tombol bawah */}
      <button
        type="button"
        onClick={onFooterClick}
        className="group relative mt-4 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#5b80ff] via-[#3b60f6] to-[#2b52f5] px-4 py-3
                    text-xs font-bold tracking-wide text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/25 transition-all duration-200
                    hover:scale-[1.01] hover:shadow-blue-600/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent"
        />
        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <TrendingUp
            className="h-3.5 w-3.5 text-[#3b60f6]"
            strokeWidth={2.6}
          />
        </span>
        <span className="relative">{footerLabel}</span>
      </button>
    </section>
  );
}
