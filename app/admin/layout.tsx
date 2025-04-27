import React from "react";
import UserStatus from "@/components/UserStatus";
import { UserStatusProvider } from "@/components/UserStatusContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserStatusProvider>
      <div className="w-full flex flex-wrap justify-between items-center gap-2 px-2 py-2 border-b bg-white/80 dark:bg-gray-900/80 z-50 sticky top-0">
        <div className="flex items-center gap-4">
          <a
            href="/dashboard"
            className="inline-block px-3 py-1 bg-gradient-to-r from-primary to-teal-400 text-white font-bold rounded-lg shadow hover:scale-105 transition-transform text-sm"
          >
            ← Về giao diện ứng dụng
          </a>
          <span className="text-xs text-gray-500 truncate max-w-[40vw] select-none">
            Ứng dụng được phát triển bởi <span className="font-semibold text-primary">TDNM</span>
          </span>
        </div>
        <UserStatus />
      </div>
      <main>{children}</main>
    </UserStatusProvider>
  );
}
