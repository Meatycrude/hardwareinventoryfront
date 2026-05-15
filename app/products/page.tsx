"use client";

import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  category_id: number;
  supplier_id: number;
  name: string;
  sku?: string;
  brand: string;
  unit: string;
  buying_price: string | number;
  selling_price: string | number;
  stock_quantity: number;
  minimum_stock: number;
  description: string;
  category?: Category;
  supplier?: Supplier;
}

export default function SimpleProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category_id: "",
    supplier_id: "",
    name: "",
    brand: "",
    unit: "pcs",
    buying_price: "",
    selling_price: "",
    stock_quantity: "0",
    minimum_stock: "5",
    description: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [resProd, resCat, resSup] = await Promise.all([
          fetch("http://localhost:8000/api/products"),
          fetch("http://localhost:8000/api/categories"),
          fetch("http://localhost:8000/api/suppliers"),
        ]);

        if (resProd.ok) setProducts(await resProd.json());
        if (resCat.ok) setCategories(await resCat.json());
        if (resSup.ok) setSuppliers(await resSup.json());
      } catch (err) {
        setError("Failed to link with your Laravel local backend engine.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      category_id: parseInt(formData.category_id, 10),
      supplier_id: parseInt(formData.supplier_id, 10),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      minimum_stock: parseInt(formData.minimum_stock, 10),
      buying_price: parseFloat(formData.buying_price),
      selling_price: parseFloat(formData.selling_price),
    };

    try {
      const response = await fetch("http://localhost:8000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Laravel Validation Rejection Reason:", errorData);
        throw new Error("Server rejected request structure.");
      }

      const savedItem = await response.json();
      setProducts((prev) => [savedItem, ...prev]);

      setFormData({
        category_id: "",
        supplier_id: "",
        name: "",
        brand: "",
        unit: "pcs",
        buying_price: "",
        selling_price: "",
        stock_quantity: "0",
        minimum_stock: "5",
        description: "",
      });
      setIsModalOpen(false);
    } catch (err) {
      alert(
        "Save rejected. Press F12 and inspect your Console tab to see the exact validation error.",
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this product?"))
      return;

    try {
      const response = await fetch(`http://localhost:8000/api/products/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Deletion failed");

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Could not complete delete operation on database layer.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-12">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-4 font-medium text-gray-600">
            Loading inventory manager module...
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
      {/* Header Banner */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Inventory <span className="text-emerald-600">Engine</span>
            </h1>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">
              view all data records, add new entries, or delete existing ones
            </p>
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            + Add Product
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {/* Live Tracking Table */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              Database Records
            </h2>
            <p className="text-xs text-gray-500">Live storage data tables.</p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Product Info</th>
                  <th className="px-6 py-3">Meta Information</th>
                  <th className="px-6 py-3 text-right">Metrics & Quantities</th>
                  <th className="px-6 py-3 text-right">Financial Pricing</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center font-medium text-gray-400 bg-gray-50/50"
                    >
                      No matching engine rows found inside the connected
                      inventory database.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const isLowStock =
                      product.stock_quantity <= product.minimum_stock;
                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-gray-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Brand:{" "}
                            <span className="font-medium text-gray-700">
                              {product.brand || "Generic"}
                            </span>
                          </div>
                          {product.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1 max-w-xs">
                              {product.description}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 space-y-1">
                          <div className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
                            {product.category?.name ||
                              `Cat ID: ${product.category_id}`}
                          </div>
                          <div className="text-xs text-gray-500 block">
                            Supplier:{" "}
                            <span className="text-gray-700 font-medium">
                              {product.supplier?.name ||
                                `ID: ${product.supplier_id}`}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div
                            className={`font-bold text-sm ${isLowStock ? "text-amber-600" : "text-gray-900"}`}
                          >
                            {product.stock_quantity}{" "}
                            <span className="text-xs font-normal text-gray-500">
                              {product.unit}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Min Threshold: {product.minimum_stock}
                          </div>
                          {isLowStock && (
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Low Stock Alert
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            S: ksh{Number(product.selling_price).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            B: ksh{Number(product.buying_price).toFixed(2)}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 hover:border-red-200 focus:outline-none"
                          >
                            Delete Row
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal Overlay backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          {/* Modal Container */}
          <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Add New Product
                </h2>
                <p className="text-xs text-gray-500">
                  Insert data in to the storage backend{" "}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <span className="text-xl font-bold leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Product Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Product Title
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Wireless Mouse"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Category Assignment
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="" className="text-gray-400">
                      -- Choose Category --
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Supplier */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Active Supplier
                  </label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="" className="text-gray-400">
                      -- Choose Supplier --
                    </option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="e.g. Logitech"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Unit Measure */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Unit Measure
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    required
                    placeholder="pcs, boxes, kg"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Initial Stock Quantity */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Minimum Alert Stock */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Minimum Alert Stock
                  </label>
                  <input
                    type="number"
                    name="minimum_stock"
                    value={formData.minimum_stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Buying Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Buying Price (ksh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="buying_price"
                    value={formData.buying_price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Selling Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Selling Price (ksh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Description Line */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Product Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Provide primary features or specifications..."
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Save Live Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
