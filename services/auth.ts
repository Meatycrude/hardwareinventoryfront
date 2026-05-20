const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  return response.json();
}

export async function verifyTwoFactor(email: string, code: string) {
  const response = await fetch(`${API_URL}/verify-2fa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    throw new Error("Invalid or expired verification code");
  }

  return response.json();
}

export async function logout() {
  const token = localStorage.getItem("token");

  if (!token) {
    return Promise.resolve();
  }

  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  return Promise.resolve();
}