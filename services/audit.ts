const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getAuditLogs() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/audit-logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch audit logs");
  }

  return response.json();
}
