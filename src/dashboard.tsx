import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Search, Percent, BarChart3, PieChart as PieIcon, LayoutList } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";

const raw = {
  project: "Proyek Precast - Cikarang",
  summary: [
    {
      material: "Batu Split",
      qty: 5000,
      buy_price: 230000,
      buy_total: 1150000000,
      sell_price: 270000,
      sell_total: 1350000000,
      unit_margin: 40000,
      total_margin: 200000000,
    },
    {
      material: "Pasir",
      qty: 5000,
      buy_price: 230000,
      buy_total: 1150000000,
      sell_price: 270000,
      sell_total: 1350000000,
      unit_margin: 40000,
      total_margin: 200000000,
    },
  ],
  totals: {
    total_buy: 2300000000,
    total_sell: 2700000000,
    total_margin: 400000000,
  },
};

// Hitung ulang persentase
const marginPctSales = (raw.totals.total_margin / raw.totals.total_sell) * 100; // Gross margin % vs penjualan
const profitPctCost = (raw.totals.total_margin / raw.totals.total_buy) * 100;  // Profit % vs biaya (ROI on cost)

function formatIDR(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

// Singkat angka untuk layar kecil (mis: 2.7T, 400M)
function shortIDR(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "") + "T";
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "M"; // Miliar
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "jt"; // Juta
  return n.toLocaleString("id-ID");
}

function Kpi({ label, value, subvalue, icon, positive = true }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${positive ? "bg-emerald-100" : "bg-rose-100"}`}>{icon}</div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm text-slate-500 truncate">{label}</div>
              <div className="text-lg sm:text-2xl font-semibold leading-tight">{value}</div>
              {subvalue && <div className="text-[11px] sm:text-xs text-slate-500">{subvalue}</div>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MaterialTable({ data }) {
  // Tabel desktop (md+)
  const TableView = (
    <div className="overflow-x-auto hidden md:block">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-4">Material</th>
            <th className="py-2 pr-4">Qty (m³)</th>
            <th className="py-2 pr-4">Harga Beli /m³</th>
            <th className="py-2 pr-4">Harga Jual /m³</th>
            <th className="py-2 pr-4">Total Beli</th>
            <th className="py-2 pr-4">Total Jual</th>
            <th className="py-2 pr-4">Margin /m³</th>
            <th className="py-2 pr-4">Total Margin</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.material} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{row.material}</td>
              <td className="py-2 pr-4">{row.qty.toLocaleString("id-ID")}</td>
              <td className="py-2 pr-4">{formatIDR(row.buy_price)}</td>
              <td className="py-2 pr-4">{formatIDR(row.sell_price)}</td>
              <td className="py-2 pr-4">{formatIDR(row.buy_total)}</td>
              <td className="py-2 pr-4">{formatIDR(row.sell_total)}</td>
              <td className="py-2 pr-4">{formatIDR(row.unit_margin)}</td>
              <td className="py-2 pr-4 font-semibold">{formatIDR(row.total_margin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Kartu mobile (sm-)
  const CardView = (
    <div className="space-y-3 md:hidden">
      {data.map((row) => (
        <Card key={row.material} className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{row.material}</div>
              <div className="text-xs text-slate-500">Qty {row.qty.toLocaleString("id-ID")} m³</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div>
                <div className="text-slate-500 text-xs">Harga Beli /m³</div>
                <div>{formatIDR(row.buy_price)}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Harga Jual /m³</div>
                <div>{formatIDR(row.sell_price)}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Total Beli</div>
                <div className="font-medium">{shortIDR(row.buy_total)}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Total Jual</div>
                <div className="font-medium">{shortIDR(row.sell_total)}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Margin /m³</div>
                <div>{formatIDR(row.unit_margin)}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Total Margin</div>
                <div className="font-semibold">{shortIDR(row.total_margin)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      {CardView}
      {TableView}
    </>
  );
}

function GrafikSection({ data }) {
  const chartData = data.map((r) => ({ material: r.material, Beli: r.buy_total, Jual: r.sell_total, Margin: r.total_margin }));
  const pieData = [
    { name: "Margin (Laba)", value: raw.totals.total_margin },
    { name: "Biaya (COGS)", value: raw.totals.total_sell - raw.totals.total_margin },
  ];

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="text-base font-semibold mb-3 sm:mb-4">Beli vs Jual per Material</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="material" />
                <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)} jt`} />
                <Tooltip formatter={(v) => formatIDR(v)} />
                <Legend />
                <Bar dataKey="Beli" />
                <Bar dataKey="Jual" />
              </RBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="text-base font-semibold">Komposisi Pendapatan</div>
            <div className="text-xs sm:text-sm text-slate-500">Profit: <span className="font-semibold">{profitPctCost.toFixed(2)}%</span></div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPrecastCikarang() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ringkasan"); // 'ringkasan' | 'material' | 'grafik'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? raw.summary.filter((x) => x.material.toLowerCase().includes(q)) : raw.summary;
  }, [query]);

  const kpiSub = {
    pembelian: formatIDR(raw.totals.total_buy),
    penjualan: formatIDR(raw.totals.total_sell),
    margin: formatIDR(raw.totals.total_margin),
  };

  // Sticky compact KPI header (mobile)
  const StickyHeader = (
    <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur supports-backdrop-blur:bg-white/60 border-b">
      <div className="px-4 py-2 grid grid-cols-2 gap-2">
        <Kpi label="Margin %" value={marginPctSales.toFixed(2) + "%"} icon={<Percent className="h-4 w-4" />} />
        <Kpi label="Profit %" value={profitPctCost.toFixed(2) + "%"} icon={<Percent className="h-4 w-4" />} />
      </div>
    </div>
  );

  // Bottom Tab Bar (mobile)
  const TabBar = (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur supports-backdrop-blur:bg-white/60 border-t">
      <div className="grid grid-cols-3 text-xs">
        <button onClick={() => setActiveTab("ringkasan")} className={`py-2 flex flex-col items-center ${activeTab === "ringkasan" ? "text-slate-900" : "text-slate-500"}`}>
          <Percent className="h-4 w-4" />
          Ringkasan
        </button>
        <button onClick={() => setActiveTab("material")} className={`py-2 flex flex-col items-center ${activeTab === "material" ? "text-slate-900" : "text-slate-500"}`}>
          <LayoutList className="h-4 w-4" />
          Material
        </button>
        <button onClick={() => setActiveTab("grafik")} className={`py-2 flex flex-col items-center ${activeTab === "grafik" ? "text-slate-900" : "text-slate-500"}`}>
          <BarChart3 className="h-4 w-4" />
          Grafik
        </button>
      </div>
    </div>
  );

  return (
    <div className="pb-16 md:pb-0">{/* extra bottom space for tab bar on mobile */}
      {StickyHeader}

      <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 max-w-screen-xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{raw.project}</h1>
          <p className="text-slate-600 text-sm sm:text-base">Ringkasan pembelian vs penjualan material, margin, dan profit/margin percentage berdasarkan perhitungan dari data.</p>
        </div>

        {/* RINGKASAN */}
        <section className={`${activeTab === "ringkasan" ? "block" : "hidden md:block"}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-5 sm:mb-8">
            <Kpi label="Total Pembelian" value={shortIDR(raw.totals.total_buy)} subvalue={kpiSub.pembelian} icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />} positive={false} />
            <Kpi label="Total Penjualan" value={shortIDR(raw.totals.total_sell)} subvalue={kpiSub.penjualan} icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />} positive />
            <Kpi label="Total Margin" value={shortIDR(raw.totals.total_margin)} subvalue={kpiSub.margin} icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />} positive />
            <Kpi label="Margin % (vs Penjualan)" value={marginPctSales.toFixed(2) + "%"} icon={<Percent className="h-4 w-4 sm:h-5 sm:w-5" />} positive />
            <Kpi label="Profit % (vs Biaya)" value={profitPctCost.toFixed(2) + "%"} icon={<Percent className="h-4 w-4 sm:h-5 sm:w-5" />} positive />
          </div>
        </section>

        {/* MATERIAL */}
        <section className={`${activeTab === "material" ? "block" : "hidden md:block"}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari material…" className="pl-9 h-10 text-sm" />
            </div>
          </div>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="text-base font-semibold mb-3 sm:mb-4">Detail per Material</div>
              <MaterialTable data={filtered} />
            </CardContent>
          </Card>
        </section>

        {/* GRAFIK */}
        <section className={`${activeTab === "grafik" ? "block" : "hidden md:block"}`}>
          <GrafikSection data={filtered} />
        </section>

        <div className="mt-4 text-[11px] sm:text-xs text-slate-500">
          Tips: Di mobile, gunakan tab bar di bawah untuk berpindah antar bagian. Angka besar diringkas (T/M/jt). Geser kartu/tabel bila butuh melihat kolom lain.
        </div>
      </div>

      {TabBar}
    </div>
  );
}
