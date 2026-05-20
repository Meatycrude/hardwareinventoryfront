"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { verifyTwoFactor } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";

export default function VerifyTwoFactorPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const { loginUser } = useAuth();

  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    setError("");

    try {
      const data = await verifyTwoFactor(email, code);

      loginUser(data.access_token, data.user);

      router.push("/dashboard");
    } catch (error) {
      setError("Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-md space-y-4 border p-6 rounded-lg"
      >
        <div className="space-y-2">
          <h1 className="text-2xl text-center font-bold">
            Two Factor Verification
          </h1>

          <p className="text-center text-sm text-gray-500">
            Enter the verification code sent to:
          </p>

          <p className="text-center font-medium">{email}</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border p-2 rounded"
          maxLength={6}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}
