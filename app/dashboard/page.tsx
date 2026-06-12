"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

interface DashboardStats {
  total_products: number;
  total_categories: number;
  total_suppliers: number;
  total_sales: string | number;
  today_sales: string | number;
  low_stock_products: number;
  cancelled_sales: number;
}

interface SalesTrend {
  date: string;
  revenue: string | number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadDashboard() {
      try {
        const [statsRes, trendRes] = await Promise.all([
          fetch(`${API_URL}/dashboard`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
          fetch(`${API_URL}/dashboard/sales-trend`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
        ]);

        if (!statsRes.ok) throw new Error("Dashboard API error");

        setStats(await statsRes.json());

        if (trendRes.ok) {
          const trendData = await trendRes.json();

          setSalesTrend(
            trendData.map((item: SalesTrend) => ({
              ...item,
              revenue: Number(item.revenue),
            })),
          );
        }
      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [token, router]);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;

    fetch(`${API_URL}/dashboard/recent-activity`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setRecentActivity);
  }, [token, user]);

  if (!user || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-500 animate-pulse font-medium">
          Loading hardware matrix...
        </p>
      </div>
    );
  }

  const formatCurrency = (val: string | number | undefined) => {
    const numericValue = parseFloat(val as string) || 0;

    return `KES ${numericValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const cardsData = [
    {
      title: "Total Products",
      value: stats?.total_products ?? 0,
      icon: Package,
      color: "text-blue-600",
      subtitle: `Across ${stats?.total_categories ?? 0} categories`,
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(stats?.today_sales),
      icon: CalendarDays,
      color: "text-amber-500",
      subtitle: "Aggregated since midnight",
    },
    {
      title: "Total Revenue Gross",
      value: formatCurrency(stats?.total_sales),
      icon: ShoppingCart,
      color: "text-emerald-600",
      subtitle: "Completed sales only",
    },
    {
      title: "Active Suppliers",
      value: stats?.total_suppliers ?? 0,
      icon: Users,
      color: "text-violet-600",
      subtitle: "Registered distribution channels",
    },
    {
      title: "Cancelled Sales",
      value: stats?.cancelled_sales ?? 0,
      icon: AlertTriangle,
      color: "text-red-600",
      subtitle: "Voided transactions",
    },
  ];

  const lowStockCount = stats?.low_stock_products ?? 0;

  const inventoryChartData = [
    { name: "Products", value: stats?.total_products ?? 0 },
    { name: "Categories", value: stats?.total_categories ?? 0 },
    { name: "Suppliers", value: stats?.total_suppliers ?? 0 },
    { name: "Low Stock", value: stats?.low_stock_products ?? 0 },
    { name: "Cancelled Sales", value: stats?.cancelled_sales ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Inventory Overview
          </h1>

          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mt-1">
            Admin Profile:{" "}
            <span className="font-bold text-slate-700 normal-case">
              {user.name}
            </span>
          </p>
        </div>

        {lowStockCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 shadow-sm animate-pulse">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>
              Attention: {lowStockCount} Depleted SKUs Need Replenishment
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {cardsData.map((card, idx) => (
          <Card
            key={idx}
            className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-500">
                {card.title}
              </CardTitle>

              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-black tracking-tight text-slate-900">
                {card.value}
              </div>

              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Revenue Trend Last 7 Days
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => `KES ${Number(value).toLocaleString()}`}
                />
                <Line type="monotone" dataKey="revenue" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Inventory Summary
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {user?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {recentActivity.map((log: any) => (
                <div key={log.id} className="border-b pb-3 last:border-0">
                  <p className="text-sm font-semibold">{log.description}</p>

                  <p className="text-xs text-slate-500">
                    {log.user?.name || "System"} •{" "}
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
