"use client"

import { motion } from "framer-motion";
import { BookOpen, Film, Edit, Download, CheckCircle } from "lucide-react";
import Link from "next/link";

export function TutorialGuide() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-4">
          Hướng Dẫn Tạo Video Với AI
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tìm hiểu cách sử dụng các luồng công việc của chúng tôi để tạo video chuyên nghiệp một cách dễ dàng.
        </p>
      </motion.div>

      {/* Luồng Cơ Bản */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        className="mb-16"
      >
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-6 md:p-8">
            <div className="flex items-center mb-6">
              <span className="text-4xl mr-4 text-emerald-500"><BookOpen /></span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Luồng Cơ Bản</h2>
            </div>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Luồng cơ bản phù hợp cho người mới bắt đầu, giúp bạn tạo video nhanh chóng với các bước đơn giản.
            </p>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Nhập Ý Tưởng Video</h3>
                  <p className="text-gray-600">Nhập ý tưởng hoặc kịch bản ngắn gọn về video bạn muốn tạo. AI sẽ dựa vào đó để xây dựng nội dung.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">AI Tạo Kịch Bản</h3>
                  <p className="text-gray-600">AI sẽ tự động tạo một kịch bản chi tiết dựa trên ý tưởng của bạn, bao gồm lời thoại và gợi ý hình ảnh.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Chọn Video và Hình Ảnh</h3>
                  <p className="text-gray-600">AI sẽ gợi ý các đoạn video và hình ảnh phù hợp từ kho tài nguyên. Bạn có thể chọn hoặc để AI tự quyết định.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Thêm Giọng Nói</h3>
                  <p className="text-gray-600">Chọn giọng đọc tự nhiên từ thư viện giọng nói của chúng tôi. AI sẽ tạo giọng nói phù hợp với kịch bản.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Hoàn Thiện và Tải Xuống</h3>
                  <p className="text-gray-600">Xem trước video và tải xuống khi bạn hài lòng. Video sẽ được xuất ở chất lượng cao.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
              <Link href="/dashboard/workflows/basic" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-shadow">
                Thử Luồng Cơ Bản
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Luồng Cơ Bản Plus */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        className="mb-16"
      >
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-6 md:p-8">
            <div className="flex items-center mb-6">
              <span className="text-4xl mr-4 text-emerald-500"><Film /></span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Luồng Cơ Bản Plus</h2>
              <span className="ml-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">Nâng Cao</span>
            </div>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Luồng Cơ Bản Plus bổ sung thêm các tính năng tùy chỉnh để bạn có thể tạo video độc đáo hơn.
            </p>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Nhập Ý Tưởng và Tùy Chỉnh</h3>
                  <p className="text-gray-600">Ngoài việc nhập ý tưởng, bạn có thể tùy chỉnh phong cách video, tone giọng, và tốc độ trình bày.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">AI Tạo Kịch Bản Chi Tiết</h3>
                  <p className="text-gray-600">AI tạo kịch bản với các tùy chọn bổ sung như hiệu ứng chuyển cảnh và gợi ý nhạc nền phù hợp với phong cách bạn chọn.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Tùy Chỉnh Hình Ảnh và Video</h3>
                  <p className="text-gray-600">Tự chọn hình ảnh, video từ kho hoặc tải lên tài liệu của riêng bạn để cá nhân hóa video.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Giọng Nói và Nhạc Nền</h3>
                  <p className="text-gray-600">Chọn giọng nói và thêm nhạc nền từ thư viện để tăng sức hút cho video của bạn.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-emerald-100 text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Xem Trước và Xuất Video</h3>
                  <p className="text-gray-600">Xem trước video, điều chỉnh các chi tiết cuối cùng và xuất video ở nhiều định dạng khác nhau.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
              <Link href="/dashboard/workflows/basic-plus" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-shadow">
                Thử Luồng Cơ Bản Plus
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Luồng Premium */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
        className="mb-16"
      >
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 opacity-80 cursor-not-allowed relative">
          <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase z-10">Sắp Ra Mắt</div>
          <div className="p-6 md:p-8">
            <div className="flex items-center mb-6">
              <span className="text-4xl mr-4 text-purple-500">💎</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Luồng Premium</h2>
            </div>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Luồng Premium cung cấp mọi công cụ bạn cần để tạo video đẳng cấp Hollywood với sự hỗ trợ ưu tiên.
            </p>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Ý Tưởng và Chiến Lược Nội Dung</h3>
                  <p className="text-gray-600">Không chỉ nhập ý tưởng, AI còn giúp bạn xây dựng chiến lược nội dung hoàn chỉnh cho video của mình.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Kịch Bản Chuyên Nghiệp</h3>
                  <p className="text-gray-600">AI tạo kịch bản chuyên sâu với các tùy chọn hiệu ứng đặc biệt và kỹ thuật kể chuyện nâng cao.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Tài Nguyên Độc Quyền</h3>
                  <p className="text-gray-600">Truy cập vào thư viện tài nguyên cao cấp với video, hình ảnh và âm nhạc độc quyền.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Chỉnh Sửa Nâng Cao</h3>
                  <p className="text-gray-600">Công cụ chỉnh sửa mạnh mẽ cho phép bạn điều chỉnh từng khung hình, hiệu ứng và chuyển cảnh.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Xuất và Phân Phối</h3>
                  <p className="text-gray-600">Xuất video ở chất lượng cao nhất và nhận hỗ trợ phân phối trực tiếp lên các nền tảng lớn.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
              <div className="px-6 py-3 bg-gray-400 text-white font-bold rounded-lg text-center cursor-not-allowed">
                Sẽ Có Mặt Sớm
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lời kêu gọi hành động cuối cùng */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.8 }}
        className="text-center mt-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
          Bắt Đầu Hành Trình Tạo Video AI Ngay Hôm Nay
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Dù bạn là người mới hay chuyên gia, chúng tôi có công cụ phù hợp để biến ý tưởng của bạn thành hiện thực.
        </p>
        <Link href="/dashboard/workflows/basic" className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-shadow inline-block">
          Thử Tạo Video Ngay
        </Link>
      </motion.div>
    </div>
  );
}
