"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Video, CheckCircle, Clock, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';

interface BasicPlusWelcomeProps {
  onStart: () => void;
}

const BasicPlusWelcome: React.FC<BasicPlusWelcomeProps> = ({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl shadow-lg"
    >
      <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-600 mb-4 text-center">
        Chào mừng bạn đến với <span className="text-amber-500">Luồng tạo video Basic+</span>
      </h1>
      <p className="text-lg text-gray-700 mb-6 max-w-xl text-center">
        Ở đây, bạn chỉ cần nhập ý tưởng, chủ đề và một số thông tin cơ bản. Hệ thống AI sẽ giúp bạn tạo kịch bản video hấp dẫn, phù hợp với nền tảng mong muốn chỉ trong vài bước đơn giản.
      </p>
      <ul className="list-disc text-left mb-6 text-gray-600 max-w-lg mx-auto pl-6">
        <li>Nhập chủ đề, tóm tắt nội dung, chọn nền tảng, phong cách ảnh...</li>
        <li>Xác nhận để AI tạo kịch bản tự động</li>
        <li>Chỉnh sửa, bổ sung chi tiết kịch bản, video, giọng đọc,... ở các bước tiếp theo</li>
        <li>Tạo video hoàn chỉnh chỉ trong vài phút!</li>
      </ul>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="mt-2 px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-lg font-bold rounded-xl shadow-md hover:scale-105 hover:opacity-90 transition-all duration-200"
      >
        Bắt đầu
      </motion.button>
    </motion.div>
  );
};

export default BasicPlusWelcome;
