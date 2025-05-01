"use client";

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BasicWorkflow from '@/app/dashboard/workflows/basic/BasicWorkflow';
import PremiumWorkflow from '@/app/dashboard/workflows/premium/PremiumWorkflow';

const WORKFLOWS = [
  {
    key: 'basic',
    name: 'Basic',
    icon: '🟢',
    desc: 'Tạo video cơ bản từ ảnh và văn bản, thao tác đơn giản, phù hợp cho người mới bắt đầu.',
    detail: (
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg mb-4 text-4xl">
          🟢
        </div>
        <h3 className="text-2xl font-extrabold mb-2 bg-gradient-to-r from-green-600 to-green-400 text-transparent bg-clip-text tracking-tight">
          Basic Workflow
        </h3>
        <p className="text-base text-gray-700 mb-4 max-w-md">
          Tự động ghép ảnh và văn bản thành video ngắn. Chọn nền tảng (TikTok, YouTube, Instagram), thêm nhạc nền hoặc giọng đọc tự động. Xuất video nhanh, phù hợp cho nội dung viral, review, chia sẻ ngắn.
        </p>
        <ul className="list-none space-y-2 mb-4">
          <li><span className="font-semibold text-green-700">✔</span> Dễ sử dụng, thao tác nhanh</li>
          <li><span className="font-semibold text-green-700">✔</span> Tối ưu cho video ngắn</li>
          <li><span className="font-semibold text-green-700">✔</span> Hỗ trợ nhiều nền tảng</li>
        </ul>
        <div className="text-sm text-gray-500 mb-2">
          <b>Phù hợp:</b> Người mới, TikToker, nội dung ngắn, review sản phẩm, chia sẻ nhanh.
        </div>
      </div>
    ),
  },
  {
    key: 'premium',
    name: 'Premium',
    icon: '⚪',
    desc: 'Thêm hiệu ứng chuyển động, chỉnh sửa nâng cao, phù hợp cho người dùng muốn video chuyên nghiệp hơn.',
    detail: (
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg mb-4 text-4xl">
          ⚪
        </div>
        <h3 className="text-2xl font-extrabold mb-2 bg-gradient-to-r from-gray-700 to-gray-400 text-transparent bg-clip-text tracking-tight">
          Premium Workflow
        </h3>
        <p className="text-base text-gray-700 mb-4 max-w-md">
          Thêm hiệu ứng chuyển động cho ảnh, zoom, pan, chuyển cảnh mượt mà. Chỉnh sửa từng phân đoạn, thêm hiệu ứng chữ, sticker, nhạc nền đa dạng. Hỗ trợ xuất video chất lượng cao, tối ưu cho YouTube, Facebook, Instagram.
        </p>
        <ul className="list-none space-y-2 mb-4">
          <li><span className="font-semibold text-gray-700">✔</span> Hiệu ứng chuyển động chuyên nghiệp</li>
          <li><span className="font-semibold text-gray-700">✔</span> Storyboard trực quan, dễ quản lý</li>
          <li><span className="font-semibold text-gray-700">✔</span> Xuất video chất lượng cao</li>
        </ul>
        <div className="text-sm text-gray-500 mb-2">
          <b>Phù hợp:</b> Nhà sáng tạo nội dung, YouTuber, video quảng cáo, vlog, hướng dẫn.
        </div>
      </div>
    ),
  },
  {
    key: 'super',
    name: 'Super',
    icon: '🟡',
    desc: 'Tích hợp AI toàn diện, tùy chỉnh sâu, dành cho nhà sáng tạo nội dung chuyên nghiệp.',
    detail: (
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg mb-4 text-4xl">
          🟡
        </div>
        <h3 className="text-2xl font-extrabold mb-2 bg-gradient-to-r from-yellow-500 to-yellow-300 text-transparent bg-clip-text tracking-tight">
          Super Workflow
        </h3>
        <p className="text-base text-gray-700 mb-4 max-w-md">
          Tùy chỉnh AI sinh video từ prompt, hình ảnh, hoặc kịch bản chi tiết. Chọn mô hình AI, điều chỉnh tham số nâng cao, kết hợp nhiều nguồn dữ liệu. Xuất video chất lượng cao, hỗ trợ nhiều định dạng và nền tảng.
        </p>
        <ul className="list-none space-y-2 mb-4">
          <li><span className="font-semibold text-yellow-600">✔</span> Tùy chỉnh AI sâu</li>
          <li><span className="font-semibold text-yellow-600">✔</span> Kết hợp nhiều nguồn dữ liệu</li>
          <li><span className="font-semibold text-yellow-600">✔</span> Dành cho dự án lớn, chuyên nghiệp</li>
        </ul>
        <div className="text-sm text-gray-500 mb-2">
          <b>Phù hợp:</b> Nhà sáng tạo chuyên nghiệp, agency, sản xuất video AI, dự án lớn.
        </div>
        <div className="text-yellow-600 font-semibold mt-2">
          (Tính năng này sẽ ra mắt trong thời gian tới. Hãy theo dõi để trải nghiệm!)
        </div>
      </div>
    ),
  },
] as const;

export default function DashboardWorkflow() {
  const [currentWorkflow, setCurrentWorkflow] = useState<'basic' | 'premium' | 'super'>('basic');
  const [showDetail, setShowDetail] = useState(true);
  const router = useRouter();

  const handleStart = () => {
    router.push(`/dashboard/workflows/${currentWorkflow}`);
  };

  return (
    <div className="dashboard-container max-w-3xl mx-auto px-2 md:px-0 py-8">
      {/* Lựa chọn workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {WORKFLOWS.map((wf) => (
          <button
            key={wf.key}
            onClick={() => {
              setCurrentWorkflow(wf.key);
              setShowDetail(true);
            }}
            className={`
              group flex flex-col items-center justify-between h-full p-6 rounded-2xl border-2 transition-all
              ${currentWorkflow === wf.key
                ? 'border-primary bg-gradient-to-br from-blue-100 to-purple-100 text-primary shadow-xl scale-105'
                : 'border-gray-200 bg-white hover:shadow-lg hover:scale-105 text-gray-700'
              }
              focus:outline-none
            `}
            aria-current={currentWorkflow === wf.key}
          >
            <div className="text-4xl mb-2">{wf.icon}</div>
            <div className="font-bold text-xl mb-1">{wf.name}</div>
            <div className="text-sm mb-3 text-center">{wf.desc}</div>
            {currentWorkflow === wf.key && (
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">
                Đang chọn
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Hiển thị info chi tiết hoặc workflow */}
      <div className="workflow-content rounded-2xl bg-white/90 shadow-xl p-8 min-h-[220px] flex flex-col items-center justify-center">
        {showDetail ? (
          <div className="w-full flex flex-col items-center animate-fade-in">
            {WORKFLOWS.find((wf) => wf.key === currentWorkflow)?.detail}
            <div className="flex justify-center mt-8">
              <button
                onClick={handleStart}
                className="px-10 py-4 rounded-full font-bold text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg animate-pulse transition hover:scale-105 focus:outline-none"
              >
                Bắt đầu ngay
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Khi chọn 'basic', luôn điều hướng sang route để màn hình welcome xuất hiện đúng flow */}
            {currentWorkflow === 'premium' && <PremiumWorkflow />}
            {currentWorkflow === 'super' && (
              <div className="text-center py-12 text-yellow-600 font-semibold text-lg">
                Super Workflow (Sắp ra mắt).<br />
                Hãy theo dõi để trải nghiệm những tính năng AI mạnh mẽ nhất!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 