"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();

  const { loginUser } = useAuth();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await login(email, password);

      loginUser(data.access_token, data.user);

      router.push("/dashboard");
    } catch (error) {
      setError("Invalid credentials" + error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-10">
        <div>
        <h1 className="text-4xl font-bold mb-6">Kaura Hardware Inventory</h1>
      </div>
      <div>
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-4 border p-6 rounded-lg"
        >
          <h1 className="text-2xl text-center font-bold">Login</h1>

          {error && <p className="text-red-500">{error}</p>}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-2 rounded"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
      </div>
      
    </div>
  );
}
