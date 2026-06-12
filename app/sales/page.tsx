"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ShoppingCart,
  Loader2,
  ArrowRight,
  Receipt,
  Ban,
  Plus,
  CreditCard,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Product {
  id: number;
  name: string;
  brand: string;
  selling_price: string | number;
  stock_quantity: number;
}

interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: string | number;
  total_price: string | number;
  product?: Product;
}

interface Sale {
  id: number;
  invoice_no?: string;
  invoice_number?: string;
  payment_method: string;
  total_amount: string | number;
  created_at: string;
  status: "completed" | "cancelled";
  cancelled_at?: string | null;
  items: SaleItem[];
}

interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  max_stock: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SalesManager() {
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  function getToken() {
    return localStorage.getItem("token");
  }

  useEffect(() => {
    async function loadInitialData() {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [resSales, resProducts] = await Promise.all([
          fetch(`${API_URL}/sales`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
          fetch(`${API_URL}/products`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }),
        ]);

        if (resSales.status === 401 || resProducts.status === 401) {
          router.push("/login");
          return;
        }

        if (resSales.ok) setSales(await resSales.json());
        if (resProducts.ok) setProducts(await resProducts.json());
      } catch {
        setError("Failed to connect to Laravel backend.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [router]);

  const computeMetrics = () => {
    const now = new Date();
    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    let absoluteTotal = 0;

    sales
      .filter((sale) => sale.status !== "cancelled")
      .forEach((sale) => {
        const saleDate = new Date(sale.created_at);
        const amount = Number(sale.total_amount) || 0;

        absoluteTotal += amount;

        const diffTime = Math.abs(now.getTime() - saleDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (saleDate.toDateString() === now.toDateString()) daily += amount;
        if (diffDays <= 7) weekly += amount;

        if (
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        ) {
          monthly += amount;
        }
      });

    return { daily, weekly, monthly, absoluteTotal };
  };

  const metrics = computeMetrics();

  const filteredProductOptions = products.filter((p) => {
    const query = productSearchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      p.name?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query)
    );
  });

  const filteredSalesLedger = sales.filter((sale) => {
    const query = ledgerSearchQuery.toLowerCase().trim();
    if (!query) return true;

    const inv = (sale.invoice_number || sale.invoice_no || "").toLowerCase();
    const pm = sale.payment_method?.toLowerCase();

    return inv.includes(query) || pm.includes(query);
  });

  function handleAddToOrder() {
    if (!selectedProductId) return;

    const product = products.find((p) => p.id === Number(selectedProductId));
    if (!product) return;

    if (selectedQuantity > product.stock_quantity) {
      alert(`Only ${product.stock_quantity} available.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);

      if (existing) {
        const newQty = existing.quantity + selectedQuantity;

        if (newQty > product.stock_quantity) {
          alert("Combined quantity exceeds available stock.");
          return prev;
        }

        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: newQty } : item,
        );
      }

      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          quantity: selectedQuantity,
          price: Number(product.selling_price),
          max_stock: product.stock_quantity,
        },
      ];
    });

    setSelectedProductId("");
    setProductSearchQuery("");
    setSelectedQuantity(1);
  }

  function handleRemoveFromCart(productId: number) {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  async function handleCreateSale(e: React.FormEvent) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Please add at least one item.");
      return;
    }

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const payload = {
      payment_method: paymentMethod,
      items: cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error ||
            errData.message ||
            "Validation error processing invoice.",
        );
      }

      const freshInvoice = await response.json();

      setSales((prev) => [freshInvoice, ...prev]);
      setCart([]);
      setIsModalOpen(false);

      router.push(`/sales/${freshInvoice.id}/receipt`);
    } catch (err: any) {
      alert(`Transaction Denied: ${err.message}`);
    }
  }

  async function handleVoidSale(saleId: number) {
    const confirmed = confirm("Are you sure you want to cancel this sale?");
    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/sales/${saleId}/void`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel sale");
      }

      setSales((prev) =>
        prev.map((sale) => (sale.id === saleId ? data : sale)),
      );

      alert("Sale cancelled successfully.");
    } catch (error: any) {
      alert(error.message);
    }
  }

  function formatMoney(value: number | string) {
    return `KES ${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Syncing sales records...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="font-bold text-red-700">Connection Error</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
              Sales Terminal
            </Badge>

            <h1 className="text-3xl font-black tracking-tight">
              Sales & Revenue
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage checkout transactions, receipts, and cancelled sales.
            </p>
          </div>

          <Button
            onClick={() => {
              setProductSearchQuery("");
              setSelectedProductId("");
              setIsModalOpen(true);
            }}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Order Checkout
          </Button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Daily Revenue", metrics.daily],
            ["Weekly Revenue", metrics.weekly],
            ["Monthly Revenue", metrics.monthly],
            ["Gross Revenue", metrics.absoluteTotal],
          ].map(([label, value]) => (
            <Card key={label as string} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {label}
                </p>

                <p className="mt-2 text-2xl font-black">
                  {formatMoney(Number(value))}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <Input
                placeholder="Search by invoice or payment method..."
                value={ledgerSearchQuery}
                onChange={(e) => setLedgerSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="border-b bg-white">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-emerald-700" />
              Sales Ledger
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-black">Invoice</th>
                    <th className="px-6 py-4 font-black">Date</th>
                    <th className="px-6 py-4 font-black">Payment</th>
                    <th className="px-6 py-4 font-black">Items</th>
                    <th className="px-6 py-4 font-black">Status</th>
                    <th className="px-6 py-4 text-right font-black">Total</th>
                    <th className="px-6 py-4 text-right font-black">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSalesLedger.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                      >
                        No sales records found.
                      </td>
                    </tr>
                  ) : (
                    filteredSalesLedger.map((sale) => (
                      <tr
                        key={sale.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-mono text-xs font-black text-emerald-700">
                          {sale.invoice_number ||
                            sale.invoice_no ||
                            `INV-${sale.id}`}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                          {new Date(sale.created_at).toLocaleString()}
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant="outline" className="uppercase">
                            {sale.payment_method}
                          </Badge>
                        </td>

                        <td className="max-w-sm px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {sale.items?.map((item) => (
                              <span
                                key={item.id}
                                className="rounded-full border bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600"
                              >
                                {item.product?.name ||
                                  `Product ID: ${item.product_id}`}{" "}
                                ×{item.quantity}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {sale.status === "cancelled" ? (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                              Cancelled
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              Completed
                            </Badge>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right font-black">
                          {formatMoney(sale.total_amount)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/sales/${sale.id}/receipt`)
                              }
                            >
                              <Receipt className="mr-1 h-3 w-3" />
                              Receipt
                            </Button>

                            {sale.status !== "cancelled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVoidSale(sale.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Ban className="mr-1 h-3 w-3" />
                                Void
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <Card className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border-0 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle>New Checkout Transaction</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Select products, confirm payment method, and complete sale.
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-5">
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  1. Locate Product
                </h3>

                <Input
                  placeholder="Search product..."
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    setSelectedProductId("");
                  }}
                />

                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  size={7}
                  className="w-full rounded-xl border bg-white p-2 text-xs outline-none focus:border-emerald-500"
                >
                  {filteredProductOptions.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={p.stock_quantity <= 0}
                    >
                      {p.name} [{p.brand || "Generic"}] -{" "}
                      {formatMoney(p.selling_price)} ({p.stock_quantity} left)
                    </option>
                  ))}
                </select>

                <Input
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={(e) =>
                    setSelectedQuantity(Number(e.target.value) || 1)
                  }
                />

                <Button
                  type="button"
                  onClick={handleAddToOrder}
                  disabled={!selectedProductId}
                  className="w-full bg-emerald-700 hover:bg-emerald-800"
                >
                  Add To Cart <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <form
                onSubmit={handleCreateSale}
                className="flex flex-col space-y-4 md:col-span-3"
              >
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  2. Cart Manifest
                </h3>

                <div className="min-h-[230px] rounded-2xl border bg-slate-50">
                  {cart.length === 0 ? (
                    <div className="flex h-full min-h-[230px] flex-col items-center justify-center text-slate-400">
                      <ShoppingCart className="mb-2 h-8 w-8" />
                      <p className="text-sm font-medium">Cart is empty.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {cart.map((item) => (
                        <div
                          key={item.product_id}
                          className="flex items-center justify-between bg-white p-4 text-sm"
                        >
                          <div>
                            <p className="font-bold">{item.name}</p>
                            <p className="text-xs text-slate-500">
                              {item.quantity} × {formatMoney(item.price)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <p className="font-black">
                              {formatMoney(item.price * item.quantity)}
                            </p>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemoveFromCart(item.product_id)
                              }
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile">M-Pesa</option>
                    <option value="bank">Bank</option>
                  </select>

                  <div className="rounded-xl border bg-slate-50 p-3 text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Grand Total
                    </p>
                    <p className="text-xl font-black text-emerald-700">
                      {formatMoney(cartTotal)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Close
                  </Button>

                  <Button
                    type="submit"
                    disabled={cart.length === 0}
                    className="bg-emerald-700 hover:bg-emerald-800"
                  >
                    Complete Sale
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
