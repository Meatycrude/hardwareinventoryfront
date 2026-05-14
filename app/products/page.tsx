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
  sku: string;
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
    selling_price: parseFloat(formData.selling_price)
  };

  try {
    const response = await fetch("http://localhost:8000/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload), 
    });

    if (!response.ok) {
      
      const errorData = await response.json();
      console.error("Laravel Validation Rejection Reason:", errorData);

      console.dir(errorData); 
      throw new Error("Server rejected request structure.");
    }

    const savedItem = await response.json();
    setProducts((prev) => [savedItem, ...prev]);
    
    setFormData({
      category_id: "", supplier_id: "", name: "",
      brand: "", unit: "pcs", buying_price: "", selling_price: "",
      stock_quantity: "0", minimum_stock: "5", description: ""
    });
  } catch (err) {
    alert("Save rejected. Press F12 and inspect your Console tab to see the exact validation error.");
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

  if (loading)
    return (
      <div className="p-12 text-center text-gray-500 font-medium">
        Loading inventory manager module...
      </div>
    );
  if (error)
    return (
      <div className="p-12 text-center text-red-500 font-medium">{error}</div>
    );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 font-sans bg-green-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Add Database Product
        </h2>
        <p className="text-xs text-gray-500 mb-6"></p>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Product Title
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Category Assignment
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              required
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
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
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Active Supplier
            </label>
            <select
              name="supplier_id"
              value={formData.supplier_id}
              onChange={handleInputChange}
              required
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
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
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Brand Name
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Unit Measure
            </label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              required
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Initial Stock Quantity
            </label>
            <input
              type="number"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleInputChange}
              required
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Buying Cost (Ksh)
            </label>
            <input
              type="number"
              step="0.01"
              name="buying_price"
              value={formData.buying_price}
              onChange={handleInputChange}
              required
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Selling Price (Ksh)
            </label>
            <input
              type="number"
              step="0.01"
              name="selling_price"
              value={formData.selling_price}
              onChange={handleInputChange}
              required
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Min Stock Alert Limit
            </label>
            <input
              type="number"
              name="minimum_stock"
              value={formData.minimum_stock}
              onChange={handleInputChange}
              required
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Description Metadata
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 h-16 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-3 pt-2">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-6 py-2.5 rounded shadow transition-all duration-150"
            >
              Save to Database
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Current Catalog Rows
            </h3>
            <p className="text-xs text-gray-500">
              Live products retrieved via Laravel relational ORM execution
              arrays.
            </p>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
            Total Rows: {products.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs font-bold text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3 text-right">Available Stock</th>
                <th className="px-6 py-3 text-right">Retail Price</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-gray-400 italic"
                  >
                    No matching items discovered inside active tables. Create an
                    asset above.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div>{product.name}</div>
                      <span className="text-xs text-gray-400 font-normal block">
                        {product.brand || "Generic Line"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.category?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.supplier?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {product.stock_quantity}{" "}
                      <span className="text-xs font-normal text-gray-400">
                        {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-600 font-semibold">
                      ${Number(product.selling_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded transition-colors duration-150"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
