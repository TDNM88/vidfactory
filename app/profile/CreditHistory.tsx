"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Modal, Card, Text, Badge, Group } from "@mantine/core";
import { useUserStatus } from "@/components/UserStatusContext";

interface CreditLog {
  id: number;
  action: string;
  delta: number;
  note?: string;
  createdAt: string;
}

interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  price: number;
  description: string | null;
}

interface CreditInfoResponse {
  success: boolean;
  balance: number;
  totalSpent: number;
  history: CreditLog[];
  total: number;
  error?: string;
}

interface CreditPricesResponse {
  success: boolean;
  pricing: any[];
  packages: CreditPackage[];
  error?: string;
}

interface CreditPurchaseResponse {
  success: boolean;
  message: string;
  credits: number;
  newBalance: number;
  error?: string;
}

export default function CreditHistory() {
  const { refreshUser } = useUserStatus();
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [purchasingPackageId, setPurchasingPackageId] = useState<number | null>(null);

  const limit = 10; // Số lượng bản ghi mỗi trang

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const offset = (page - 1) * limit;
      const response = await axios.get<CreditInfoResponse>(`/api/credits/info?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = response.data;
      
      if (data.success) {
        setLogs(data.history || []);
        setBalance(data.balance || 0);
        setTotalSpent(data.totalSpent || 0);
        const total = data.total || 0;
        setTotalPages(Math.ceil(total / limit));
      } else {
        throw new Error(data.error || "Không thể tải lịch sử credit");
      }
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || "Lỗi khi tải lịch sử credit");
    }
    setLoading(false);
  }

  async function fetchPackages() {
    setLoadingPackages(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get<CreditPricesResponse>(`/api/credits/prices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = response.data;
      
      if (data.success) {
        setPackages(data.packages || []);
      } else {
        throw new Error(data.error || "Không thể tải gói credit");
      }
    } catch (e: any) {
      console.error("Lỗi khi tải gói credit:", e);
    }
    setLoadingPackages(false);
  }

  const handlePurchase = async (packageId: number) => {
    try {
      setPurchasingPackageId(packageId);
      const token = localStorage.getItem("token");
      const response = await axios.post<CreditPurchaseResponse>("/api/credits/purchase", 
        { packageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const data = response.data;
      
      if (data.success) {
        alert(`Mua credit thành công! +${data.credits} credits`);
        fetchLogs();
        refreshUser();
        setShowPurchaseModal(false);
      } else {
        throw new Error(data.error || "Lỗi khi mua credit");
      }
    } catch (e: any) {
      alert("Lỗi: " + (e.response?.data?.error || e.message || "Không thể mua credit"));
    } finally {
      setPurchasingPackageId(null);
    }
  };

  const openPurchaseModal = () => {
    fetchPackages();
    setShowPurchaseModal(true);
  };

  // Hàm chuyển đổi tên API thành tên hiển thị thân thiện hơn
  const getActionDisplayName = (action: string) => {
    const actionMap: Record<string, string> = {
      'create_script': 'Tạo kịch bản',
      'generate_image': 'Tạo hình ảnh',
      'create_voice': 'Tạo giọng đọc',
      'merge_video_voice': 'Ghép video và giọng đọc',
      'analyze_content': 'Phân tích nội dung',
      'concat_videos': 'Ghép nhiều video',
      'add_credit': 'Nạp credit',
    };
    
    return actionMap[action] || action;
  };

  // Format giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) return <div className="mt-8 text-center text-sm text-gray-500">Đang tải lịch sử credit...</div>;
  if (error) return <div className="mt-8 text-center text-red-500 text-sm">{error}</div>;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-primary">Lịch sử credit</h3>
        <Button 
          onClick={openPurchaseModal} 
          color="green"
          size="sm"
        >
          Mua thêm credit
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-md bg-blue-50">
          <div className="text-sm text-gray-600">Số dư hiện tại</div>
          <div className="text-xl font-bold text-blue-600">{balance} credits</div>
        </div>
        <div className="p-4 border rounded-md bg-green-50">
          <div className="text-sm text-gray-600">Tổng đã chi tiêu</div>
          <div className="text-xl font-bold text-green-600">{totalSpent} credits</div>
        </div>
      </div>

      {!logs.length ? (
        <div className="text-center text-gray-500 text-sm">Chưa có lịch sử credit.</div>
      ) : (
        <>
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
                    <td className="py-2 px-2">{getActionDisplayName(log.action)}</td>
                    <td className={`py-2 px-2 font-bold ${log.delta > 0 ? "text-green-600" : "text-red-600"}`}>{log.delta > 0 ? "+" : ""}{log.delta}</td>
                    <td className="py-2 px-2">{log.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="flex gap-1">
                <Button 
                  size="xs" 
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  &laquo; Trước
                </Button>
                <div className="px-4 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  Trang {page}/{totalPages}
                </div>
                <Button 
                  size="xs" 
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau &raquo;
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal mua credit */}
      <Modal 
        opened={showPurchaseModal} 
        onClose={() => setShowPurchaseModal(false)}
        title="Mua thêm credit" 
        size="lg"
      >
        {loadingPackages ? (
          <div className="text-center py-8">Đang tải thông tin gói credit...</div>
        ) : packages.length === 0 ? (
          <div className="text-center py-8">Không có gói credit nào khả dụng.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {packages.map((pkg) => (
              <Card key={pkg.id} shadow="sm" withBorder className="relative overflow-hidden">
                <Card.Section bg="blue.6" p="xs" className="text-white">
                  <Text fw={600} size="lg">{pkg.name}</Text>
                </Card.Section>
                <div className="pt-4 pb-2 px-4">
                  <Badge size="lg" color="yellow" radius="sm" className="mb-2">
                    {pkg.credits} credits
                  </Badge>
                  <Text size="lg" fw={700} c="blue">
                    {formatPrice(pkg.price)}
                  </Text>
                  <Text size="sm" c="dimmed" mt="xs" mb="lg">
                    {pkg.description || `Gói ${pkg.name} với ${pkg.credits} credits.`}
                  </Text>
                  <Button
                    fullWidth
                    onClick={() => handlePurchase(pkg.id)}
                    loading={purchasingPackageId === pkg.id}
                    disabled={!!purchasingPackageId}
                  >
                    {purchasingPackageId === pkg.id ? 'Đang xử lý...' : 'Mua ngay'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
