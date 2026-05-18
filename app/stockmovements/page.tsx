"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  X,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  Loader2,
  Package,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  brand: string;
}

interface StockMovement {
  id: number;
  product_id: number;
  movement_type: "sale" | "purchase" | "adjustment" | string;
  quantity: number;
  created_at: string;
  product?: Product; // Eager loaded helper property relation
}

export default function StockMovementsManager() {
  const router = useRouter();
  const { token } = useAuth();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and view state modules
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductIdFilter, setSelectedProductIdFilter] = useState("all");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    loadInitialData();
  }, [token, router]);

  // Handle data fetching dynamically based on selected product dropdown constraints
  const loadInitialData = async (targetProductId?: string) => {
    setLoading(true);
    setError(null);
    try {
      // Toggle backend routes dynamically between global index() and productMovements($id)
      const movementsUrl =
        targetProductId && targetProductId !== "all"
          ? `http://localhost:8000/api/stock-movements/product/${targetProductId}`
          : "http://localhost:8000/api/stock-movements";

      const [resMovements, resProducts] = await Promise.all([
        fetch(movementsUrl, {
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
      ]);

      if (!resMovements.ok || !resProducts.ok)
        throw new Error("Server rejected registry arrays fetch request.");

      const rawMovementsData = await resMovements.json();
      const rawProductsData = await resProducts.json();

      setProducts(rawProductsData);

      // Local client-side relationship binding fallback if Laravel controller does not execute with() eager loading queries
      const mappedMovements = rawMovementsData.map(
        (movement: StockMovement) => {
          const productObj = rawProductsData.find(
            (p: Product) => p.id === movement.product_id,
          );
          return { ...movement, product: movement.product || productObj };
        },
      );

      setMovements(mappedMovements);
    } catch (err) {
      setError(
        "Failed to stream configuration tracking matrices from your backend API.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProductFilterChange = (productId: string) => {
    setSelectedProductIdFilter(productId);
    loadInitialData(productId);
  };

  // Client-Side Multi-column Search Optimization Filter Engine
  const filteredMovements = movements.filter((mv) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const matchesType = mv.movement_type?.toLowerCase().includes(query);
    const matchesQuantity = String(mv.quantity).includes(query);
    const matchesProductName = mv.product?.name?.toLowerCase().includes(query);
    const matchesProductBrand = mv.product?.brand
      ?.toLowerCase()
      .includes(query);

    return (
      matchesType ||
      matchesQuantity ||
      matchesProductName ||
      matchesProductBrand
    );
  });

  if (loading && movements.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="font-medium text-gray-600 text-sm">
            Syncing stock ledger tracking streams...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm max-w-md">
          <p className="font-semibold text-red-700">Connection Error</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            onClick={() => loadInitialData(selectedProductIdFilter)}
            className="mt-4 text-xs font-bold text-emerald-600 hover:underline bg-white border border-emerald-200 px-3 py-1.5 rounded-lg"
          >
            Retry Connection Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper Navigation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Stock Movements
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
            Warehouse Audit Log Operations Pipeline
          </p>
        </div>

        <button
          onClick={() => loadInitialData(selectedProductIdFilter)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none"
        >
          <RefreshCcw
            className={`h-4 w-4 ${loading ? "animate-spin text-emerald-600" : ""}`}
          />
          Refresh Registry Logs
        </button>
      </div>

      {/* Controller Filters and Toolbars Matrix Container */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        {/* Dynamic Search Box Input Component */}
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search log items by item name, adjustment type, or brand properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Product Isolated Endpoint Selector Dropdown */}
        <div className="relative">
          <select
            value={selectedProductIdFilter}
            onChange={(e) => handleProductFilterChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none font-medium transition focus:border-emerald-500"
          >
            <option value="all">📁 View Global Actions Logs</option>
            {products.map((prod) => (
              <option key={prod.id} value={prod.id}>
                📦 {prod.name} [{prod.brand || "Generic"}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Database Logs Grid Table */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Historical Ledger Registry
            </CardTitle>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Live chronological inventory metrics captured straight from your
              relational stock tables.
            </p>
          </div>
          <div className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 text-slate-500 border border-slate-200 rounded-lg">
            Matches: {filteredMovements.length} / {movements.length}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 w-16">Log Reference ID</th>
                  <th className="px-6 py-3.5">Target Inventory Variant</th>
                  <th className="px-6 py-3.5 text-center">
                    Movement Operation Type
                  </th>
                  <th className="px-6 py-3.5 text-right">
                    Transacted Units Volume
                  </th>
                  <th className="px-6 py-3.5 text-right">System Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center font-medium text-slate-400 bg-slate-50/20 italic"
                    >
                      No stock movement audit records match your operational
                      matrix filter parameters.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((movement) => {
                    // Check if quantity is incoming (+) or outgoing (-) to apply beautiful contextual alert highlights
                    const isReduction = movement.quantity < 0;
                    const cleanTypeString = movement.movement_type
                      ?.toLowerCase()
                      .trim();

                    return (
                      <tr
                        key={movement.id}
                        className="transition hover:bg-slate-50/40"
                      >
                        {/* Reference Key ID */}
                        <td className="px-6 py-4 font-mono text-xs text-slate-400 font-bold">
                          #MV-{String(movement.id).padStart(4, "0")}
                        </td>

                        {/* Product Meta Link Info */}
                        <td className="px-6 py-4">
                          {movement.product ? (
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {movement.product.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                Brand: {movement.product.brand || "Generic"}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400 font-medium italic text-xs">
                              <Package className="h-3 w-3" /> SKU ID Reference:{" "}
                              {movement.product_id}
                            </div>
                          )}
                        </td>

                        {/* Movement Operation Badge Component Type */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border shadow-sm ${
                              cleanTypeString === "sale"
                                ? "bg-amber-50 border-amber-100 text-amber-700"
                                : cleanTypeString === "purchase"
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                  : "bg-blue-50 border-blue-100 text-blue-700"
                            }`}
                          >
                            {cleanTypeString === "sale" && (
                              <ArrowDownLeft className="h-3 w-3 text-amber-600" />
                            )}
                            {cleanTypeString === "purchase" && (
                              <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                            )}
                            {cleanTypeString !== "sale" &&
                              cleanTypeString !== "purchase" && (
                                <History className="h-3 w-3 text-blue-600" />
                              )}
                            {movement.movement_type}
                          </span>
                        </td>

                        {/* Quantity Metrics Indicators */}
                        <td
                          className={`px-6 py-4 text-right font-mono font-black text-sm ${isReduction ? "text-rose-600" : "text-emerald-600"}`}
                        >
                          {isReduction ? "" : "+"}
                          {movement.quantity.toLocaleString()}
                        </td>

                        {/* Automated Chronological Timestamps */}
                        <td className="px-6 py-4 text-right text-xs text-slate-500 whitespace-nowrap font-medium">
                          {new Date(movement.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
