"use client";

import { useEffect, useState } from "react";
import { Search, X, Plus, ShoppingCart, CalendarDays, Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  items: SaleItem[];
}

interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  max_stock: number;
}

export default function SalesManager() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interface view states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Global Ledger Search State
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");

  // POS Checkout Modal Filter States
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [resSales, resProducts] = await Promise.all([
          fetch("http://localhost:8000/api/sales"),
          fetch("http://localhost:8000/api/products"),
        ]);

        if (resSales.ok) setSales(await resSales.json());
        if (resProducts.ok) setProducts(await resProducts.json());
      } catch (err) {
        setError("Failed to stream structure files from your Laravel backend local pipeline.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Compute aggregated timeline stats instantly on the client side
  const computeMetrics = () => {
    const now = new Date();
    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    let absoluteTotal = 0;

    sales.forEach((sale) => {
      const saleDate = new Date(sale.created_at);
      const amount = parseFloat(sale.total_amount as string) || 0;
      absoluteTotal += amount;

      const diffTime = Math.abs(now.getTime() - saleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (saleDate.toDateString() === now.toDateString()) {
        daily += amount;
      }
      if (diffDays <= 7) {
        weekly += amount;
      }
      if (saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()) {
        monthly += amount;
      }
    });

    return { daily, weekly, monthly, absoluteTotal };
  };

  const metrics = computeMetrics();

  // POS Filter: Filter product options dynamically as the clerk types inside the checkout window
  const filteredProductOptions = products.filter((p) => {
    const query = productSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return p.name?.toLowerCase().includes(query) || p.brand?.toLowerCase().includes(query);
  });

  // Main Dashboard Filter: Filter historical logs table by Invoice Number or Payment Method
  const filteredSalesLedger = sales.filter((sale) => {
    const query = ledgerSearchQuery.toLowerCase().trim();
    if (!query) return true;
    const inv = (sale.invoice_number || sale.invoice_no || "").toLowerCase();
    const pm = sale.payment_method?.toLowerCase();
    return inv.includes(query) || pm.includes(query);
  });

  const handleAddToOrder = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === parseInt(selectedProductId, 10));
    if (!prod) return;

    if (selectedQuantity > prod.stock_quantity) {
      alert(`Requested amount exceeds physical warehouse constraints (${prod.stock_quantity} available).`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === prod.id);
      if (existing) {
        const newQty = existing.quantity + selectedQuantity;
        if (newQty > prod.stock_quantity) {
          alert(`Combined items exceed max inventory volume constraints.`);
          return prev;
        }
        return prev.map((item) =>
          item.product_id === prod.id ? { ...item, quantity: newQty } : item
        );
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          name: prod.name,
          quantity: selectedQuantity,
          price: parseFloat(prod.selling_price as string),
          max_stock: prod.stock_quantity,
        },
      ];
    });

    setSelectedProductId("");
    setProductSearchQuery(""); // Reset search string upon addition
    setSelectedQuantity(1);
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Please assign at least one inventory item to the active checkout manifest.");
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
      const response = await fetch("http://localhost:8000/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Validation error processing invoice compilation.");
      }

      const freshInvoice = await response.json();
      setSales((prev) => [freshInvoice, ...prev]);
      setCart([]);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Transaction Denied: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="font-medium text-gray-600 text-sm">Syncing transaction registry records...</p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-slate-900">
      {/* Upper Navigation Banner */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Sales & <span className="text-emerald-600">Revenue</span>
            </h1>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">
              Live Auditing Panel Terminal
            </p>
          </div>
          
          <button
            onClick={() => {
              setProductSearchQuery("");
              setSelectedProductId("");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none"
          >
            + New Order Checkout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6 space-y-6">
        {/* Metric Performance Dashboard */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Daily Revenue</p>
            <p className="mt-2 text-2xl font-black text-gray-900">KES {metrics.daily.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Weekly Performance</p>
            <p className="mt-2 text-2xl font-black text-gray-900">KES {metrics.weekly.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Monthly Statements</p>
            <p className="mt-2 text-2xl font-black text-gray-900">KES {metrics.monthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl border border-emerald-950 bg-emerald-950 p-5 shadow-sm text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Absolute Gross Revenue</p>
            <p className="mt-2 text-2xl font-black">KES {metrics.absoluteTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </section>

        {/* Global Filter Toolbar for Historical Data */}
        <div className="relative max-w-md bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search ledger by invoice # or payment..."
            value={ledgerSearchQuery}
            onChange={(e) => setLedgerSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-1.5 text-xs outline-none focus:border-emerald-500"
          />
        </div>

        {/* Master Historical Ledger Table */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Invoice Details</th>
                  <th className="px-6 py-3.5">Date / Timestamp</th>
                  <th className="px-6 py-3.5">Settlement Method</th>
                  <th className="px-6 py-3.5">Purchased Items Summary</th>
                  <th className="px-6 py-3.5 text-right">Total Transacted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredSalesLedger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center font-medium text-gray-400 bg-gray-50/50 italic">
                      No transactions match your parameters filter query.
                    </td>
                  </tr>
                ) : (
                  filteredSalesLedger.map((sale) => (
                    <tr key={sale.id} className="transition hover:bg-gray-50/70">
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700 text-xs">
                        {sale.invoice_number || sale.invoice_no || `INV-#00${sale.id}`}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 border border-slate-200 text-slate-800 rounded uppercase tracking-wider font-mono">
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex flex-wrap gap-1">
                          {sale.items?.map((item) => (
                            <span key={item.id} className="inline-block text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 font-medium">
                              {item.product?.name || `Product ID: ${item.product_id}`} (&times;{item.quantity})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        KES {Number(sale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* POS Point-of-Sale Register Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">New Checkout Transaction</h2>
                <p className="text-xs text-gray-500">Compile items to post structurally valid ledger rows to the database engine.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 overflow-y-auto pr-1 flex-1 py-1">
              
              {/* Left Column: Live Searchable Product Target Form */}
              <div className="md:col-span-2 space-y-4 border-r border-gray-100 pr-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-emerald-600">1. Locate Hardware Variant</h3>
                
                {/* Product Search Input Box */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">Type Product Name or Brand</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g., Cement, Hammer, Wire..."
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setSelectedProductId(""); // Reset target dropdown if query changes
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-4 py-1.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    />
                  </div>
                </div>

                {/* Filtered Dropdown Options Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">
                    Matches Found ({filteredProductOptions.length})
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    size={6} // Render as a clean box component instead of a single drop line
                    className="w-full rounded-lg border border-gray-300 bg-white p-1 text-xs outline-none focus:border-emerald-500"
                  >
                    {filteredProductOptions.map((p) => (
                      <option 
                        key={p.id} 
                        value={p.id} 
                        disabled={p.stock_quantity <= 0}
                        className="p-1.5 rounded cursor-pointer hover:bg-slate-50 disabled:opacity-40 disabled:bg-slate-50"
                      >
                        {p.name} [{p.brand || "Generic"}] - KES {Number(p.selling_price).toFixed(2)} ({p.stock_quantity} left)
                      </option>
                    ))}
                    {filteredProductOptions.length === 0 && (
                      <option disabled className="text-slate-400 italic text-center p-4">No matching variants inside catalog</option>
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">Required Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToOrder}
                  disabled={!selectedProductId}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 text-xs font-bold hover:bg-emerald-100 transition disabled:opacity-40"
                >
                  Add To Cart Order Manifest <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Right Column: Checkout Review and Dispatch Pipeline */}
              <form onSubmit={handleCreateSale} className="md:col-span-3 flex flex-col h-full space-y-4 pl-1">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">2. Active Order Cart Manifest</h3>
                
                {/* Scrollable Container Block for Cart Items */}
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[220px] overflow-y-auto bg-slate-50/40 flex-1">
                  {cart.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center text-slate-400">
                      <ShoppingCart className="h-6 w-6 mb-1 stroke-1" />
                      <p className="text-xs font-medium italic">Use the selector on the left to add hardware items.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product_id} className="p-3 flex items-center justify-between bg-white text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-slate-400 font-medium mt-0.5">
                            {item.quantity} units &times; KES {item.price.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-800">KES {(item.price * item.quantity).toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.product_id)}
                            className="text-red-500 hover:text-red-700 font-black p-1 text-sm leading-none"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Final Configuration Fields */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-600">Payment Option</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none transition focus:border-emerald-500 font-mono text-slate-800 font-semibold"
                    >
                      <option value="cash">Cash Settlement</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="mobile">M-Pesa / Mobile Money</option>
                      <option value="bank">Direct Bank Transfer</option>
                    </select>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-center text-right shadow-inner">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grand Total Amount</span>
                    <span className="text-lg font-black text-emerald-700">KES {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Final Stage Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Close Panel
                  </button>
                  <button
                    type="submit"
                    disabled={cart.length === 0}
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
                  >
                    Complete Live Dispatch
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
