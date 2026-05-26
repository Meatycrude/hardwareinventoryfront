"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "cashier" | "storekeeper";
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserPasswordConfirmation, setNewUserPasswordConfirmation] =
    useState("");
  const [newUserRole, setNewUserRole] = useState("cashier");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function getToken() {
    return localStorage.getItem("token");
  }

  async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    return response;
  }

  async function loadProfile() {
    const response = await apiFetch("/profile");

    if (!response) return;

    const data = await response.json();

    setProfile(data);
  }

  async function loadUsers() {
    const response = await apiFetch("/users");

    if (!response) return;

    const data = await response.json();

    setUsers(data);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");

    const response = await apiFetch("/profile/password", {
      method: "PUT",
      body: JSON.stringify({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    if (!response) return;

    if (!response.ok) {
      setError("Password update failed.");
      return;
    }

    setMessage("Password updated successfully.");

    setCurrentPassword("");
    setPassword("");
    setPasswordConfirmation("");
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");

    const response = await apiFetch("/users", {
      method: "POST",
      body: JSON.stringify({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        password_confirmation: newUserPasswordConfirmation,
        role: newUserRole,
      }),
    });

    if (!response) return;

    if (response.status === 403) {
      setError("Only admins can create users.");
      return;
    }

    if (!response.ok) {
      setError("Failed to create user.");
      return;
    }

    setMessage("User created successfully.");

    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserPasswordConfirmation("");
    setNewUserRole("cashier");

    loadUsers();
  }

  useEffect(() => {
    loadProfile();
    loadUsers();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and system users.
        </p>
      </div>

      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={profile?.name || ""} disabled />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled />
            </div>

            <div>
              <Label>Role</Label>
              <Input value={profile?.role || ""} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {profile?.role === "admin" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create System User</CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={newUserPasswordConfirmation}
                    onChange={(e) =>
                      setNewUserPasswordConfirmation(e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="storekeeper">Storekeeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  Create User
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  <span className="rounded-full border px-3 py-1 text-xs capitalize">
                    {user.role}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}