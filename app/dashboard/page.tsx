"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, AlertTriangle } from "lucide-react";

interface DashboardStats {
  total_products: number;
  total_categories: number;
  total_suppliers: number;
  total_sales_amount: number;
  low_stock_alerts: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch live inventory data from your Laravel Backend
    fetch("127.0.0", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
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
        <p className="text-slate-500 animate-pulse font-medium">Loading hardware matrix...</p>
      </div>
    );
  }

  const cardsData = [
    { title: "Total Products", value: stats?.total_products ?? 0, icon: Package, color: "text-blue-600" },
    { title: "Total Revenue", value: `KES ${(stats?.total_sales_amount ?? 0).toLocaleString()}`, icon: ShoppingCart, color: "text-emerald-600" },
    { title: "Active Suppliers", value: stats?.total_suppliers ?? 0, icon: Users, color: "text-violet-600" },
    { title: "Low Stock Items", value: stats?.low_stock_alerts ?? 0, icon: AlertTriangle, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inventory Overview</h1>
        <p className="text-slate-500 mt-1">Logged in as: <span className="font-semibold text-slate-700">{user.name}</span></p>
      </div>

      {/* Responsive Metrics Grid Matrix */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cardsData.map((card, idx) => (
          <Card key={idx} className="border border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Mock Container layout */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-4 border border-slate-100 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Quick Inventory Tools</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg m-4">
            <p className="text-slate-400 text-sm">Main chart visualization placeholder</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
