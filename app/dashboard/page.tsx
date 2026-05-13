"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import BoardPage from "@/components/layout/dash";

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();

  const { user, token } = useAuth();
  

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <p className="mt-4">Welcome {user.name}</p>
      <BoardPage />
      
    </div>
     
   
    
  );
  <DashboardPage />;
}
