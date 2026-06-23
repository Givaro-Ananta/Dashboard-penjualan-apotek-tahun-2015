"use client";

import React, { useState, useMemo } from "react";
import dashboardData from "../data/dashboard_data.json";
import {
  TrendingUp,
  Activity,
  DollarSign,
  Percent,
  FileText,
  Package,
  Clock,
  Calendar,
  User,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Cpu,
  Database,
  RefreshCw,
  Info,
  Download,
  AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

// ── UTILITIES ────────────────────────────────────────────────────────────────
const formatIDR = (num: number) => {
  if (num >= 1e9) return `Rp ${(num / 1e9).toFixed(2)} Miliar`;
  if (num >= 1e6) return `Rp ${(num / 1e6).toFixed(2)} Juta`;
  return `Rp ${num.toLocaleString("id-ID")}`;
};

const formatFullIDR = (num: number) => {
  return `Rp ${Math.round(num).toLocaleString("id-ID")}`;
};

const formatNum = (num: number) => {
  return num.toLocaleString("id-ID");
};

const downloadCSV = (data: any[], filename: string, headers: string[], keys: string[]) => {
  const csvRows = [];
  csvRows.push(headers.join(","));
  for (const row of data) {
    const values = keys.map(key => {
      const val = row[key];
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const COLORS = [
  "#0ea5e9", // Cyan/Teal
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#f43f5e"  // Rose
];

const getColorClass = (index: number) => {
  const classes = [
    "bg-[#0ea5e9]",
    "bg-[#6366f1]",
    "bg-[#10b981]",
    "bg-[#8b5cf6]",
    "bg-[#f59e0b]",
    "bg-[#f43f5e]"
  ];
  return classes[index % classes.length];
};

// Returns true if the code exists but doesn't look like a real doctor code
// Valid codes are 3-digit zero-padded numbers (e.g. "001", "042")
const isInvalidDoctorCode = (code: string): boolean => {
  return !/^\d{3}$/.test(code);
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Chart Visibility States
  const [showRevenue, setShowRevenue] = useState(true);
  const [showProfit, setShowProfit] = useState(true);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedInsurance, setSelectedInsurance] = useState("ALL");

  // Search States
  const [productQuery, setProductQuery] = useState("");
  const [productMetric, setProductMetric] = useState("qty"); // 'qty' | 'revenue'
  const [doctorQuery, setDoctorQuery] = useState("");

  // Pagination States
  const [prodPage, setProdPage] = useState(1);
  const prodPerPage = 10;
  const [docPage, setDocPage] = useState(1);
  const docPerPage = 10;

  // Doctor Sorting States
  const [doctorSortField, setDoctorSortField] = useState<string>("recipes");
  const [doctorSortDirection, setDoctorSortDirection] = useState<"asc" | "desc">("desc");

  // Handler for Doctor sorting
  const handleDoctorSort = (field: string) => {
    if (doctorSortField === field) {
      setDoctorSortDirection(doctorSortDirection === "asc" ? "desc" : "asc");
    } else {
      setDoctorSortField(field);
      setDoctorSortDirection("desc"); // Default to desc for numeric metrics
    }
    setDocPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedMonth("ALL");
    setSelectedType("ALL");
    setSelectedInsurance("ALL");
  };

  const handleDownloadProducts = () => {
    const headers = [
      "Kode Obat",
      "Nama Obat",
      "Satuan",
      "Kode Pabrik",
      "Qty Terjual",
      "Total Omzet (Rp)",
      "Total Margin (Rp)"
    ];
    const keys = ["code", "name", "unit", "pabrik", "qty", "revenue", "margin"];
    downloadCSV(productList, "performa_produk_2015.csv", headers, keys);
  };

  const handleDownloadDoctors = () => {
    const headers = [
      "Kode Dokter",
      "Volume Resep",
      "Total Omzet (Rp)",
      "Total Margin (Rp)",
      "Rata-rata per Resep (Rp)"
    ];
    const keys = ["code", "recipes", "revenue", "margin", "avg_per_recipe"];
    downloadCSV(doctorList, "kinerja_dokter_2015.csv", headers, keys);
  };

  // ── FILTER OPTIONS DERIVATION ──────────────────────────────────────────────
  const months = useMemo(() => {
    const set = new Set<string>();
    dashboardData.multidim_data.forEach((row) => set.add(row.month));
    return Array.from(set).sort();
  }, []);

  const transactionTypes = useMemo(() => {
    const set = new Set<string>();
    dashboardData.multidim_data.forEach((row) => set.add(row.type));
    return Array.from(set).sort();
  }, []);

  const insuranceTypes = useMemo(() => {
    const set = new Set<string>();
    dashboardData.multidim_data.forEach((row) => set.add(row.insurance));
    // R, I, A -> Map to Labels
    return Array.from(set).sort();
  }, []);

  const maxHourRecipes = useMemo(() => Math.max(...dashboardData.hourly_busy.map(d => d.recipes), 1), []);
  const maxDayRecipes = useMemo(() => Math.max(...dashboardData.weekly_busy.map(d => d.recipes), 1), []);

  const getInsuranceLabel = (code: string) => {
    if (code === "R") return "Reguler";
    if (code === "I") return "Asuransi";
    if (code === "A") return "Askes";
    return code;
  };

  // ── DYNAMIC METRIC CALCULATION ─────────────────────────────────────────────
  const filteredMetrics = useMemo(() => {
    let revenue = 0;
    let cogs = 0;
    let margin = 0;
    let qty = 0;
    let recipes = 0;

    dashboardData.multidim_data.forEach((row) => {
      const matchMonth = selectedMonth === "ALL" || row.month === selectedMonth;
      const matchType = selectedType === "ALL" || row.type === selectedType;
      const matchIns = selectedInsurance === "ALL" || row.insurance === selectedInsurance;

      if (matchMonth && matchType && matchIns) {
        revenue += row.revenue;
        cogs += row.cogs;
        margin += row.margin;
        qty += row.qty;
        recipes += row.recipes;
      }
    });

    const marginPctCogs = cogs > 0 ? (margin / cogs) * 100 : 0;
    const marginPctSales = revenue > 0 ? (margin / revenue) * 100 : 0;

    return {
      revenue,
      cogs,
      margin,
      qty,
      recipes,
      marginPctCogs,
      marginPctSales
    };
  }, [selectedMonth, selectedType, selectedInsurance]);

  // ── DYNAMIC MONTHLY TREND CALCULATION ──────────────────────────────────────
  const monthlyTrendChartData = useMemo(() => {
    const monthlyMap: Record<string, typeof filteredMetrics> = {};

    // Seed all months to prevent gaps
    months.forEach((m) => {
      monthlyMap[m] = {
        revenue: 0, cogs: 0, margin: 0, qty: 0, recipes: 0, marginPctCogs: 0, marginPctSales: 0
      };
    });

    dashboardData.multidim_data.forEach((row) => {
      const matchType = selectedType === "ALL" || row.type === selectedType;
      const matchIns = selectedInsurance === "ALL" || row.insurance === selectedInsurance;

      if (matchType && matchIns) {
        const m = row.month;
        monthlyMap[m].revenue += row.revenue;
        monthlyMap[m].cogs += row.cogs;
        monthlyMap[m].margin += row.margin;
        monthlyMap[m].qty += row.qty;
        monthlyMap[m].recipes += row.recipes;
      }
    });

    return Object.keys(monthlyMap).sort().map((month) => {
      const mData = monthlyMap[month];
      const nameOnly = month.split(" - ")[1] || month;
      return {
        month: nameOnly,
        fullMonth: month,
        Revenue: mData.revenue,
        COGS: mData.cogs,
        Profit: mData.margin,
        "Margin % (COGS)": mData.cogs > 0 ? parseFloat(((mData.margin / mData.cogs) * 100).toFixed(2)) : 0,
        "Margin % (Sales)": mData.revenue > 0 ? parseFloat(((mData.margin / mData.revenue) * 100).toFixed(2)) : 0,
        Resep: mData.recipes,
        Qty: mData.qty
      };
    });
  }, [months, selectedType, selectedInsurance]);

  // ── DYNAMIC BREAKDOWNS ─────────────────────────────────────────────────────
  // Transaction type breakdown based on current filters
  const txBreakdownData = useMemo(() => {
    const txMap: Record<string, number> = {};
    dashboardData.multidim_data.forEach((row) => {
      const matchMonth = selectedMonth === "ALL" || row.month === selectedMonth;
      const matchIns = selectedInsurance === "ALL" || row.insurance === selectedInsurance;

      if (matchMonth && matchIns) {
        txMap[row.type] = (txMap[row.type] || 0) + row.revenue;
      }
    });

    return Object.keys(txMap).map((key) => ({
      name: key,
      value: txMap[key]
    }));
  }, [selectedMonth, selectedInsurance]);

  // Insurance type breakdown based on current filters
  const insBreakdownData = useMemo(() => {
    const insMap: Record<string, number> = {};
    dashboardData.multidim_data.forEach((row) => {
      const matchMonth = selectedMonth === "ALL" || row.month === selectedMonth;
      const matchType = selectedType === "ALL" || row.type === selectedType;

      if (matchMonth && matchType) {
        const label = getInsuranceLabel(row.insurance);
        insMap[label] = (insMap[label] || 0) + row.revenue;
      }
    });

    return Object.keys(insMap).map((key) => ({
      name: key,
      value: insMap[key]
    }));
  }, [selectedMonth, selectedType]);

  // ── STATIC PRODUCTS FILTER & PAGINATION ────────────────────────────────────
  const productList = useMemo(() => {
    const rawList = productMetric === "qty" ? dashboardData.top_products_qty : dashboardData.top_products_revenue;
    return rawList.filter(
      (p) =>
        p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(productQuery.toLowerCase()) ||
        p.pabrik.toLowerCase().includes(productQuery.toLowerCase())
    );
  }, [productMetric, productQuery]);

  const paginatedProducts = useMemo(() => {
    const start = (prodPage - 1) * prodPerPage;
    return productList.slice(start, start + prodPerPage);
  }, [productList, prodPage]);

  const totalProdPages = Math.ceil(productList.length / prodPerPage);

  // ── STATIC DOCTORS FILTER & PAGINATION ─────────────────────────────────────
  const doctorList = useMemo(() => {
    const filtered = dashboardData.top_doctors.filter((d) =>
      d.code.toLowerCase().includes(doctorQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let aVal: any = a[doctorSortField as keyof typeof a];
      let bVal: any = b[doctorSortField as keyof typeof b];

      // Handle undefined
      if (aVal === undefined) aVal = "";
      if (bVal === undefined) bVal = "";

      if (typeof aVal === "string" && typeof bVal === "string") {
        return doctorSortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        // Numbers
        return doctorSortDirection === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });
  }, [doctorQuery, doctorSortField, doctorSortDirection]);

  const paginatedDoctors = useMemo(() => {
    const start = (docPage - 1) * docPerPage;
    return doctorList.slice(start, start + docPerPage);
  }, [doctorList, docPage]);

  const totalDocPages = Math.ceil(doctorList.length / docPerPage);

  // Custom legend renderer for financial trends chart to toggle series visibility
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-6 text-xs pt-4 flex-wrap">
        {payload.map((entry: any, index: number) => {
          const { value } = entry;
          const key = entry.dataKey || entry.id || (value === "Omzet Kotor" ? "Revenue" : "Profit");
          const isHidden = key === "Revenue" ? !showRevenue : !showProfit;
          const isRevenue = key === "Revenue";
          const bgClass = isRevenue ? "bg-[#0ea5e9]" : "bg-[#10b981]";
          const borderClass = isRevenue ? "border-[#0ea5e9]" : "border-[#10b981]";

          return (
            <button
              key={`legend-item-${index}`}
              onClick={() => {
                if (key === "Revenue") setShowRevenue(!showRevenue);
                if (key === "Profit") setShowProfit(!showProfit);
              }}
              className={`flex items-center gap-2 cursor-pointer select-none transition-all duration-200 hover:opacity-85 ${isHidden ? "opacity-35" : "opacity-100"
                }`}
              title={`Klik untuk menampilkan/menyembunyikan ${value}`}
            >
              {/* Line and circle icon mimicking Recharts default */}
              <span className="flex items-center">
                <span className={`w-2.5 h-0.5 ${bgClass}`} />
                <span
                  className={`w-2.5 h-2.5 rounded-full border shrink-0 transition-colors ${borderClass} ${isHidden ? "bg-transparent" : bgClass
                    }`}
                />
                <span className={`w-2.5 h-0.5 ${bgClass}`} />
              </span>
              <span className={`transition-colors ${isHidden ? "text-slate-500 line-through" : "text-slate-300 font-semibold"}`}>
                {value}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070a13] text-[#f8fafc] font-sans antialiased">
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#070a13]/85 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Apotek Care <span className="text-xs bg-sky-500/10 text-sky-400 font-semibold px-2 py-0.5 rounded-full border border-sky-500/20">Dashboard 2015</span>
            </h1>
            <p className="text-xs text-slate-400">Analisis Penjualan Obat & Kinerja Operasional</p>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1">
        {/* ── SIDEBAR FILTERS ────────────────────────────────────────────────── */}
        <aside className="w-full lg:w-72 border-r border-white/5 bg-[#090d1a]/50 p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Filter className="h-4 w-4 text-sky-400" /> Filter Data
            </h2>
            {(selectedMonth !== "ALL" || selectedType !== "ALL" || selectedInsurance !== "ALL") && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Filter Bulan */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-medium">Bulan Penjualan</label>
              <select
                title="Pilih Bulan Penjualan"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-[#12182b] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors cursor-pointer"
              >
                <option value="ALL">Semua Bulan (1 Tahun)</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m.split(" - ")[1]}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Jenis Transaksi */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-medium">Jenis Pelayanan</label>
              <select
                title="Pilih Jenis Pelayanan"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-[#12182b] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors cursor-pointer"
              >
                <option value="ALL">Semua Pelayanan</option>
                {transactionTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Asuransi */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-medium">Metode Pembayaran</label>
              <select
                title="Pilih Metode Pembayaran"
                value={selectedInsurance}
                onChange={(e) => setSelectedInsurance(e.target.value)}
                className="w-full bg-[#12182b] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors cursor-pointer"
              >
                <option value="ALL">Semua Pembayaran</option>
                {insuranceTypes.map((i) => (
                  <option key={i} value={i}>
                    {getInsuranceLabel(i)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-auto p-4 rounded-xl bg-slate-950/40 border border-white/5 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
            <Info className="h-4.5 w-4.5 text-sky-500/60 shrink-0" />
            <p>
              Menggunakan dataset normal untuk tren keuangan (tidak termasuk transaksi retur dengan QTY negatif dan baris orphan).
            </p>
          </div>
        </aside>

        {/* ── CONTENT CONTAINER ──────────────────────────────────────────────── */}
        <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          {/* ── TABS NAVIGATION ──────────────────────────────────────────────── */}
          <div className="flex border-b border-white/5 gap-2 overflow-x-auto pb-px">
            {[
              { id: "overview", label: "Ringkasan Finansial", icon: TrendingUp },
              { id: "products", label: "Analisis Produk", icon: Package },
              { id: "doctors", label: "Kinerja Dokter", icon: User },
              { id: "operations", label: "Waktu Sibuk", icon: Clock },
              { id: "pipeline", label: "Integritas Pipeline", icon: ShieldCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${isActive
                    ? "border-sky-500 text-sky-400 bg-sky-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/2"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── TAB PANEL CONTENT ────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-6 min-h-0">
            {/* ── TAB: OVERVIEW ──────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* 1. Dynamic KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Omzet Card */}
                  <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400 font-medium">Omzet Kotor (HJ)</span>
                      <span className="text-2xl font-bold text-white tracking-tight text-glow">
                        {formatIDR(filteredMetrics.revenue)}
                      </span>
                      <span className="text-[10px] text-slate-500">Omzet kotor dari harga jual</span>
                    </div>
                    <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl w-12 h-12 flex items-center justify-center font-bold text-sky-400 select-none">
                      Rp
                    </div>
                  </div>

                  {/* COGS Card */}
                  <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400 font-medium">COGS / Harga Pokok (HNA)</span>
                      <span className="text-2xl font-bold text-white tracking-tight">
                        {formatIDR(filteredMetrics.cogs)}
                      </span>
                      <span className="text-[10px] text-slate-500">Harga pokok pembelian apotek</span>
                    </div>
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-indigo-400" />
                    </div>
                  </div>

                  {/* Margin Card */}
                  <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400 font-medium">Margin Keuntungan</span>
                      <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                        {formatIDR(filteredMetrics.margin)}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-emerald-400">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>{filteredMetrics.marginPctCogs.toFixed(2)}% dari HNA</span>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <Percent className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>

                  {/* Recipes & Qty Card */}
                  <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-400 font-medium">Volume Resep & Item</span>
                      <span className="text-2xl font-bold text-white tracking-tight">
                        {formatNum(filteredMetrics.recipes)} <span className="text-xs font-medium text-slate-400">resep</span>
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        Terjual: <b>{formatNum(filteredMetrics.qty)}</b> item obat
                      </span>
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <FileText className="h-6 w-6 text-amber-400" />
                    </div>
                  </div>
                </div>

                {/* 2. Core Trends Chart */}
                <div className="glass-panel p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-slate-200">Tren Finansial Bulanan</h3>
                    <p className="text-xs text-slate-400">Grafik omzet vs profit margin per bulan sepanjang tahun 2015</p>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyTrendChartData}
                        margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                        <YAxis
                          stroke="#64748b"
                          fontSize={11}
                          tickFormatter={(v) => v >= 1e9 ? `Rp ${(v / 1e9).toFixed(2).replace(/\.00$/, "").replace(/\.(\d)0$/, ".$1").replace(".", ",")} M` : `Rp ${(v / 1e6).toFixed(0)} jt`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(13, 20, 38, 0.95)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px"
                          }}
                          itemStyle={{ color: "#cbd5e1" }}
                          labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                          formatter={(value: any) => [formatFullIDR(value), ""]}
                        />
                        <Legend content={renderCustomLegend} />
                        <Area
                          hide={!showRevenue}
                          type="monotone"
                          dataKey="Revenue"
                          name="Omzet Kotor"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRev)"
                        />
                        <Area
                          hide={!showProfit}
                          type="monotone"
                          dataKey="Profit"
                          name="Margin Keuntungan"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorProfit)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Donut Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Transaction Type Breakdown */}
                  <div className="glass-panel p-6 flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-slate-200">Kontribusi Jenis Pelayanan</h3>
                      <p className="text-xs text-slate-400">Distribusi omzet berdasarkan tipe pendaftaran/resep</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="h-48 w-48 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={txBreakdownData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {txBreakdownData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "rgba(13, 20, 38, 0.95)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px"
                              }}
                              itemStyle={{ color: "#cbd5e1" }}
                              labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                              formatter={(v: any) => [formatFullIDR(v), ""]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-2 flex-1 w-full">
                        {txBreakdownData.map((item, index) => {
                          const total = txBreakdownData.reduce((acc, curr) => acc + curr.value, 0);
                          const pct = total > 0 ? (item.value / total) * 100 : 0;
                          return (
                            <div key={item.name} className="flex items-center justify-between text-xs border-b border-white/5 pb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${getColorClass(index)}`}
                                />
                                <span className="text-slate-300 font-medium">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-white font-bold">{formatIDR(item.value)}</span>
                                <span className="text-[10px] text-slate-500 ml-1.5">({pct.toFixed(1)}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Insurance Type Breakdown */}
                  <div className="glass-panel p-6 flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-slate-200">Demografi Pasien (Metode Bayar)</h3>
                      <p className="text-xs text-slate-400">Proporsi transaksi dari Reguler, Askes, dan Asuransi Swasta</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="h-48 w-48 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={insBreakdownData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {insBreakdownData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "rgba(13, 20, 38, 0.95)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px"
                              }}
                              itemStyle={{ color: "#cbd5e1" }}
                              labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                              formatter={(v: any) => [formatFullIDR(v), ""]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-2 flex-1 w-full">
                        {insBreakdownData.map((item, index) => {
                          const total = insBreakdownData.reduce((acc, curr) => acc + curr.value, 0);
                          const pct = total > 0 ? (item.value / total) * 100 : 0;
                          return (
                            <div key={item.name} className="flex items-center justify-between text-xs border-b border-white/5 pb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${getColorClass(index + 2)}`}
                                />
                                <span className="text-slate-300 font-medium">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-white font-bold">{formatIDR(item.value)}</span>
                                <span className="text-[10px] text-slate-500 ml-1.5">({pct.toFixed(1)}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: PRODUCTS ──────────────────────────────────────────────── */}
            {activeTab === "products" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Product Settings & Search Header */}
                <div className="glass-panel p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold tracking-tight text-slate-200">Performa Master Produk</h3>
                    <p className="text-xs text-slate-400">Menampilkan performa seluruh produk obat di apotek</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Toggle Metric */}
                    <div className="flex border border-white/10 rounded-lg overflow-hidden bg-slate-950/40 p-0.5">
                      <button
                        onClick={() => { setProductMetric("qty"); setProdPage(1); }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${productMetric === "qty" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        Berdasarkan Volume (QTY)
                      </button>
                      <button
                        onClick={() => { setProductMetric("revenue"); setProdPage(1); }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${productMetric === "revenue" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-slate-200"
                          }`}
                      >
                        Berdasarkan Omzet (Rupiah)
                      </button>
                    </div>

                    {/* Search Field */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari obat, kode, atau pabrik..."
                        value={productQuery}
                        onChange={(e) => { setProductQuery(e.target.value); setProdPage(1); }}
                        className="w-full bg-[#12182b] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
                      />
                    </div>

                    {/* Export Button */}
                    <button
                      onClick={handleDownloadProducts}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-colors cursor-pointer select-none"
                      title="Unduh Data Performa Produk (CSV)"
                    >
                      <Download className="h-4 w-4" /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Top Products Bar Chart Preview */}
                <div className="glass-panel p-6 flex flex-col gap-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Visualisasi Top 10 Obat Terlaris ({productMetric === "qty" ? "Volume" : "Omzet"})
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={productList.slice(0, 10)}
                        margin={{ top: 10, right: 10, left: 15, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          stroke="#64748b"
                          fontSize={9}
                          interval={0}
                          tickFormatter={(v) => (v.length > 15 ? `${v.substring(0, 15)}...` : v)}
                          height={40}
                        />
                        <YAxis
                          stroke="#64748b"
                          fontSize={10}
                          tickFormatter={(v) => (productMetric === "qty" ? formatNum(v) : `Rp ${(v / 1e6).toFixed(0)} jt`)}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(13, 20, 38, 0.95)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px"
                          }}
                          itemStyle={{ color: "#cbd5e1" }}
                          labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                          formatter={(value: any) => [
                            productMetric === "qty" ? `${formatNum(value)} Unit` : formatFullIDR(value),
                            productMetric === "qty" ? "Total Qty" : "Total Omzet"
                          ]}
                        />
                        <Bar
                          dataKey={productMetric === "qty" ? "qty" : "revenue"}
                          radius={[4, 4, 0, 0]}
                        >
                          {productList.slice(0, 10).map((entry, idx) => {
                            const val = entry[productMetric === "qty" ? "qty" : "revenue"] || 0;
                            const maxVal = productList[0]?.[productMetric === "qty" ? "qty" : "revenue"] || 1;
                            const ratio = val / maxVal;
                            const opacity = 0.25 + 0.75 * ratio;
                            const baseColor = productMetric === "qty" ? "#6366f1" : "#0ea5e9";
                            return (
                              <Cell
                                key={`cell-${idx}`}
                                fill={baseColor}
                                fillOpacity={opacity}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Product Table Grid */}
                <div className="glass-panel overflow-hidden border border-white/5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="px-6 py-4">Kode</th>
                          <th className="px-6 py-4">Nama Obat</th>
                          <th className="px-6 py-4">Satuan</th>
                          <th className="px-6 py-4 text-right">Pabrik</th>
                          <th className="px-6 py-4 text-right">Qty Terjual</th>
                          <th className="px-6 py-4 text-right">Omzet</th>
                          <th className="px-6 py-4 text-right">Margin Keuntungan</th>
                          <th className="px-6 py-4 text-right">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {paginatedProducts.length > 0 ? (
                          paginatedProducts.map((p, idx) => {
                            const rank = (prodPage - 1) * prodPerPage + idx + 1;
                            const marginPct = p.revenue - p.margin > 0 ? (p.margin / (p.revenue - p.margin)) * 100 : 0;
                            return (
                              <tr key={p.code} className="hover:bg-white/1 transition-colors">
                                <td className="px-6 py-3.5 font-mono text-[10px] text-slate-400 flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 font-bold text-[9px] border border-white/5 text-slate-400">
                                    {rank}
                                  </span>
                                  {p.code}
                                </td>
                                <td className="px-6 py-3.5 text-white font-medium">{p.name}</td>
                                <td className="px-6 py-3.5 text-slate-400">{p.unit}</td>
                                <td className="px-6 py-3.5 text-right font-mono text-slate-400">{p.pabrik}</td>
                                <td className="px-6 py-3.5 text-right font-semibold text-white">{formatNum(p.qty)}</td>
                                <td className="px-6 py-3.5 text-right text-sky-400 font-semibold">{formatIDR(p.revenue)}</td>
                                <td className="px-6 py-3.5 text-right text-emerald-400">{formatIDR(p.margin)}</td>
                                <td className="px-6 py-3.5 text-right font-mono text-slate-400">
                                  {marginPct.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                              Tidak ada obat yang cocok dengan pencarian.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalProdPages > 1 && (
                    <div className="bg-slate-950/20 border-t border-white/5 px-6 py-4 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Menampilkan <b>{Math.min(productList.length, (prodPage - 1) * prodPerPage + 1)}</b> -{" "}
                        <b>{Math.min(productList.length, prodPage * prodPerPage)}</b> dari{" "}
                        <b>{productList.length}</b> produk obat
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setProdPage((p) => Math.max(1, p - 1))}
                          disabled={prodPage === 1}
                          className="px-2.5 py-1 text-[11px] font-semibold border border-white/10 rounded-md bg-slate-900 text-slate-300 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Sebelumnya
                        </button>
                        <span className="text-xs text-slate-400 font-medium px-2">
                          Halaman {prodPage} dari {totalProdPages}
                        </span>
                        <button
                          onClick={() => setProdPage((p) => Math.min(totalProdPages, p + 1))}
                          disabled={prodPage === totalProdPages}
                          className="px-2.5 py-1 text-[11px] font-semibold border border-white/10 rounded-md bg-slate-900 text-slate-300 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: DOCTORS ────────────────────────────────────────────────── */}
            {activeTab === "doctors" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Core Demographics & Prescription Mix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Doctor Activity Summary */}
                  <div className="glass-panel p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold tracking-tight text-slate-200">Kinerja Resep Dokter</h3>
                      <p className="text-xs text-slate-400">Menampilkan kinerja resep dari seluruh dokter aktif</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari kode dokter (contoh: 001)..."
                          value={doctorQuery}
                          onChange={(e) => { setDoctorQuery(e.target.value); setDocPage(1); }}
                          className="w-full bg-[#12182b] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                      </div>
                      <button
                        onClick={handleDownloadDoctors}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-colors cursor-pointer select-none"
                        title="Unduh Data Kinerja Dokter (CSV)"
                      >
                        <Download className="h-4 w-4" /> Export CSV
                      </button>
                    </div>

                    <div className="overflow-hidden border border-white/5 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-white/5 text-slate-400 uppercase font-semibold tracking-wider select-none">
                            <th
                              className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                              onClick={() => handleDoctorSort("code")}
                              title="Urutkan berdasarkan Kode Dokter"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Kode Dokter</span>
                                <span className="text-[9px] text-sky-400">
                                  {doctorSortField === "code" ? (doctorSortDirection === "asc" ? "▲" : "▼") : "↕"}
                                </span>
                              </div>
                            </th>
                            <th
                              className="px-4 py-3 text-right cursor-pointer hover:bg-white/5 transition-colors"
                              onClick={() => handleDoctorSort("recipes")}
                              title="Urutkan berdasarkan Volume Resep"
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <span>Volume Resep</span>
                                <span className="text-[9px] text-sky-400">
                                  {doctorSortField === "recipes" ? (doctorSortDirection === "asc" ? "▲" : "▼") : "↕"}
                                </span>
                              </div>
                            </th>
                            <th
                              className="px-4 py-3 text-right cursor-pointer hover:bg-white/5 transition-colors"
                              onClick={() => handleDoctorSort("revenue")}
                              title="Urutkan berdasarkan Total Omzet"
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <span>Total Omzet</span>
                                <span className="text-[9px] text-sky-400">
                                  {doctorSortField === "revenue" ? (doctorSortDirection === "asc" ? "▲" : "▼") : "↕"}
                                </span>
                              </div>
                            </th>
                            <th
                              className="px-4 py-3 text-right cursor-pointer hover:bg-white/5 transition-colors"
                              onClick={() => handleDoctorSort("avg_per_recipe")}
                              title="Urutkan berdasarkan Rata-rata per Resep"
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <span>Rata-rata / Resep</span>
                                <span className="text-[9px] text-sky-400">
                                  {doctorSortField === "avg_per_recipe" ? (doctorSortDirection === "asc" ? "▲" : "▼") : "↕"}
                                </span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {paginatedDoctors.length > 0 ? (
                            paginatedDoctors.map((d) => {
                              const rowBg = !d.code
                                ? "bg-amber-500/3"
                                : isInvalidDoctorCode(d.code)
                                  ? "bg-yellow-500/3"
                                  : "";
                              return (
                                <tr key={d.code || "__unregistered__"} className={`hover:bg-white/1 transition-colors ${rowBg}`}>
                                  <td className="px-4 py-3 font-mono font-semibold text-white">
                                    {!d.code ? (
                                      /* No code at all — Tidak Terdaftar */
                                      <span className="relative group inline-flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                                          <AlertTriangle className="h-3 w-3" />
                                          Tidak Terdaftar
                                        </span>
                                        <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 z-20 w-56 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#0d1426] border border-amber-500/25 rounded-xl p-3 text-[10px] text-slate-300 leading-relaxed shadow-2xl">
                                          <span className="font-semibold text-amber-400 block mb-1">⚠ Catatan Data</span>
                                          Resep ini tidak memiliki kode dokter yang valid dalam sistem. Kemungkinan berasal dari pembelian bebas (OTC) atau data input yang tidak lengkap.
                                        </span>
                                      </span>
                                    ) : isInvalidDoctorCode(d.code) ? (
                                      /* Code exists but doesn't match the 3-digit numeric format */
                                      <span className="relative group inline-flex items-center gap-2">
                                        <span className="font-mono text-slate-400 text-[10px]">{d.code}</span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-semibold">
                                          <AlertTriangle className="h-3 w-3" />
                                          Kode Tidak Valid
                                        </span>
                                        <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 z-20 w-60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#0d1426] border border-yellow-500/25 rounded-xl p-3 text-[10px] text-slate-300 leading-relaxed shadow-2xl">
                                          <span className="font-semibold text-yellow-400 block mb-1">⚠ Kode Tidak Dikenali</span>
                                          Kode <span className="font-mono text-yellow-300">{d.code}</span> tidak sesuai format kode dokter standar (3 digit angka). Kemungkinan kode internal sistem atau nomor registrasi yang salah input.
                                        </span>
                                      </span>
                                    ) : (
                                      /* Valid doctor code */
                                      d.code
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold">{formatNum(d.recipes)}</td>
                                  <td className="px-4 py-3 text-right text-sky-400">{formatIDR(d.revenue)}</td>
                                  <td className="px-4 py-3 text-right text-emerald-400">{formatIDR(d.avg_per_recipe)}</td>
                                </tr>
                              );
                            })

                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                                Tidak ada data dokter yang sesuai.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {totalDocPages > 1 && (
                        <div className="bg-slate-950/20 border-t border-white/5 px-4 py-3 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            Menampilkan <b>{doctorList.length}</b> dokter
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setDocPage((p) => Math.max(1, p - 1))}
                              disabled={docPage === 1}
                              className="px-2 py-0.5 text-[10px] font-semibold border border-white/10 rounded-md bg-slate-900 text-slate-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                            >
                              Prev
                            </button>
                            <span className="text-[10px] text-slate-400">
                              Halaman {docPage}/{totalDocPages}
                            </span>
                            <button
                              onClick={() => setDocPage((p) => Math.min(totalDocPages, p + 1))}
                              disabled={docPage === totalDocPages}
                              className="px-2 py-0.5 text-[10px] font-semibold border border-white/10 rounded-md bg-slate-900 text-slate-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Data Quality Note */}
                    <div className="mt-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[10px] leading-relaxed text-slate-400 flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p>
                        <span className="font-semibold text-amber-400">Catatan Kualitas Data: </span>
                        Entri berlabel <span className="font-semibold text-amber-300">"Tidak Terdaftar"</span> tidak memiliki kode dokter sama sekali. Entri berlabel <span className="font-semibold text-yellow-300">"Kode Tidak Valid"</span> memiliki kode yang tidak sesuai format standar 3-digit (contoh: <span className="font-mono">DISP_IF</span>, <span className="font-mono">RL-11.2014-xx-0</span>) — kemungkinan kode internal sistem atau nomor SIP yang salah input. Semua data ini tetap dihitung dalam total omzet.
                      </p>
                    </div>
                  </div>

                  {/* Racik vs Non-Racik */}
                  <div className="glass-panel p-6 flex flex-col gap-6 justify-between">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold tracking-tight text-slate-200">Analisis Resep Racikan vs Siap Saji</h3>
                      <p className="text-xs text-slate-400">Perbandingan transaksi obat racikan (custom formula) vs obat non-racik</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {dashboardData.racik_vs_non_racik.map((item) => {
                        const isRacik = item.type === "Racikan";
                        return (
                          <div key={item.type} className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col gap-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border w-fit ${isRacik
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                              }`}>
                              {item.type}
                            </span>
                            <div className="flex flex-col mt-2">
                              <span className="text-[10px] text-slate-500">Volume Transaksi</span>
                              <span className="text-lg font-bold text-white">{formatNum(item.recipes)} Resep</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-500">Total Omzet</span>
                              <span className="text-sm font-semibold text-slate-200">{formatIDR(item.revenue)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-500">Rata-rata Nilai per Resep</span>
                              <span className="text-sm font-bold text-emerald-400">{formatIDR(item.avg_per_recipe)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs leading-relaxed text-slate-400 flex items-start gap-2.5">
                      <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
                      <p>
                        <b>Insight Penting:</b> Meskipun volume resep obat <b>Racikan</b> sangat kecil ({formatNum(dashboardData.racik_vs_non_racik.find(r => r.type === "Racikan")?.recipes || 0)} resep), nilai rata-rata per resepnya jauh lebih tinggi (<b>{formatIDR(dashboardData.racik_vs_non_racik.find(r => r.type === "Racikan")?.avg_per_recipe || 0)}</b>) dibandingkan obat Non-Racik (<b>{formatIDR(dashboardData.racik_vs_non_racik.find(r => r.type === "Non-Racikan")?.avg_per_recipe || 0)}</b>).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: OPERATIONS ─────────────────────────────────────────────── */}
            {activeTab === "operations" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Operational Timing Patterns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Peak Hours Chart */}
                  <div className="glass-panel p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold tracking-tight text-slate-200">Jam Sibuk Pelayanan Apotek</h3>
                      <p className="text-xs text-slate-400 leading-normal">
                        Pola transaksi berdasarkan jam operasional. Memuncak pada pagi (<b>09:00 - 11:00</b>) & sore (<b>16:00 - 19:00</b>).
                      </p>
                    </div>
                    <div className="h-112 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dashboardData.hourly_busy}
                          margin={{ top: 10, right: 10, left: 15, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                          <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickFormatter={(h) => `${h}:00`} />
                          <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => formatNum(v)} />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(13, 20, 38, 0.95)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "8px"
                            }}
                            itemStyle={{ color: "#cbd5e1" }}
                            labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                            formatter={(value: any) => [formatNum(value), "Jumlah Transaksi"]}
                          />
                          <Bar dataKey="recipes" radius={[3, 3, 0, 0]} minPointSize={6}>
                            {dashboardData.hourly_busy.map((entry, idx) => {
                              const val = entry.recipes;
                              const ratio = val / maxHourRecipes;
                              const opacity = 0.25 + 0.75 * ratio;
                              return (
                                <Cell
                                  key={`cell-${idx}`}
                                  fill="#0ea5e9"
                                  fillOpacity={opacity}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Peak Days Chart */}
                  <div className="glass-panel p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold tracking-tight text-slate-200">Hari Sibuk Penjualan</h3>
                      <p className="text-xs text-slate-400 leading-normal">
                        Distribusi transaksi per hari. Stabil di hari kerja, menurun wajar di akhir pekan (<b>Minggu</b>).
                      </p>
                    </div>
                    <div className="h-112 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dashboardData.weekly_busy}
                          margin={{ top: 10, right: 10, left: 15, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                          <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => formatNum(v)} />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(13, 20, 38, 0.95)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "8px"
                            }}
                            itemStyle={{ color: "#cbd5e1" }}
                            labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                            formatter={(value: any) => [formatNum(value), "Jumlah Transaksi"]}
                          />
                          <Bar dataKey="recipes" radius={[3, 3, 0, 0]} minPointSize={6}>
                            {dashboardData.weekly_busy.map((entry, idx) => {
                              const val = entry.recipes;
                              const ratio = val / maxDayRecipes;
                              const opacity = 0.25 + 0.75 * ratio;
                              return (
                                <Cell
                                  key={`cell-${idx}`}
                                  fill="#6366f1"
                                  fillOpacity={opacity}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: PIPELINE INTEGRITY ─────────────────────────────────────── */}
            {activeTab === "pipeline" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Raw Database Integrity Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Row Counts Table */}
                  <div className="glass-panel p-6 flex flex-col gap-4">
                    <h3 className="text-sm font-semibold tracking-tight text-slate-200">Volume Tabel Database</h3>
                    <p className="text-xs text-slate-400">Statistik jumlah baris data mentah saat diekstrak dari `sales.sql`</p>
                    <div className="flex flex-col gap-2 mt-2">
                      {[
                        { name: "ms_product", desc: "Master Kamus Obat", count: dashboardData.integrity.tabel_rows.ms_product },
                        { name: "ms_sales", desc: "Header Transaksi Resep", count: dashboardData.integrity.tabel_rows.ms_sales },
                        { name: "det_sales", desc: "Detail Item Transaksi", count: dashboardData.integrity.tabel_rows.det_sales },
                        { name: "transaction", desc: "Tabel Denormalisasi", count: dashboardData.integrity.tabel_rows.transaction }
                      ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-white/5">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-white font-mono">{item.name}</span>
                            <span className="text-[10px] text-slate-500">{item.desc}</span>
                          </div>
                          <span className="text-sm font-bold text-sky-400 font-mono">{formatNum(item.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Integrity Audit Check Table */}
                  <div className="glass-panel p-6 flex flex-col gap-4">
                    <h3 className="text-sm font-semibold tracking-tight text-slate-200">Audit Integritas Data</h3>
                    <p className="text-xs text-slate-400">Temuan anomali dan relasi antartabel yang bermasalah</p>
                    <div className="flex flex-col gap-2 mt-2">
                      {[
                        { name: "Orphan Resep (det_sales)", desc: "Detail item tanpa header resep", value: dashboardData.integrity.integritas.orphan_resep_det_sales, type: "warn" },
                        { name: "Orphan Resep (ms_sales)", desc: "Header resep tanpa detail item", value: dashboardData.integrity.integritas.orphan_resep_ms_sales, type: "ok" },
                        { name: "Orphan KD_OBAT (det_sales)", desc: "Kode obat terjual tidak terdaftar", value: dashboardData.integrity.integritas.orphan_kd_obat_det_sales, type: "ok" },
                        { name: "Transaksi Retur (det_sales)", desc: "Transaksi pembatalan (QTY negatif)", value: dashboardData.integrity.anomali.qty_negatif_det_sales, type: "info" }
                      ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-white/5">
                          <div className="flex flex-col flex-1 pr-4">
                            <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                            <span className="text-[10px] text-slate-500 leading-normal">{item.desc}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${item.value > 0
                              ? item.type === "warn"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}>
                              {formatNum(item.value)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ETL Clean Flow Explanation */}
                  <div className="glass-panel p-6 flex flex-col gap-4 justify-between">
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-slate-200">Resolusi Pembersihan Pipeline</h3>
                      <p className="text-xs text-slate-400">Bagaimana anomali ditangani sebelum visualisasi dashboard</p>
                    </div>

                    <div className="flex flex-col gap-3 text-xs text-slate-400 mt-2">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                        <p>
                          <b>Flagging Orphan:</b> Baris detail tanpa header ditandai dengan flag <code>is_orphan = True</code>. Data ini dipisahkan agar tidak merusak agregasi tanggal penjualan.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                        <p>
                          <b>Flagging Retur:</b> Pembelian bernilai QTY negatif ditandai dengan flag <code>is_return = True</code>. Data ini dikecualikan pada tren omzet normal agar tidak bias.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                        <p>
                          <b>Single Source of Truth:</b> Data disatukan ke dalam file <code>sales_clean.parquet</code>, menjamin konsistensi angka dan efisiensi query.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center gap-2 mt-4">
                      <Cpu className="h-5 w-5 text-sky-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500">Pipeline Ingestion Size</span>
                        <span className="text-xs font-bold text-white">67.3 MB → 12.7 MB Parquet</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Flow Diagram Card */}
                <div className="glass-panel p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-slate-200">Bagan Alur Ingesti & Pembersihan Data (ETL)</h3>
                    <p className="text-xs text-slate-400">Gambaran pemrosesan data dari file mentah SQL hingga ke visualisasi dashboard</p>
                  </div>

                  {/* SVG Flowchart */}
                  <div className="bg-slate-950/30 p-6 rounded-xl border border-white/5 flex flex-col md:flex-row items-center justify-around gap-6">
                    <div className="flex flex-col items-center p-4 rounded-xl bg-slate-900 border border-white/5 w-40 text-center shadow-md">
                      <Database className="h-8 w-8 text-sky-400 mb-2" />
                      <span className="text-xs font-bold text-white">sales.sql</span>
                      <span className="text-[9px] text-slate-500 mt-1">MySQL/MariaDB Dump<br />(70.6 MB)</span>
                    </div>

                    <div className="text-slate-600 font-bold text-xl md:rotate-0 rotate-90">→</div>

                    <div className="flex flex-col items-center p-4 rounded-xl bg-slate-900 border border-indigo-500/20 w-44 text-center shadow-md">
                      <Cpu className="h-8 w-8 text-indigo-400 mb-2" />
                      <span className="text-xs font-bold text-white">Data Pipeline</span>
                      <span className="text-[9px] text-slate-400 mt-1">Jupyter Notebook Parser<br />Type Cast & Join Tables</span>
                    </div>

                    <div className="text-slate-600 font-bold text-xl md:rotate-0 rotate-90">→</div>

                    <div className="flex flex-col items-center p-4 rounded-xl bg-slate-900 border border-emerald-500/20 w-44 text-center shadow-md">
                      <ShieldCheck className="h-8 w-8 text-emerald-400 mb-2" />
                      <span className="text-xs font-bold text-white">sales_clean.parquet</span>
                      <span className="text-[9px] text-slate-400 mt-1">Clean Columns<br />Flag Orphan & Return<br />(12.7 MB)</span>
                    </div>

                    <div className="text-slate-600 font-bold text-xl md:rotate-0 rotate-90">→</div>

                    <div className="flex flex-col items-center p-4 rounded-xl bg-linear-to-tr from-sky-950 to-indigo-950 border border-sky-500/30 w-44 text-center shadow-lg shadow-sky-500/5">
                      <Activity className="h-8 w-8 text-sky-400 mb-2 animate-pulse" />
                      <span className="text-xs font-bold text-white">Next.js App</span>
                      <span className="text-[9px] text-sky-300 mt-1">Aggregated JSON<br />Interactive Filtering<br />Client-side Dashboard</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-white/5 py-4 px-6 bg-[#090d1a]/50 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Apotek Care Portfolio Dashboard. All Rights Reserved.</p>
        <p className="flex items-center gap-1">
          Built with <span className="text-sky-400">Next.js App Router</span> & <span className="text-indigo-400">Recharts</span>
        </p>
      </footer>
    </div>
  );
}
