"use client";

import {
  Home,
  Package,
  ShoppingCart,
  Users,
  FolderOpen,
  ArrowLeftRight,
  BarChart3,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { logout } from "@/services/auth";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    roles: ["admin", "cashier", "storekeeper"],
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
    roles: ["admin", "cashier", "storekeeper"],
  },
  {
    title: "Categories",
    url: "/categories",
    icon: FolderOpen,
    roles: ["admin", "storekeeper"],
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Users,
    roles: ["admin", "storekeeper"],
  },
  {
    title: "Stock Movements",
    url: "/stockmovements",
    icon: ArrowLeftRight,
    roles: ["admin", "storekeeper"],
  },
  {
    title: "Sales",
    url: "/sales",
    icon: ShoppingCart,
    roles: ["admin", "cashier"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
  title: "Audit Trail",
  url: "/audit-logs",
  icon: ShieldCheck,
  roles: ["admin"],
}
];

export function AppSidebar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const { logoutUser, user } = useAuth();

  const visibleItems = items.filter((item) =>
    item.roles.includes(user?.role ?? "")
  );

  async function handleLogout(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await logout();

      logoutUser();

      router.push("/login");
    } catch {
      setError("Failed to logout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-emerald-100 bg-[#E6FEEE]"
    >
      <SidebarContent className="bg-gradient-to-b from-[#E6FEEE] via-white to-[#E6FEEE] px-3 pt-6">
        <div
          className={`mb-6 rounded-2xl border border-emerald-100 bg-white shadow-sm ${
            isCollapsed ? "flex justify-center p-2" : "p-4"
          }`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>

          {!isCollapsed && (
            <>
              <h2 className="mt-3 text-lg font-black tracking-tight text-[#01230C]">
                Kaura Hardware
              </h2>

              <p className="text-xs font-medium text-emerald-700">
                Inventory Management
              </p>
            </>
          )}
        </div>

        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800/70">
              Management
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent className="mt-3">
            <SidebarMenu className="space-y-1">
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link
                        href={item.url}
                        className={`group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                          isCollapsed ? "justify-center" : "gap-3"
                        } ${
                          isActive
                            ? "bg-emerald-700 text-white shadow-md shadow-emerald-100"
                            : "text-slate-600 hover:bg-white hover:text-emerald-800 hover:shadow-sm"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 stroke-[1.8] ${
                            isActive
                              ? "text-white"
                              : "text-slate-500 group-hover:text-emerald-700"
                          }`}
                        />

                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="space-y-3 border-t border-emerald-100 bg-[#E6FEEE] p-4">
        {!isCollapsed ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <User className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {user?.name || "User"}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              {user?.role || "Unknown"}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <User className="h-5 w-5" />
            </div>
          </div>
        )}

        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile">
              <Link
                href="/profile"
                className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isCollapsed ? "justify-center" : "gap-3"
                } ${
                  pathname === "/profile"
                    ? "bg-emerald-700 text-white shadow-md"
                    : "text-slate-600 hover:bg-white hover:text-emerald-800 hover:shadow-sm"
                }`}
              >
                <User className="h-5 w-5 shrink-0" />

                {!isCollapsed && <span>Profile</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={loading}
              tooltip="Logout"
              className={`rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700 ${
                isCollapsed ? "justify-center" : "w-full gap-3"
              }`}
            >
              <LogOut className="h-5 w-5 shrink-0" />

              {!isCollapsed && (
                <span>{loading ? "Logging out..." : "Logout"}</span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {error && !isCollapsed && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}