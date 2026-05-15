const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
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

  return Promise.resolve();
}
