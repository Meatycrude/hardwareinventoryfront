"use client";

import Link from "next/link";

import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logoutUser } = useAuth();

  return (
    <nav className="flex items-center justify-between border-b p-4">
      <div className="flex gap-4">
        <Link href="/dashboard">Dashboard</Link>

        <Link href="/products">Products</Link>
      </div>

      <div className="flex items-center gap-4">
        <span>{user?.name}</span>

        <button onClick={logoutUser} className="border px-3 py-1 rounded">
          Logout
        </button>
      </div>
    </nav>
  );
}
