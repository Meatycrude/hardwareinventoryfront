"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

interface AuditUser {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  user?: AuditUser | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AuditLogsPage() {
  const router = useRouter();

  const { user, token } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    async function loadAuditLogs() {
      try {
        const response = await fetch(`${API_URL}/audit-logs`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (response.status === 403) {
          router.push("/dashboard");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load audit logs.");
        }

        const data = await response.json();

        setLogs(data);
      } catch {
        setError("Could not load audit trail records.");
      } finally {
        setLoading(false);
      }
    }

    if (user?.role === "admin") {
      loadAuditLogs();
    }
  }, [token, user, router]);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return logs;

    return logs.filter((log) => {
      return (
        log.action.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query) ||
        log.user?.name?.toLowerCase().includes(query) ||
        log.user?.email?.toLowerCase().includes(query)
      );
    });
  }, [logs, searchQuery]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function formatAction(action: string) {
    return action.replaceAll(".", " ");
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading audit trail...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Audit Trail
              </h1>

              <p className="text-sm text-slate-500">
                Track system activity, user actions, and inventory changes.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
          {filteredLogs.length} Records
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Search by action, user, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-black">Date</th>
                <th className="px-6 py-4 font-black">User</th>
                <th className="px-6 py-4 font-black">Action</th>
                <th className="px-6 py-4 font-black">Description</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                  >
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-500">
                      {formatDate(log.created_at)}
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900">
                          {log.user?.name || "System"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {log.user?.email || "No user attached"}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
                        {formatAction(log.action)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-700">
                      {log.description}
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
