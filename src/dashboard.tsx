import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Search, Percent, BarChart3, LayoutList, Moon, Sun } from "lucide-react";
import { useDarkMode } from "./hooks/useDarkMode";
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

// Type definitions
interface MaterialData {
  material: string;
  qty: number;
  buy_price: number;
  buy_total: number;
  sell_price: number;
  sell_total: number;
  unit_margin: number;
  total_margin: number;
}

interface ProjectData {
  project: string;
  summary: MaterialData[];
  totals: {
    total_buy: number;
    total_sell: number;
    total_margin: number;
  };
}

interface KpiProps {
  label: string;
  value: string;
  subvalue?: string;
  icon: React.ReactNode;
  positive?: boolean;
}

interface MaterialTableProps {
  data: MaterialData[];
}

interface GrafikSectionProps {
  data: MaterialData[];
}

type TabType = "ringkasan" | "material" | "grafik";

const raw: ProjectData = {
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

// Loading skeleton components
function SkeletonKpi() {
  return (
    <div className="gradient-card rounded-2xl shadow-soft border-0 animate-pulse">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-slate-200 w-12 h-12"></div>
          <div className="min-w-0 flex-1">
            <div className="h-3 bg-slate-200 rounded w-24 mb-2"></div>
            <div className="h-6 bg-slate-300 rounded w-16 mb-1"></div>
            <div className="h-2 bg-slate-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="gradient-card rounded-2xl shadow-soft border-0 animate-pulse">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-slate-200 rounded w-32"></div>
          <div className="h-6 bg-slate-200 rounded-full w-16"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-100 p-3 rounded-xl">
              <div className="h-3 bg-slate-200 rounded w-20 mb-2"></div>
              <div className="h-4 bg-slate-300 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hitung ulang persentase
const marginPctSales = (raw.totals.total_margin / raw.totals.total_sell) * 100; // Gross margin % vs penjualan
const profitPctCost = (raw.totals.total_margin / raw.totals.total_buy) * 100;  // Profit % vs biaya (ROI on cost)

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

// Singkat angka untuk layar kecil (mis: 2.7T, 400M)
function shortIDR(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "") + "T";
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "M"; // Miliar
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "jt"; // Juta
  return n.toLocaleString("id-ID");
}

function Kpi({ label, value, subvalue, icon, positive = true }: KpiProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="gradient-card rounded-2xl shadow-soft border-0 hover:shadow-glow transition-all duration-300 cursor-pointer group">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
              positive 
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600" 
                : "bg-gradient-to-br from-red-50 to-red-100 text-red-600"
            }`}>
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-medium text-slate-600 truncate mb-1">{label}</div>
              <div className="text-xl sm:text-3xl font-bold leading-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {value}
              </div>
              {subvalue && <div className="text-xs sm:text-sm text-slate-500 font-mono mt-1">{subvalue}</div>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MaterialTable({ data }: MaterialTableProps) {
  // Tabel desktop (md+)
  const TableView = (
    <div className="overflow-x-auto hidden md:block">
      <table className="min-w-full">
        <thead>
          <tr className="text-left border-b-2 border-slate-200 bg-slate-50/50">
            <th className="py-4 pr-6 font-semibold text-slate-700">Material</th>
            <th className="py-4 pr-6 font-semibold text-slate-700">Qty (m³)</th>
            <th className="py-4 pr-6 font-semibold text-slate-700">Harga Beli /m³</th>
            <th className="py-4 pr-6 font-semibold text-slate-700">Harga Jual /m³</th>
            <th className="py-4 pr-6 font-semibold text-slate-700">Total Beli</th>
            <th className="py-4 pr-6 font-semibold text-slate-700">Total Jual</th>
            <th className="py-4 pr-6 font-semibold text-slate-700">Margin /m³</th>
            <th className="py-4 pr-6 font-semibold text-slate-700">Total Margin</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <motion.tr 
              key={row.material} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-200 group"
            >
              <td className="py-4 pr-6 font-bold text-slate-900">{row.material}</td>
              <td className="py-4 pr-6 text-slate-700 font-medium">{row.qty.toLocaleString("id-ID")}</td>
              <td className="py-4 pr-6 text-red-600 font-semibold">{formatIDR(row.buy_price)}</td>
              <td className="py-4 pr-6 text-green-600 font-semibold">{formatIDR(row.sell_price)}</td>
              <td className="py-4 pr-6 text-slate-700 font-mono">{formatIDR(row.buy_total)}</td>
              <td className="py-4 pr-6 text-slate-700 font-mono">{formatIDR(row.sell_total)}</td>
              <td className="py-4 pr-6 text-orange-600 font-semibold">{formatIDR(row.unit_margin)}</td>
              <td className="py-4 pr-6 font-bold text-emerald-600 text-lg">{formatIDR(row.total_margin)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Kartu mobile (sm-)
  const CardView = (
    <div className="space-y-3 md:hidden">
      {data.map((row) => (
        <Card key={row.material} className="gradient-card rounded-2xl shadow-soft border-0 hover:shadow-glow transition-all duration-300 group">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-bold text-slate-900">{row.material}</div>
              <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium">
                {row.qty.toLocaleString("id-ID")} m³
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-red-50 p-3 rounded-xl">
                <div className="text-red-600 text-xs font-semibold mb-1">Harga Beli /m³</div>
                <div className="font-bold text-red-700">{formatIDR(row.buy_price)}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <div className="text-green-600 text-xs font-semibold mb-1">Harga Jual /m³</div>
                <div className="font-bold text-green-700">{formatIDR(row.sell_price)}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <div className="text-blue-600 text-xs font-semibold mb-1">Total Beli</div>
                <div className="font-bold text-blue-700">{shortIDR(row.buy_total)}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl">
                <div className="text-purple-600 text-xs font-semibold mb-1">Total Jual</div>
                <div className="font-bold text-purple-700">{shortIDR(row.sell_total)}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl">
                <div className="text-orange-600 text-xs font-semibold mb-1">Margin /m³</div>
                <div className="font-bold text-orange-700">{formatIDR(row.unit_margin)}</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl">
                <div className="text-emerald-600 text-xs font-semibold mb-1">Total Margin</div>
                <div className="font-bold text-emerald-700">{shortIDR(row.total_margin)}</div>
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

function GrafikSection({ data }: GrafikSectionProps) {
  const chartData = data.map((r) => ({ material: r.material, Beli: r.buy_total, Jual: r.sell_total, Margin: r.total_margin }));
  const pieData = [
    { name: "Margin (Laba)", value: raw.totals.total_margin, fill: "#10b981" },
    { name: "Biaya (COGS)", value: raw.totals.total_sell - raw.totals.total_margin, fill: "#6366f1" },
  ];

  // Custom tooltip formatter
  const formatTooltipValue = (value: number, name: string): [string, string] => [formatIDR(value), name];
  const formatPieTooltipValue = (value: number, name: string): [string, string] => [
    `${formatIDR(value)} (${((value / raw.totals.total_sell) * 100).toFixed(1)}%)`, 
    name
  ];

  return (
    <div className="space-y-6">
      <Card className="gradient-card rounded-2xl shadow-soft border-0">
        <CardContent className="p-5 sm:p-6">
          <div className="text-lg font-bold text-slate-900 mb-4 sm:mb-6">Perbandingan Beli vs Jual per Material</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                <XAxis 
                  dataKey="material" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  formatter={formatTooltipValue}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                />
                <Bar 
                  dataKey="Beli" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]}
                  name="Total Pembelian"
                />
                <Bar 
                  dataKey="Jual" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                  name="Total Penjualan"
                />
              </RBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card rounded-2xl shadow-soft border-0">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="text-lg font-bold text-slate-900">Komposisi Pendapatan</div>
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
              Profit: {profitPctCost.toFixed(2)}%
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  paddingAngle={5}
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                  stroke="none"
                />
                <Tooltip formatter={formatPieTooltipValue} />
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
  const [activeTab, setActiveTab] = useState<TabType>("ringkasan");
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="md:hidden sticky top-0 z-30 glass-effect border-b border-white/30">
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        <motion.div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-3 rounded-xl text-center">
          <div className="text-xs font-medium opacity-90">Margin %</div>
          <div className="text-lg font-bold">{marginPctSales.toFixed(2)}%</div>
        </motion.div>
        <motion.div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl text-center">
          <div className="text-xs font-medium opacity-90">Profit %</div>
          <div className="text-lg font-bold">{profitPctCost.toFixed(2)}%</div>
        </motion.div>
      </div>
    </div>
  );

  // Bottom Tab Bar (mobile)
  const TabBar = (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-effect border-t border-white/30 safe-area-inset-bottom">
      <div className="grid grid-cols-3 px-2 py-2" role="tablist" aria-label="Navigasi dashboard">
        <button 
          onClick={() => setActiveTab("ringkasan")} 
          className={`py-3 px-4 flex flex-col items-center gap-1 rounded-xl transition-all duration-300 ${
            activeTab === "ringkasan" 
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg" 
              : "text-slate-600 hover:bg-white/50"
          }`}
          aria-label="Tampilkan bagian ringkasan"
          aria-pressed={activeTab === "ringkasan"}
          role="tab"
        >
          <Percent className="h-5 w-5" />
          <span className="text-xs font-medium">Ringkasan</span>
        </button>
        <button 
          onClick={() => setActiveTab("material")} 
          className={`py-3 px-4 flex flex-col items-center gap-1 rounded-xl transition-all duration-300 ${
            activeTab === "material" 
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg" 
              : "text-slate-600 hover:bg-white/50"
          }`}
          aria-label="Tampilkan bagian detail material"
          aria-pressed={activeTab === "material"}
          role="tab"
        >
          <LayoutList className="h-5 w-5" />
          <span className="text-xs font-medium">Material</span>
        </button>
        <button 
          onClick={() => setActiveTab("grafik")} 
          className={`py-3 px-4 flex flex-col items-center gap-1 rounded-xl transition-all duration-300 ${
            activeTab === "grafik" 
              ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg" 
              : "text-slate-600 hover:bg-white/50"
          }`}
          aria-label="Tampilkan bagian grafik visualisasi"
          aria-pressed={activeTab === "grafik"}
          role="tab"
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs font-medium">Grafik</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="pb-16 md:pb-0">{/* extra bottom space for tab bar on mobile */}
      {StickyHeader}

      <div className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 max-w-screen-xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-start justify-between"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent mb-3 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300">
                {raw.project}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed max-w-3xl">
                Dashboard analisis pembelian vs penjualan material konstruksi dengan perhitungan margin dan profit yang akurat.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-soft hover:shadow-glow"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* RINGKASAN */}
        <section 
          className={`${activeTab === "ringkasan" ? "block" : "hidden md:block"}`}
          aria-labelledby="ringkasan-title"
          role="tabpanel"
          aria-hidden={activeTab !== "ringkasan"}
        >
          <h2 id="ringkasan-title" className="sr-only">Ringkasan Keuangan Proyek</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-5 sm:mb-8">
            {isLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <SkeletonKpi key={i} />
                ))}
              </>
            ) : (
              <>
                <Kpi label="Total Pembelian" value={shortIDR(raw.totals.total_buy)} subvalue={kpiSub.pembelian} icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />} positive={false} />
                <Kpi label="Total Penjualan" value={shortIDR(raw.totals.total_sell)} subvalue={kpiSub.penjualan} icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />} positive />
                <Kpi label="Total Margin" value={shortIDR(raw.totals.total_margin)} subvalue={kpiSub.margin} icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />} positive />
                <Kpi label="Margin % (vs Penjualan)" value={marginPctSales.toFixed(2) + "%"} icon={<Percent className="h-4 w-4 sm:h-5 sm:w-5" />} positive />
                <Kpi label="Profit % (vs Biaya)" value={profitPctCost.toFixed(2) + "%"} icon={<Percent className="h-4 w-4 sm:h-5 sm:w-5" />} positive />
              </>
            )}
          </div>
        </section>

        {/* MATERIAL */}
        <section 
          className={`${activeTab === "material" ? "block" : "hidden md:block"}`}
          aria-labelledby="material-title"
          role="tabpanel"
          aria-hidden={activeTab !== "material"}
        >
          <h2 id="material-title" className="sr-only">Detail Material Konstruksi</h2>
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Cari material konstruksi…" 
                className="pl-12 h-12 text-sm bg-white/70 backdrop-blur-sm border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300" 
                aria-label="Cari material konstruksi"
                role="searchbox"
              />
            </div>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setQuery("")}
                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200"
                title="Clear search"
              >
                <span className="text-sm font-medium text-slate-600">Reset</span>
              </motion.button>
            )}
          </div>

          <Card className="gradient-card rounded-2xl shadow-soft border-0">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="text-lg font-bold text-slate-900">Detail per Material</div>
                {!isLoading && (
                  <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {filtered.length} material
                  </div>
                )}
              </div>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="hidden md:block">
                    <div className="bg-slate-50 rounded-xl p-4 animate-pulse">
                      <div className="grid grid-cols-8 gap-4 mb-4">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="h-4 bg-slate-200 rounded"></div>
                        ))}
                      </div>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="grid grid-cols-8 gap-4 py-3 border-b border-slate-200 last:border-0">
                          {[...Array(8)].map((_, j) => (
                            <div key={j} className="h-3 bg-slate-200 rounded"></div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:hidden space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                </div>
              ) : (
                <MaterialTable data={filtered} />
              )}
            </CardContent>
          </Card>
        </section>

        {/* GRAFIK */}
        <section 
          className={`${activeTab === "grafik" ? "block" : "hidden md:block"}`}
          aria-labelledby="grafik-title"
          role="tabpanel"
          aria-hidden={activeTab !== "grafik"}
        >
          <h2 id="grafik-title" className="sr-only">Grafik dan Visualisasi Data</h2>
          <GrafikSection data={filtered} />
        </section>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-200"
        >
          <div className="text-sm text-slate-600 leading-relaxed">
            <strong className="text-slate-800">💡 Tips Navigasi:</strong> Di mobile, gunakan tab bar di bawah untuk berpindah antar bagian. 
            Angka disingkat (T=Triliun, M=Miliar, jt=Juta). Geser tabel horizontal untuk melihat semua kolom.
          </div>
        </motion.div>
      </div>

      {TabBar}
    </div>
  );
}
