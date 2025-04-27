import React from "react";

export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-primary">Trang cá nhân</h1>
      <p className="mb-2">Đây là giao diện trang cá nhân của bạn.</p>
      <p>Bạn có thể cập nhật thông tin, xem lịch sử hoạt động, hoặc quay lại <a href="/dashboard" className="text-blue-600 underline">giao diện tạo video</a>.</p>
    </div>
  );
}
