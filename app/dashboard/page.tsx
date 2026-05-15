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

interface DashboardStats {
  total_products: number;
  total_categories: number;
  total_suppliers: number;
  total_sales: string | number;
  today_sales: string | number;
  low_stock_products: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      console.log(token);

      router.push("/login");
      return;
    }

    fetch("http://localhost:8000/api/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("API infrastructure response error.");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load statistics:", err);
        setLoading(false);
      });
  }, [token, router]);

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
      subtitle: "All-time ledger balance",
    },
    {
      title: "Active Suppliers",
      value: stats?.total_suppliers ?? 0,
      icon: Users,
      color: "text-violet-600",
      subtitle: "Registered distribution channels",
    },
  ];

  const lowStockCount = stats?.low_stock_products ?? 0;

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-4 border border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Quick Inventory Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg m-4 bg-slate-50/50">
            <p className="text-slate-400 text-sm italic font-medium">
              Main chart visualization placeholder
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
