import React, { useState, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Send,
} from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Komponen SVG Truk Kustom
const CustomTruckIcon = ({ className = "w-8 h-8" }) => (
  <svg
    viewBox="0 0 100 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Boks Kargo Belakang */}
    <path d="M36 6 L92 12 V52 L36 56 Z" fill="#9E9E9E" />
    <path d="M36 6 L90 2 L92 12 L36 6 Z" fill="#BDBDBD" />
    <path d="M92 12 L98 14 V50 L92 52 Z" fill="#757575" />

    {/* Kabin Depan */}
    <path
      d="M6 56 L6 30 C7 20 16 14 26 13 L36 12 V58 L12 58 C8 58 6 57 6 56 Z"
      fill="#FFFFFF"
    />

    {/* Kaca Depan & Samping */}
    <path d="M9 36 C10 24 16 18 25 17 L34 16 V38 L9 38 Z" fill="#37474F" />
    <path
      d="M10 39 H34 V50 C34 50 28 52 20 52 C12 52 10 48 10 39 Z"
      fill="#ECEFF1"
      opacity="0.3"
    />

    {/* Gril & Bumper Depan */}
    <path
      d="M5 54 H37 V60 C37 61 35 62 33 62 H8 C6 62 5 61 5 60 V54 Z"
      fill="#E0E0E0"
      stroke="#BDBDBD"
      strokeWidth="0.8"
    />
    <rect x="14" y="55" width="14" height="4" rx="1" fill="#212121" />

    {/* Lampu Depan */}
    <circle cx="9" cy="56" r="2.5" fill="#FFF9C4" />
    <circle cx="33" cy="56" r="2" fill="#FFFFFF" />

    {/* Spion Samping Kiri */}
    <path d="M3 26 H8 V36 H3 Z" fill="#212121" />
    <path d="M6 26 L10 21" stroke="#212121" strokeWidth="1.5" />

    {/* Sasis Bawah */}
    <rect x="36" y="55" width="55" height="6" fill="#212121" />

    {/* Roda Depan & Belakang */}
    <circle cx="18" cy="65" r="7.5" fill="#212121" />
    <circle cx="18" cy="65" r="4" fill="#BDBDBD" />

    <circle cx="62" cy="65" r="7.5" fill="#212121" />
    <circle cx="62" cy="65" r="4" fill="#BDBDBD" />

    <circle cx="78" cy="65" r="7.5" fill="#212121" />
    <circle cx="78" cy="65" r="4" fill="#BDBDBD" />
  </svg>
);

export default function GrafikBatangLogistik({ data = [] }) {
  const [activeStatus, setActiveStatus] = useState({
    MASUK: true,
    KELUAR: true,
    TRANSFER: true,
  });

  const toggleStatus = (key) => {
    setActiveStatus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const legends = [
    {
      key: "MASUK",
      label: "Masuk",
      color: "bg-[#10b981]",
      fill: "url(#MASUK_grad)",
    },
    {
      key: "KELUAR",
      label: "Keluar",
      color: "bg-[#ff416c]",
      fill: "url(#KELUAR_grad)",
    },
    {
      key: "TRANSFER",
      label: "Transfer",
      color: "bg-[#0072ff]",
      fill: "url(#TRANSFER_grad)",
    },
  ];

  const defaultData = [
    { name: "Jan", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
    { name: "Feb", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
    { name: "Mar", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
    { name: "Apr", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
    { name: "Mei", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
    { name: "Jun", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
    { name: "Jul", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
    { name: "Agu", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
    { name: "Sep", MASUK: 215.0, KELUAR: 34.0, TRANSFER: 14.0 },
    { name: "Okt", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
    { name: "Nov", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
    { name: "Des", MASUK: 0.1, KELUAR: 0, TRANSFER: 0 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, curr) => {
        acc.MASUK += Number(curr.MASUK || 0);
        acc.KELUAR += Number(curr.KELUAR || 0);
        acc.TRANSFER += Number(curr.TRANSFER || 0);
        return acc;
      },
      { MASUK: 0, KELUAR: 0, TRANSFER: 0 },
    );
  }, [chartData]);

  const CapsuleBar = (props) => {
    const { x, y, width, height, fill } = props;
    if (!height || height <= 0) return null;
    const radius = Math.min(width / 2, height / 2);
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        ry={radius}
        fill={fill}
      />
    );
  };

  return (
    <div className="lg:col-span-2 relative overflow-hidden bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-sans select-none transition-colors duration-300">
      {/* Ambient Background Light */}
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Judul Kiri & Legenda Kanan */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3b82f6] via-[#6366f1] to-[#a855f7] flex items-center justify-center shadow-md border border-white dark:border-slate-700 p-1.5">
            <CustomTruckIcon className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-wide">
              Tren Aktivitas Logistik Bulanan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Jumlah aktivitas per jenis transaksi!
            </p>
          </div>
        </div>

        {/* Legend Toggle Capsule */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-700 shadow-inner">
          {legends.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleStatus(item.key)}
              className={`flex items-center gap-2 text-xs transition-all cursor-pointer ${
                activeStatus[item.key]
                  ? "text-slate-800 dark:text-slate-200 font-semibold opacity-100"
                  : "text-slate-400 dark:text-slate-500 opacity-40 line-through"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${activeStatus[item.key] ? item.color : "bg-slate-300 dark:bg-slate-600"}`}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Area Grafik Utama */}
      <div className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 dark:from-emerald-500/10 to-transparent p-2 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            barGap={4}
            barSize={20}
            margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="MASUK_grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="KELUAR_grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff416c" />
                <stop offset="100%" stopColor="#ff4b2b" />
              </linearGradient>
              <linearGradient id="TRANSFER_grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0072ff" />
                <stop offset="100%" stopColor="#00c6ff" />
              </linearGradient>
            </defs>

            {/* Grid kotak-kotak (vertikal & horizontal) sesuai contoh gambar */}
            <CartesianGrid
              vertical={true}
              horizontal={true}
              stroke="currentColor"
              className="stroke-slate-200/70 dark:stroke-slate-800/80"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="name"
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "currentColor", fontSize: 12, fontWeight: 600 }}
              className="text-slate-500 dark:text-slate-400"
              dy={5}
            />

            <YAxis
              domain={[0, "auto"]}
              tickLine={false}
              axisLine={false}
              width={40}
              tick={{ fill: "currentColor", fontSize: 12, fontWeight: 600 }}
              className="text-slate-500 dark:text-slate-400"
            />

            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 text-xs shadow-xl backdrop-blur-md">
                    <div className="font-bold border-b border-slate-100 dark:border-slate-700 pb-1 mb-2 text-slate-700 dark:text-slate-200">
                      Bulan {d.name}
                    </div>
                    {activeStatus.MASUK && (
                      <div className="text-[#10b981] dark:text-[#34d399] font-semibold">
                        Masuk: {d.MASUK || 0}
                      </div>
                    )}
                    {activeStatus.KELUAR && (
                      <div className="text-[#ff416c] dark:text-[#f87171] font-semibold">
                        Keluar: {d.KELUAR || 0}
                      </div>
                    )}
                    {activeStatus.TRANSFER && (
                      <div className="text-[#0072ff] dark:text-[#60a5fa] font-semibold">
                        Transfer: {d.TRANSFER || 0}
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Bar Charts */}
            {activeStatus.MASUK && (
              <Bar
                dataKey="MASUK"
                name="Masuk"
                fill="url(#MASUK_grad)"
                shape={<CapsuleBar />}
              />
            )}
            {activeStatus.KELUAR && (
              <Bar
                dataKey="KELUAR"
                name="Keluar"
                fill="url(#KELUAR_grad)"
                shape={<CapsuleBar />}
              />
            )}
            {activeStatus.TRANSFER && (
              <Bar
                dataKey="TRANSFER"
                name="Transfer"
                fill="url(#TRANSFER_grad)"
                shape={<CapsuleBar />}
              />
            )}

            {/* Garis Real-Time yang Mengikuti Data Dinamis */}
            {activeStatus.MASUK && (
              <Line
                type="monotone"
                dataKey="MASUK"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "#10b981",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#10b981",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            )}
            {activeStatus.KELUAR && (
              <Line
                type="monotone"
                dataKey="KELUAR"
                stroke="#ff416c"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{
                  r: 4,
                  fill: "#ff416c",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#ff416c",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            )}
            {activeStatus.TRANSFER && (
              <Line
                type="monotone"
                dataKey="TRANSFER"
                stroke="#0072ff"
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "#0072ff",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#0072ff",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 3 CARD RINGKASAN PERSIS SEPERTI GAMBAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 relative z-10">
        {/* CARD 1: TOTAL MASUK */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/60 via-white to-emerald-100/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
          {/* Background Soft Organic Blob Kanan */}
          <svg
            className="absolute -right-6 -bottom-8 w-44 h-44 text-emerald-200/50 dark:text-emerald-800/20 pointer-events-none"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path
              d="M44.7,-56.4C56.6,-45.8,64.3,-30.7,67.1,-14.8C69.9,1.1,67.8,17.8,60.2,31.7C52.6,45.6,39.5,56.7,24.4,62.8C9.3,68.9,-7.8,70,-23.7,65.1C-39.6,60.2,-54.3,49.3,-62.7,34.8C-71.1,20.3,-73.2,2.2,-68.8,-13.7C-64.4,-29.6,-53.5,-43.3,-40.4,-53.7C-27.3,-64.1,-12,-71.2,2.3,-74.1C16.6,-77,32.8,-67,44.7,-56.4Z"
              transform="translate(100 100)"
            />
          </svg>

          {/* Ilustrasi 3D Kanan (Wallet / Cards) */}
          <div className="absolute right-3 bottom-4 pointer-events-none flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg transform rotate-[-12deg] flex items-center justify-center border border-emerald-300/40">
                <div className="w-8 h-2 bg-emerald-200/50 rounded-full mb-3" />
              </div>
              <div className="absolute -bottom-2 -left-3 w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-300 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Konten Kiri */}
          <div className="relative z-10">
            {/* Top Icon Box */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/30 text-white mb-3">
              <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
            </div>

            {/* Judul & Angka */}
            <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              TOTAL MASUK
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                {totals.MASUK || 41}
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-400">
                Unit
              </span>
            </div>

            {/* Sub-informasi Periode */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-0.5">
                ▲ +12%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                dari periode sebelumnya
              </span>
            </div>

            {/* Mini Bar Chart & Label */}
            <div className="mt-4">
              <div className="flex items-end gap-1 h-7">
                <div className="w-2 h-2.5 bg-emerald-200/70 dark:bg-emerald-800/50 rounded-sm" />
                <div className="w-2 h-3.5 bg-emerald-300 dark:bg-emerald-700/60 rounded-sm" />
                <div className="w-2 h-4.5 bg-emerald-400 dark:bg-emerald-600/70 rounded-sm" />
                <div className="w-2 h-5.5 bg-emerald-400 dark:bg-emerald-500/80 rounded-sm" />
                <div className="w-2 h-7 bg-emerald-600 dark:bg-emerald-400 rounded-sm" />
              </div>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 mt-2">
                Transaksi Masuk Hari Ini
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2: TOTAL KELUAR */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/60 via-white to-rose-100/50 dark:from-rose-950/30 dark:via-slate-900 dark:to-rose-900/20 border border-rose-100 dark:border-rose-800/40 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
          {/* Background Soft Organic Blob Kanan */}
          <svg
            className="absolute -right-6 -bottom-8 w-44 h-44 text-rose-200/50 dark:text-rose-800/20 pointer-events-none"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path
              d="M41.5,-52.1C53.8,-42.6,63.9,-29.4,66.8,-14.7C69.7,0.1,65.4,16.4,56.8,29.8C48.2,43.2,35.3,53.7,20.4,59.3C5.5,64.9,-11.4,65.6,-26.8,60.3C-42.2,55,-56.1,43.7,-63.3,28.8C-70.5,13.9,-71,-4.6,-64.8,-20.1C-58.6,-35.6,-45.7,-48.1,-31.6,-57.1C-17.5,-66,-2.2,-71.4,12.1,-68.8C26.4,-66.2,29.2,-61.6,41.5,-52.1Z"
              transform="translate(100 100)"
            />
          </svg>

          {/* Ilustrasi 3D Kanan */}
          <div className="absolute right-3 bottom-4 pointer-events-none flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl shadow-lg transform rotate-[12deg] flex items-center justify-center border border-rose-300/40">
                <div className="w-8 h-2 bg-rose-200/50 rounded-full mb-3" />
              </div>
              <div className="absolute -bottom-2 -left-3 w-10 h-10 bg-rose-100 dark:bg-rose-800 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800">
                <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-300 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Konten Kiri */}
          <div className="relative z-10">
            {/* Top Icon Box */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center shadow-md shadow-rose-500/30 text-white mb-3">
              <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
            </div>

            {/* Judul & Angka */}
            <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              TOTAL KELUAR
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                {totals.KELUAR || 14}
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-400">
                Unit
              </span>
            </div>

            {/* Sub-informasi Periode */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-rose-600 dark:text-rose-400 text-xs font-black flex items-center gap-0.5">
                ▲ +8%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                dari periode sebelumnya
              </span>
            </div>

            {/* Mini Bar Chart & Label */}
            <div className="mt-4">
              <div className="flex items-end gap-1 h-7">
                <div className="w-2 h-2.5 bg-rose-200/70 dark:bg-rose-800/50 rounded-sm" />
                <div className="w-2 h-3.5 bg-rose-300 dark:bg-rose-700/60 rounded-sm" />
                <div className="w-2 h-4.5 bg-rose-400 dark:bg-rose-600/70 rounded-sm" />
                <div className="w-2 h-5.5 bg-rose-400 dark:bg-rose-500/80 rounded-sm" />
                <div className="w-2 h-7 bg-rose-500 dark:bg-rose-400 rounded-sm" />
              </div>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 mt-2">
                Transaksi Keluar Hari Ini
              </p>
            </div>
          </div>
        </div>

        {/* CARD 3: TOTAL TRANSFER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-blue-100/50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
          {/* Background Soft Organic Blob Kanan */}
          <svg
            className="absolute -right-6 -bottom-8 w-44 h-44 text-blue-200/50 dark:text-blue-800/20 pointer-events-none"
            viewBox="0 0 200 200"
            fill="currentColor"
          >
            <path
              d="M43.2,-55.1C55.4,-45.7,64.3,-31.4,66.3,-16.1C68.3,-0.8,63.4,15.5,54.8,28.9C46.2,42.3,33.9,52.8,19.3,58.4C4.7,64,-12.2,64.7,-27.1,59.3C-42,53.9,-54.9,42.4,-61.7,27.9C-68.5,13.4,-69.2,-4.1,-63.5,-19.1C-57.8,-34.1,-45.7,-46.6,-32.1,-55.6C-18.5,-64.6,-3.4,-70.1,11,-71.4C25.4,-72.7,31,-64.5,43.2,-55.1Z"
              transform="translate(100 100)"
            />
          </svg>

          {/* Ilustrasi 3D Paper Airplane Kanan */}
          <div className="absolute right-4 bottom-8 pointer-events-none flex items-center justify-center">
            <Send className="w-12 h-12 text-blue-500 fill-blue-500 transform -rotate-12 drop-shadow-md" />
          </div>

          {/* Konten Kiri */}
          <div className="relative z-10">
            {/* Top Icon Box */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-200 to-blue-400 dark:from-blue-800 dark:to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-blue-700 dark:text-blue-100 mb-3">
              <ArrowLeftRight className="w-6 h-6 stroke-[2.5]" />
            </div>

            {/* Judul & Angka */}
            <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              TOTAL TRANSFER
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                {totals.TRANSFER || 0}
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-400">
                Unit
              </span>
            </div>

            {/* Sub-informasi Periode */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              <span className="text-slate-600 dark:text-slate-300 text-xs font-black">
                0%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                dari periode sebelumnya
              </span>
            </div>

            {/* Mini Sparkline Curve Chart dengan Tooltip Badge '0' */}
            <div className="mt-4">
              <div className="relative h-7 w-40">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 160 28"
                  fill="none"
                >
                  <path
                    d="M 5 22 Q 25 12, 40 18 T 75 8 T 110 18 T 145 12"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  {/* Dots pada kurva */}
                  <circle
                    cx="5"
                    cy="22"
                    r="2.5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <circle
                    cx="30"
                    cy="15"
                    r="2.5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <circle
                    cx="50"
                    cy="16"
                    r="2.5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <circle
                    cx="75"
                    cy="8"
                    r="2.5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <circle
                    cx="100"
                    cy="14"
                    r="2.5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <circle
                    cx="120"
                    cy="20"
                    r="2.5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <circle
                    cx="145"
                    cy="12"
                    r="3"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                  />
                </svg>

                {/* Tooltip Badge '0' di titik terakhir */}
                <div className="absolute -top-3.5 right-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-blue-600">
                  0
                </div>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 mt-2">
                Transaksi Transfer Hari Ini
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
