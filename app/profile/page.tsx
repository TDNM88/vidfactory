"use client";
import React from "react";
import { useUserStatus } from "@/components/UserStatusContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

import CreditHistory from "./CreditHistory";

export default function ProfilePage() {
  const { user, loading, error, refreshUser } = useUserStatus();
  const router = useRouter();

  React.useEffect(() => {
    if (!user && !loading) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex justify-center items-center min-h-[40vh] text-lg">Đang tải thông tin...</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border">
      <div className="flex flex-col items-center gap-4">
        <Avatar className="w-20 h-20 border-2 border-primary">
          <AvatarFallback>{user.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div className="text-xl font-bold text-primary">{user.username}</div>
        <div className="text-gray-600">Credit: <b>{user.credit}</b></div>
        {user.isAdmin && <div className="px-3 py-1 bg-green-200 text-green-800 rounded">Admin</div>}
      </div>
      <div className="mt-8 flex flex-col gap-2">
        <button
          className="w-full py-2 rounded bg-gradient-to-r from-primary to-teal-400 text-white font-bold shadow hover:scale-105 transition-transform"
          onClick={() => refreshUser()}
        >
          Làm mới thông tin
        </button>
        <button
          className="w-full py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold mt-1"
          onClick={() => {
            localStorage.removeItem("token");
            router.replace("/login");
          }}
        >
          Đăng xuất
        </button>
      </div>
      {error && <div className="mt-4 text-center text-red-500 text-sm">{error}</div>}
      <CreditHistory />
    </div>
  );
}
