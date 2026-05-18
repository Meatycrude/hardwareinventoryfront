"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderPlus, X, AlertCircle } from "lucide-react";

interface Category {
  id: number;
  name: string;
  created_at?: string;
}

export default function CategoriesManager() {
  const router = useRouter();
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interface state controllers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadCategories() {
      try {
        const response = await fetch("http://localhost:8000/api/categories", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error("Could not download structure rows.");
        setCategories(await response.json());
      } catch (err) {
        setError("Failed to link with your Laravel local backend engine.");
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, [token, router]);

  const openModal = () => {
    setIsModalOpen(true);
    setNewCategoryName("");
    setFormValidationError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewCategoryName("");
    setFormValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    setFormValidationError(null);

    try {
      const response = await fetch("http://localhost:8000/api/categories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        // Specifically catch Laravel's unique:categories,name validation message rule
        if (errData.errors?.name) {
          throw new Error(errData.errors.name[0]);
        }
        throw new Error(errData.message || "Failed to process record entry.");
      }

      const freshCategory = await response.json();
      setCategories((prev) => [freshCategory, ...prev]);
      closeModal();
    } catch (err: any) {
      setFormValidationError(err.message || "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-500 animate-pulse font-medium">
          Syncing product categories matrix...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm max-w-md mx-auto my-12">
        <p className="font-semibold text-red-700">Connection Error</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Product Categories
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
            Total Classifications: <span className="text-emerald-600 font-bold">{categories.length}</span>
          </p>
        </div>

        <button
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Main Database Table Output Card */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
          <CardTitle className="text-lg font-semibold text-slate-800">
            System Taxonomy Matrix
          </CardTitle>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Active indexing categories used to categorize your global hardware inventory catalog.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 w-24">ID Reference</th>
                  <th className="px-6 py-3.5">Category Title</th>
                  <th className="px-6 py-3.5 text-right">System Configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center font-medium text-slate-400 bg-slate-50/20 italic">
                      No categories found inside your backend schema records.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="transition hover:bg-slate-50/40">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                        #CAT-{String(category.id).padStart(3, "0")}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 border border-blue-100 shadow-sm">
                          Active Channel
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pop-up Overlay backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          {/* Modal Box */}
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Create Category</h2>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Laravel Active Validation Inline Errors */}
            {formValidationError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formValidationError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Electrical Materials, Hand Tools"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  This descriptive name identifier parameter must remain entirely unique inside your system database tables.
                </p>
              </div>

              {/* Action Operations Tray */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newCategoryName.trim()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
                >
                  {isSubmitting ? "Creating..." : "Save Classification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
