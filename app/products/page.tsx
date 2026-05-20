"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  X,
  Plus,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const router = useRouter();
  const { token } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Restock Form Specific States
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [targetRestockProduct, setTargetRestockProduct] =
    useState<Product | null>(null);
  const [restockData, setRestockData] = useState({
    quantity: "10",
    buying_price: "",
  });

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
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadData() {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        };

        const [resProd, resCat, resSup] = await Promise.all([
          fetch("http://localhost:8000/api/products", { headers }),
          fetch("http://localhost:8000/api/categories", { headers }),
          fetch("http://localhost:8000/api/suppliers", { headers }),
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
  }, [token, router]);

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const matchesName = product.name?.toLowerCase().includes(query);
    const matchesBrand = product.brand?.toLowerCase().includes(query);
    const matchesSku = product.sku?.toLowerCase().includes(query);

    const categoryName =
      categories.find((c) => c.id === product.category_id)?.name ||
      product.category?.name;
    const supplierName =
      suppliers.find((s) => s.id === product.supplier_id)?.name ||
      product.supplier?.name;

    return (
      matchesName ||
      matchesBrand ||
      matchesSku ||
      categoryName?.toLowerCase().includes(query) ||
      supplierName?.toLowerCase().includes(query)
    );
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openRestockModal = (product: Product) => {
    setTargetRestockProduct(product);
    setRestockData({
      quantity: "10",
      buying_price: String(product.buying_price),
    });
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRestockProduct) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/products/${targetRestockProduct.id}/restock`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            quantity: parseInt(restockData.quantity, 10),
            buying_price: parseFloat(restockData.buying_price),
          }),
        },
      );

      if (!response.ok)
        throw new Error("Restock insertion operation rejected.");

      const updatedProduct = await response.json();

      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)),
      );
      setIsRestockModalOpen(false);
      alert(`${targetRestockProduct.name} replenished successfully!`);
    } catch (err) {
      alert("Failed to save supplier delivery data.");
    }
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
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Server rejected request structure.");
      const savedItem = await response.json();
      setProducts((prev) => [savedItem, ...prev]);
      setIsModalOpen(false);
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
    } catch (err) {
      alert("Save operation rejected.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this product?"))
      return;
    try {
      const response = await fetch(`http://localhost:8000/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (response.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Delete operation failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }
  if (error)
    return <div className="p-12 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-slate-900">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Product <span className="text-emerald-600">Catalog</span>
          </h1>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">
            Active Inventory Control Matrix
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          + Add Product
        </button>
      </header>

      <main className="mx-auto max-w-6xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search parameters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-8 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden rounded-2xl">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Product Details</th>
                  <th className="px-6 py-3.5">Meta Mapping</th>
                  <th className="px-6 py-3.5 text-right">Metrics & Volume</th>
                  <th className="px-6 py-3.5 text-right">Pricing Matrix</th>
                  <th className="px-6 py-3.5 text-center">Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-slate-400 italic"
                    >
                      No matching hardware products found inside database.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isLowStock =
                      product.stock_quantity <= product.minimum_stock;
                    const catObj = categories.find(
                      (c) => c.id === product.category_id,
                    );
                    const supObj = suppliers.find(
                      (s) => s.id === product.supplier_id,
                    );

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-gray-50/50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 text-sm">
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {product.sku}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Brand:{" "}
                            <span className="font-semibold">
                              {product.brand || "Generic"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                            {product.category?.name ||
                              catObj?.name ||
                              "Uncategorized"}
                          </span>
                          <div className="text-xs text-slate-500">
                            Vendor:{" "}
                            <span className="font-medium text-slate-700">
                              {product.supplier?.name ||
                                supObj?.name ||
                                "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div
                            className={`font-black text-sm ${isLowStock ? "text-rose-600 animate-pulse" : "text-gray-900"}`}
                          >
                            {product.stock_quantity}{" "}
                            <span className="text-xs font-medium text-gray-400">
                              {product.unit}
                            </span>
                          </div>
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-700 bg-rose-50 px-1.5 rounded border border-rose-200">
                              <AlertTriangle className="h-2.5 w-2.5" /> Low
                              Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-bold text-gray-900">
                            S: KES{" "}
                            {Number(product.selling_price).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            B: KES{" "}
                            {Number(product.buying_price).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => openRestockModal(product)}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1.5 text-xs inline-flex items-center gap-1 hover:bg-emerald-100"
                            >
                              <ArrowUpRight className="h-3 w-3" /> Restock
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="rounded-lg border border-gray-200 text-red-600 px-2.5 py-1.5 text-xs font-bold hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Product Insertion Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-lg font-bold text-gray-900">
                Add New Product Specification
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">
                    Category
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">
                    Supplier
                  </label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">
                    Unit Metric
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">
                    Minimum Stock Alert
                  </label>
                  <input
                    type="number"
                    name="minimum_stock"
                    value={formData.minimum_stock}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">
                    Buying Price (KES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="buying_price"
                    value={formData.buying_price}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">
                    Selling Price (KES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border px-4 py-2 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Transaction Overlay Modal */}
      {isRestockModalOpen && targetRestockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h2 className="text-md font-bold text-gray-900">
                  Restock Product Variant
                </h2>
                <p className="text-xs text-emerald-600 font-medium">
                  Target: {targetRestockProduct.name}
                </p>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Incoming Quantity ({targetRestockProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockData.quantity}
                  onChange={(e) =>
                    setRestockData({ ...restockData, quantity: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Supply Unit Buying Cost (KES)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={restockData.buying_price}
                  onChange={(e) =>
                    setRestockData({
                      ...restockData,
                      buying_price: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  Commit Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
