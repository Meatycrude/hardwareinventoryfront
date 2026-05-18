"use client";

import { useEffect, useState } from "react";

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

export default function SuppliersManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const response = await fetch("http://localhost:8000/api/suppliers");
        if (!response.ok) throw new Error("Failed to fetch database records.");
        setSuppliers(await response.json());
      } catch (err) {
        setError("Failed to link with your Laravel local backend engine.");
      } finally {
        setLoading(false);
      }
    }
    loadSuppliers();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Pre-populate modal form fields for update execution
  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setFormData({ name: "", email: "", phone: "", address: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Format clean payload to strip empty inputs into null values for nullable database columns
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone.trim() === "" ? null : formData.phone,
      address: formData.address.trim() === "" ? null : formData.address,
    };

    const isEditing = !!editingSupplier;
    const url = isEditing
      ? `http://localhost:8000/api/suppliers/${editingSupplier.id}`
      : "http://localhost:8000/api/suppliers";

    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Laravel Validation Rejection Reason:", errorData);
        throw new Error("Server validation error.");
      }

      const savedItem = await response.json();

      if (isEditing) {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === savedItem.id ? savedItem : s)),
        );
      } else {
        setSuppliers((prev) => [savedItem, ...prev]);
      }

      closeModal();
    } catch (err) {
      alert(
        "Operation rejected. Press F12 and inspect your Console tab to see the exact validation error (e.g. Unique Email check).",
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this supplier?"))
      return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/suppliers/${id}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
      );

      if (!response.ok) throw new Error("Deletion failed");

      setSuppliers((prev) => prev.filter((s) => s.id !== id));
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
            Loading supplier module files...
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
              Supplier <span className="text-emerald-600">Registry</span>
            </h1>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">
              Add delete or modify your supply channel vendors and entities in
              real-time
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            + Add Supplier
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {/* Suppliers Data Table */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              Active Supply Channels
            </h2>
            <p className="text-xs text-gray-500">Live vendor distribution</p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Vendor / Entity Name</th>
                  <th className="px-6 py-3">Digital Mail Address</th>
                  <th className="px-6 py-3">Phone Line</th>
                  <th className="px-6 py-3">Physical Address</th>
                  <th className="px-6 py-3 text-center">Row Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {suppliers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center font-medium text-gray-400 bg-gray-50/50"
                    >
                      No matching engine rows found inside the connected
                      suppliers database table.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="transition hover:bg-gray-50/70"
                    >
                      {/* Name */}
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {supplier.name}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-blue-600 font-medium">
                        {supplier.email}
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-gray-600">
                        {supplier.phone ? (
                          <span className="font-mono">{supplier.phone}</span>
                        ) : (
                          <span className="text-xs italic text-gray-400">
                            Unspecified
                          </span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {supplier.address || (
                          <span className="text-xs italic text-gray-400">
                            No physical record
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 hover:border-red-200 focus:outline-none"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Dynamic Pop-up Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingSupplier
                    ? "Modify Vendor Details"
                    : "Add New Supplier"}
                </h2>
                <p className="text-xs text-gray-500">
                  {editingSupplier
                    ? "Update validation items for this specific active storage entity."
                    : "Populate fields to insert a fresh row record into your backend database table."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <span className="text-xl font-bold leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Supplier Name */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Supplier / Company Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Acme Logistics Corp"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Contact Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Contact Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="name@vendor.com"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Phone Line */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Phone Number{" "}
                    <span className="text-[10px] font-normal text-gray-400 lowercase">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 019-2834"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Physical Address Text Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Headquarters Physical Address{" "}
                  <span className="text-[10px] font-normal text-gray-400 lowercase">
                    (Optional)
                  </span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Street, Suite number, Postal code, Country location..."
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  {editingSupplier ? "Save Changes" : "Create Entity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
