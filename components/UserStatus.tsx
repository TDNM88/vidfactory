"use client";
import { useRouter } from "next/navigation";
import { useUserStatus } from "./UserStatusContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserStatus() {
  const { user, loading, error, refreshUser, setUser } = useUserStatus();
  const router = useRouter();

  if (!user) return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>Chưa đăng nhập</span>
      <button
        className="ml-2 px-3 py-1 bg-gradient-to-r from-primary to-teal-400 text-white rounded-lg font-bold shadow-sm hover:scale-105 transition-transform duration-150 text-sm"
        onClick={() => router.push("/login")}
      >
        Đăng nhập
      </button>
    </div>
  );

  return (
    <div className="flex items-center gap-3 text-sm text-gray-800">
      <span>Xin chào, <b>{user.username}</b></span>
      <span>|</span>
      <span>Credit: <b>{loading ? <span className='animate-pulse'>...</span> : user.credit}</b></span>
      <button
        className="ml-1 px-1 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs border"
        title="Làm mới credit"
        onClick={refreshUser}
        disabled={loading}
      >
        &#x21bb;
      </button>
      {user.isAdmin && <span className="ml-2 px-2 py-1 bg-green-200 text-green-800 rounded">Admin</span>}
      <button
        className="ml-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        onClick={() => {
          localStorage.removeItem("token");
          setUser(null);
          router.push("/login");
        }}
      >
        Đăng xuất
      </button>
      <span className="ml-2 cursor-pointer" title="Trang cá nhân" onClick={() => router.push('/profile')}>
        {/* Avatar profile */}
        <Avatar className="w-8 h-8 border-2 border-primary hover:shadow-md transition-all">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.username} />
          ) : null}
          <AvatarFallback>{user.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
      </span>
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </div>
  );
}


