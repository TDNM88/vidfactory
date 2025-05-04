"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Table, Button, Pagination, Loader } from '@mantine/core';

interface CreditLogItem {
  id: number;
  action: string;
  delta: number;
  note: string | null;
  createdAt: string;
}

interface CreditHistoryModalProps {
  opened: boolean;
  onClose: () => void;
}

const CreditHistoryModal: React.FC<CreditHistoryModalProps> = ({ opened, onClose }) => {
  const [history, setHistory] = useState<CreditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const limit = 10; // Số lượng bản ghi trên mỗi trang

  useEffect(() => {
    const fetchHistory = async () => {
      if (!opened) return;

      try {
        setLoading(true);
        const offset = (page - 1) * limit;
        // Lấy token từ localStorage
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/credits/info?limit=${limit}&offset=${offset}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch credit history');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setHistory(data.history);
          setBalance(data.balance);
          setTotalSpent(data.totalSpent);
          
          const total = data.total || 0;
          setTotalPages(Math.ceil(total / limit));
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err: any) {
        console.error('Error fetching credit history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [opened, page]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
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

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Lịch sử sử dụng Credit" 
      size="lg"
      overlayProps={{
        opacity: 0.55,
        blur: 3,
      }}
    >
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

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader size="md" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          Chưa có giao dịch credit nào.
        </div>
      ) : (
        <>
          <Table className="mb-4">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Thời gian</Table.Th>
                <Table.Th>Hoạt động</Table.Th>
                <Table.Th>Ghi chú</Table.Th>
                <Table.Th className="text-right">Credit</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {history.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{formatDate(item.createdAt)}</Table.Td>
                  <Table.Td>{getActionDisplayName(item.action)}</Table.Td>
                  <Table.Td>{item.note || '-'}</Table.Td>
                  <Table.Td className={`text-right font-medium ${item.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.delta >= 0 ? '+' : ''}{item.delta}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination 
                total={totalPages} 
                value={page} 
                onChange={setPage} 
                size="sm"
                withEdges
              />
            </div>
          )}
        </>
      )}
      
      <div className="flex justify-end mt-4">
        <Button onClick={onClose} variant="light">
          Đóng
        </Button>
      </div>
    </Modal>
  );
};

export default CreditHistoryModal;
