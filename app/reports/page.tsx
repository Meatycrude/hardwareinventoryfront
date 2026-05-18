"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Download,
  Loader2,
  Package,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  brand: string;
  buying_price: string | number;
  selling_price: string | number;
}

interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
  product?: Product;
}

interface Sale {
  id: number;
  invoice_number: string;
  payment_method: string;
  total_amount: string | number;
  created_at: string;
  items: SaleItem[];
}

interface StockMovement {
  id: number;
  product_id: number;
  movement_type: string;
  quantity: number;
  created_at: string;
}

export default function ReportsManager() {
  const router = useRouter();
  const { token } = useAuth();

  // Primary state pools
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Operational filters
  const [timeFrame, setTimeFrame] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [reportType, setReportType] = useState<
    "revenue" | "inventory" | "audits"
  >("revenue");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadReportingDatabase() {
      try {
        const [resSales, resProducts, resMovements] = await Promise.all([
          fetch("http://localhost:8000/api/sales", {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
          fetch("http://localhost:8000/api/products", {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
          fetch("http://localhost:8000/api/stock-movements", {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
        ]);

        if (!resSales.ok || !resProducts.ok || !resMovements.ok) {
          throw new Error(
            "Pipeline data matching rejection on controller layer.",
          );
        }

        setSales(await resSales.json());
        setProducts(await resProducts.json());
        setMovements(await resMovements.json());
      } catch (err) {
        setError(
          "Failed to stream analytical vectors from your local dev engine database.",
        );
      } finally {
        setLoading(false);
      }
    }
    loadReportingDatabase();
  }, [token, router]);

  // Client-side timeline parser utility filter
  const filterByTimeframe = <T extends { created_at: string }>(
    items: T[],
  ): T[] => {
    const now = new Date();
    return items.filter((item) => {
      const itemDate = new Date(item.created_at);
      if (timeFrame === "today") {
        return itemDate.toDateString() === now.toDateString();
      }
      if (timeFrame === "week") {
        const diffTime = Math.abs(now.getTime() - itemDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (timeFrame === "month") {
        return (
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );
      }
      return true; // "all"
    });
  };

  const filteredSales = filterByTimeframe(sales);
  const filteredMovements = filterByTimeframe(movements);

  // Business logic compiler equations
  const computeFinancials = () => {
    let totalGross = 0;
    let totalCost = 0;

    filteredSales.forEach((sale) => {
      totalGross += parseFloat(sale.total_amount as string) || 0;
      sale.items?.forEach((item) => {
        const prod = products.find((p) => p.id === item.product_id);
        const costPrice = prod ? parseFloat(prod.buying_price as string) : 0;
        totalCost += costPrice * item.quantity;
      });
    });

    const netProfit = totalGross - totalCost;
    const profitMargin = totalGross > 0 ? (netProfit / totalGross) * 100 : 0;

    return { totalGross, netProfit, profitMargin };
  };

  const financials = computeFinancials();

  // Top fast-moving catalog rows extractor logic
  const getTopSellingProducts = () => {
    const productQuantities: Record<number, number> = {};
    filteredSales.forEach((sale) => {
      sale.items?.forEach((item) => {
        productQuantities[item.product_id] =
          (productQuantities[item.product_id] || 0) + item.quantity;
      });
    });

    return Object.entries(productQuantities)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === parseInt(id, 10));
        return {
          name: product?.name || `Variant Reference ID: ${id}`,
          brand: product?.brand || "Generic",
          unitsSold: qty,
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5); // Pick top 5 rows
  };

  const topProducts = getTopSellingProducts();

  // Universal structural CSV file parsing trigger engine
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (reportType === "revenue") {
      csvContent +=
        "Invoice Number,Timestamp,Payment Method,Gross Total Amount (KES)\n";
      filteredSales.forEach((s) => {
        csvContent += `${s.invoice_number},"${new Date(s.created_at).toLocaleString()}",${s.payment_method},${s.total_amount}\n`;
      });
    } else if (reportType === "inventory") {
      csvContent +=
        "Product Name,Brand,Current stock Level,Buying Price (KES),Selling Price (KES)\n";
      products.forEach((p) => {
        csvContent += `"${p.name}","${p.brand}",${p.buying_price},${p.selling_price}\n`;
      });
    } else {
      csvContent +=
        "Log ID,Product ID,Movement Class,Units Volume delta,Timestamp\n";
      filteredMovements.forEach((m) => {
        csvContent += `#MV-${m.id},${m.product_id},${m.movement_type},${m.quantity},"${new Date(m.created_at).toLocaleString()}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${reportType}_report_export_${timeFrame}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="font-medium text-gray-600 text-sm">
            Synthesizing data ledgers...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center max-w-md shadow-sm">
          <p className="font-semibold text-red-700">Reporting Node Offline</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 font-sans antialiased">
      {/* Upper Navigation Row Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Reporting & <span className="text-emerald-600">Audits</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
            System performance statistics logs parameters
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none"
        >
          <Download className="h-4 w-4" />
          Export Dataset (.CSV)
        </button>
      </div>

      {/* Controller Parameters Filters Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        {/* Metric Module Type Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full">
          {(["revenue", "inventory", "audits"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
                reportType === type
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {type === "revenue" && "💰 Revenue Stream"}
              {type === "inventory" && "📦 Stock Level"}
              {type === "audits" && "📑 Audit Logs"}
            </button>
          ))}
        </div>

        {/* Time-interval Dropdown parameters selector wrapper */}
        <div className="relative flex items-center justify-end gap-2 text-xs font-bold">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-slate-400 uppercase tracking-wide">
            Reporting Frame:
          </span>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-emerald-500 font-semibold"
          >
            <option value="all">Display All-Time Data Summary</option>
            <option value="today">Today's Micro Ledger Operations</option>
            <option value="week">Rolling 7-Day Performance Matrix</option>
            <option value="month">Current Calendar Month Metrics</option>
          </select>
        </div>
      </div>

      {/* Conditionally Render Panel Block One: Revenue Financial Analytics */}
      {reportType === "revenue" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Financial Aggregation Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gross Sales Revenue
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-slate-900">
                  KES{" "}
                  {financials.totalGross.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Sum value of all generated invoice rows.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Net Ledger Margin
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-emerald-600">
                  KES{" "}
                  {financials.netProfit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Calculated as (Retail Selling - Vendor Cost).
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Gross Profit Percentage
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-blue-600">
                  {financials.profitMargin.toFixed(1)}%
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Average system markup conversion velocity.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Grid Splitting: Top Moving Items Index & Visual Progress Chart Map */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Top Products Lists Card */}
            <Card className="lg:col-span-3 border border-slate-200 shadow-sm bg-white">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Top Fast-Moving Catalog Rows
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {topProducts.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400 font-medium italic">
                    No sales transactions logged during this timeframe.
                  </p>
                ) : (
                  topProducts.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-4 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {p.name}
                        </div>
                        <div className="text-slate-400 font-semibold mt-0.5">
                          Brand Code: {p.brand}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2 py-1 rounded border border-emerald-100 font-mono text-sm">
                          {p.unitsSold} Units
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Visual Conversion Progress Chart Box Placeholder */}
            <Card className="lg:col-span-2 border border-slate-200 shadow-sm bg-white p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Target Efficiency Map
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  A graphical estimate of systemic margin health parameters.
                </p>
              </div>

              {/* Client CSS Progress Circle Frame */}
              <div className="my-4 flex items-center justify-center relative">
                <div className="h-28 w-28 rounded-full border-[10px] border-slate-100 border-t-emerald-600 flex items-center justify-center animate-in spin-in-12 duration-500">
                  <span className="font-black text-lg text-slate-800 tracking-tighter">
                    {financials.profitMargin.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[11px] text-slate-500 font-medium items-start">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Operational vectors fall cleanly within standard compliance
                  boundaries.
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Conditionally Render Panel Block Two: Inventory Levels Grid */}
      {reportType === "inventory" && (
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl animate-in fade-in duration-200">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">SKU Tag</th>
                  <th className="px-6 py-3.5">Hardware Title</th>
                  <th className="px-6 py-3.5 text-right">Physical Volume</th>
                  <th className="px-6 py-3.5 text-right">
                    Unit Investment Cost
                  </th>
                  <th className="px-6 py-3.5 text-right">
                    Gross Asset Appraisal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => {
                  const assetValue =
                    p.stock_quantity * parseFloat(p.buying_price as string);
                  return (
                    <tr
                      key={p.id}
                      className="transition hover:bg-slate-50/40 font-medium text-xs"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">
                        {p.sku || `PROD-#00${p.id}`}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                        {p.name}{" "}
                        <span className="text-xs text-slate-400 font-normal">
                          [{p.brand}]
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">
                        {p.stock_quantity} {p.unit}
                      </td>
                      <td className="px-6 py-4 text-right">
                        KES {Number(p.buying_price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        KES{" "}
                        {assetValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Conditionally Render Panel Block Three: Stock Movement Logs Grid */}
      {reportType === "audits" && (
        <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl animate-in fade-in duration-200">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Log Reference ID</th>
                  <th className="px-6 py-3.5">Target SKU ID</th>
                  <th className="px-6 py-3.5 text-center">Operation Type</th>
                  <th className="px-6 py-3.5 text-right">Delta Units Volume</th>
                  <th className="px-6 py-3.5 text-right">System Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMovements.map((m) => {
                  const isOut = m.quantity < 0;
                  return (
                    <tr
                      key={m.id}
                      className="transition hover:bg-slate-50/40 font-medium text-xs"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">
                        #MV-{String(m.id).padStart(4, "0")}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        PRODUCT_ID: {m.product_id}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                            m.movement_type === "sale"
                              ? "bg-amber-50 border-amber-100 text-amber-700"
                              : "bg-emerald-50 border-emerald-100 text-emerald-700"
                          }`}
                        >
                          {m.movement_type === "sale" ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {m.movement_type}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold ${isOut ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        {isOut ? "" : "+"}
                        {m.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
