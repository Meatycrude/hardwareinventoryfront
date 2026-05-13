// components/providers/AuthProvider.tsx
/*'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    password_confirmation: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUser: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    router.push('/dashboard');
  };

  const handleRegister = async (
    name: string,
    email: string,
    password: string,
    password_confirmation: string
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newUser: User = { ...mockUser, name };
    setUser(newUser);
    localStorage.setItem('mockUser', JSON.stringify(newUser));
    router.push('/dashboard');
  };

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('mockUser');
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};*/
