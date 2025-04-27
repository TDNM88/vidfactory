"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

interface CreditLog {
  id: number;
  action: string;
  delta: number;
  note?: string;
  createdAt: string;
}

export default function CreditHistory() {
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/credit-log", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs((res.data as { logs: CreditLog[] }).logs || []);
      } catch (e: any) {
        setError(e.response?.data?.error || "Lỗi khi tải lịch sử credit");
      }
      setLoading(false);
    }
    fetchLogs();
  }, []);

  if (loading) return <div className="mt-8 text-center text-sm text-gray-500">Đang tải lịch sử credit...</div>;
  if (error) return <div className="mt-8 text-center text-red-500 text-sm">{error}</div>;
  if (!logs.length) return <div className="mt-8 text-center text-gray-500 text-sm">Chưa có lịch sử credit.</div>;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2 text-primary">Lịch sử credit</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-white rounded-xl shadow border-separate border-spacing-0 overflow-hidden">
          <thead className="bg-gradient-to-r from-primary to-teal-400 text-white">
            <tr>
              <th className="py-2 px-2 font-semibold">Thời gian</th>
              <th className="py-2 px-2 font-semibold">Thao tác</th>
              <th className="py-2 px-2 font-semibold">Số lượng</th>
              <th className="py-2 px-2 font-semibold">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-b-0 hover:bg-teal-50 transition">
                <td className="py-2 px-2 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                <td className="py-2 px-2">{log.action}</td>
                <td className={`py-2 px-2 font-bold ${log.delta > 0 ? "text-green-600" : "text-red-600"}`}>{log.delta > 0 ? "+" : ""}{log.delta}</td>
                <td className="py-2 px-2">{log.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
