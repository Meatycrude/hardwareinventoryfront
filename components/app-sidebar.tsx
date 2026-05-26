"use client";

// components/app-sidebar.tsx

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
} from "@/components/ui/sidebar";

import Link from "next/link";

import { useAuth } from "@/context/AuthContext";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { logout } from "@/services/auth";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },

  {
    title: "Products",
    url: "/products",
    icon: Package,
  },

  {
    title: "Categories",
    url: "/categories",
    icon: FolderOpen,
  },

  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Users,
  },

  {
    title: "Stock Movements",
    url: "/stockmovements",
    icon: ArrowLeftRight,
  },

  {
    title: "Sales",
    url: "/sales",
    icon: ShoppingCart,
  },

  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },

  
];

export function AppSidebar() {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const router = useRouter();

  const { logoutUser, user } = useAuth();

  async function handleLogout(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    setError("");

    try {
      await logout();

      logoutUser();

      router.push("/login");
    } catch (error) {
      setError("Failed to logout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r">
      <SidebarContent className="bg-[#E6FEEE] pt-10">
        <SidebarGroup>
          <SidebarGroupLabel className="text-2xl font-semibold tracking-wider text-[#01230C] p-4 uppercase">
            Management
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 px-4 py-6 rounded-lg transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <item.icon className="h-5 w-5 stroke-[1.75]" />

                      <span className="text-black">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 bg-[#E6FEEE] p-4 space-y-3">
        {/* User Info */}
        <div className="rounded-xl bg-white border p-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            {user?.name || "Admin User"}
          </p>

          <p className="text-xs text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-500">
            Role: {user?.role || "Admin"}
          </p>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <User className="h-5 w-5" />

                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full gap-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-5 w-5" />

              <span>{loading ? "Logging out..." : "Logout"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Error Message */}
        {error && <p className="text-xs text-red-500 px-2">{error}</p>}
      </SidebarFooter>
    </Sidebar>
  );
}
