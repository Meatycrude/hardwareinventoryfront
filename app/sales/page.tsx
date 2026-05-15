"use client";

import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
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
  invoice_no: string;
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [resSales, resProducts] = await Promise.all([
          fetch("http://localhost:8000/api/sales"),
          fetch("http://localhost:8000/api/products"),
        ]);

        if (resSales.ok)
          setSales(
            (await resSales.getJson)
              ? await resSales.json()
              : await resSales.json(),
          );
        if (resProducts.ok) setProducts(await resProducts.json());
      } catch (err) {
        setError(
          "Failed to stream structure files from your Laravel backend local pipeline.",
        );
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

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

  const handleAddToOrder = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === parseInt(selectedProductId, 10));
    if (!prod) return;

    if (selectedQuantity > prod.stock_quantity) {
      alert(
        `Requested amount exceeds physical warehouse constraints (${prod.stock_quantity} available).`,
      );
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
          item.product_id === prod.id ? { ...item, quantity: newQty } : item,
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
    setSelectedQuantity(1);
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert(
        "Please assign at least one inventory tracking item row to the active checkout manifest.",
      );
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
        throw new Error(
          errData.error || "Validation error processing invoice compilation.",
        );
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-12">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-4 font-medium text-gray-600">
            Syncing transaction registry records...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm max-w-md">
          <p className="font-semibold text-red-700">Connection Error</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Sales & <span className="text-emerald-600">Revenue</span>
            </h1>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">
              Auditing Panel
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            + New sale
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6 space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Daily Revenue
            </p>
            <p className="mt-2 text-2xl font-black text-gray-900">
              ksh{metrics.daily.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Today's sales</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Weekly Performance
            </p>
            <p className="mt-2 text-2xl font-black text-gray-900">
              ksh{metrics.weekly.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Rolling 7-day sales
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Monthly Sales
            </p>
            <p className="mt-2 text-2xl font-black text-gray-900">
              ksh{metrics.monthly.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Current calendar month volume
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-emerald-950 p-5 shadow-sm text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Absolute Gross Revenue
            </p>
            <p className="mt-2 text-2xl font-black">
              ksh{metrics.absoluteTotal.toFixed(2)}
            </p>
            <p className="text-[10px] text-emerald-400 mt-1">
              Total combined balance
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Audit Records</h2>
            <p className="text-xs text-gray-500">
              Comprehensive list of sales.
            </p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Invoice details</th>
                  <th className="px-6 py-3">Date / Timestamp</th>
                  <th className="px-6 py-3">Settlement Method</th>
                  <th className="px-6 py-3">Purchased Items Summary</th>
                  <th className="px-6 py-3 text-right">Total Transacted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {sales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center font-medium text-gray-400 bg-gray-50/50"
                    >
                      No matching engine rows found inside the connected
                      transactions ledger.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition hover:bg-gray-50/70 vertical-top"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700 text-xs">
                        {sale.invoice_no || `INV-#00${sale.id}`}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 border border-gray-200 text-gray-800 rounded">
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {sale.items?.map((item) => (
                            <span
                              key={item.id}
                              className="inline-block text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-gray-600"
                            >
                              <strong className="text-gray-900">
                                {item.product?.name || `ID: ${item.product_id}`}
                              </strong>{" "}
                              &times; {item.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        ${parseFloat(sale.total_amount as string).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  New Checkout Transaction
                </h2>
                <p className="text-xs text-gray-500">
                  Compile items to post structurally valid ledger rows to the
                  database engine.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <span className="text-xl font-bold leading-none">&times;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 overflow-y-auto pr-1 flex-1 py-1">
              <div className="md:col-span-2 space-y-4 border-r border-gray-100 pr-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                  Select Inventory
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">
                    Product Target
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  >
                    <option value="">-- Choose Item --</option>
                    {products.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={p.stock_quantity <= 0}
                      >
                        {p.name} ($
                        {parseFloat(p.selling_price as string).toFixed(2)}) [
                        {p.stock_quantity} left]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">
                    Required Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(e) =>
                      setSelectedQuantity(parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToOrder}
                  disabled={!selectedProductId}
                  className="w-full rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 text-xs font-bold hover:bg-emerald-100 transition disabled:opacity-50"
                >
                  Add To Manifest Block
                </button>
              </div>

              <form
                onSubmit={handleCreateSale}
                className="md:col-span-3 flex flex-col h-full space-y-4"
              >
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-500">
                  Cart Manifest
                </h3>

                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[220px] overflow-y-auto bg-gray-50/50 flex-1">
                  {cart.length === 0 ? (
                    <p className="p-8 text-center text-xs text-gray-400 font-medium italic">
                      Your order cart queue is empty.
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.product_id}
                        className="p-3 flex items-center justify-between bg-white text-xs"
                      >
                        <div>
                          <div className="font-semibold text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-gray-400 mt-0.5">
                            {item.quantity} &times; ${item.price.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-800">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveFromCart(item.product_id)
                            }
                            className="text-red-500 hover:text-red-700 font-bold p-1"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Final Configuration Fields */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-600">
                    Payment Option
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                  >
                    <option value="cash">Cash Currency</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="mobile">Mobile Payment Interface</option>
                    <option value="bank">Direct Wire Settlement</option>
                  </select>
                </div>

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
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
                  >
                    Complete Sale
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
