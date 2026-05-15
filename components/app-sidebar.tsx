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
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Products", url: "/products", icon: Package },
  { title: "Categories", url: "/categories", icon: FolderOpen },
  { title: "Suppliers", url: "/suppliers", icon: Users },
  { title: "Stock Movements", url: "/stockmovements", icon: ArrowLeftRight },
  { title: "Sales", url: "/sales", icon: ShoppingCart },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const router = useRouter();

  const { logoutUser } = useAuth();

  async function handleLogout(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await logout();

      logoutUser();

      router.push("/login");

      setLoading(false);
    } catch (error) {
      setError("Invalid credentials" + error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="bg-slate-500">
      <SidebarContent className="bg-[#E6FEEE] pt-10">
        <SidebarGroup>
          <SidebarGroupLabel className="text-2xl  font-semibold tracking-wider text-01230C p-4 uppercase">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} className="">
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 px-4 py-6 rounded-lg transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <item.icon className="h-5 w-5 stroke-[1.75] " />
                      <span className="font-2xl text-black ">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Optional logout shortcut block */}
      <SidebarFooter className="p-4 border-t border-slate-100">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 w-full gap-3"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
