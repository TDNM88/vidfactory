"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

interface UserInfo {
  username: string;
  credit: number;
  isAdmin?: boolean;
  avatarUrl?: string;
}

interface UserStatusContextType {
  user: UserInfo | null;
  loading: boolean;
  error: string;
  refreshUser: () => Promise<void>;
  setUser: (user: UserInfo|null) => void;
}

const UserStatusContext = createContext<UserStatusContextType|undefined>(undefined);

export const UserStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserInfo|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser({
          username: data.user.username,
          credit: data.user.credit,
          isAdmin: data.user.isAdmin,
          avatarUrl: data.user.avatarUrl,
        });
      } else {
        setUser(null);
        setError(data.error || "Không lấy được thông tin user");
      }
    } catch (e) {
      setError("Lỗi kết nối server");
      setUser(null);
    }
    setLoading(false);
  }, []);

  return (
    <UserStatusContext.Provider value={{ user, loading, error, refreshUser, setUser }}>
      {children}
    </UserStatusContext.Provider>
  );
};

export const useUserStatus = () => {
  const ctx = useContext(UserStatusContext);
  if (!ctx) throw new Error("useUserStatus must be used within UserStatusProvider");
  return ctx;
};
