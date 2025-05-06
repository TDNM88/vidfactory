"use client"

import type React from "react"

import { motion } from "framer-motion"
import { GradientButton } from "./ui-custom/gradient-button"
import { Sparkles, ImageIcon, Mic, Video, CheckCircle, ArrowRight, Play, Wand2, Zap, Clock, LayoutGrid, Layers, Film, Clapperboard, Rocket } from "lucide-react"
import Link from "next/link";
import Image from "next/image";
import { VideoCreationIllustration } from './illustrations';

interface IntroScreenProps {
  onStart: () => void
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 bg-white">
      {/* Hero Section với Grid Ảnh, Title và Tagline */}
      <div className="relative w-full max-w-7xl mx-auto mb-16 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/50 z-10 rounded-3xl"></div>
        
        {/* Grid ảnh với kích thước không đồng bộ */}
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-3 rounded-3xl overflow-hidden">
          {/* Hàng 1 */}
          <div className="col-span-2 row-span-2 relative aspect-square overflow-hidden">
            <Image 
              src="/images/video-grid-1.jpg" 
              alt="Video production" 
              fill={true}
              style={{ objectFit: "cover" }}
              className="hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="col-span-1 relative aspect-video overflow-hidden">
            <Image 
              src="/images/video-grid-2.jpg" 
              alt="Camera equipment" 
              fill={true}
              style={{ objectFit: "cover" }}
              className="hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="col-span-1 relative aspect-square overflow-hidden">
            <Image 
              src="/images/video-grid-3.jpg" 
              alt="Film editing" 
              fill={true}
              style={{ objectFit: "cover" }}
              className="hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="col-span-2 relative aspect-video overflow-hidden">
            <Image 
              src="/images/video-grid-4.jpg" 
              alt="Video production" 
              fill={true}
              style={{ objectFit: "cover" }}
              className="hover:scale-110 transition-transform duration-700"
            />
          </div>
          
          {/* Hàng 2 */}
          <div className="col-span-1 relative aspect-square overflow-hidden">
            <Image 
              src="/images/video-grid-5.jpg" 
              alt="Video production" 
              fill={true}
              style={{ objectFit: "cover" }}
              className="hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="col-span-1 relative aspect-video overflow-hidden">
            <Image 
              src="/images/video-grid-6.jpg" 
              alt="Camera equipment" 
              fill={true}
              style={{ objectFit: "cover" }}
              className="hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="col-span-2 row-span-2 relative aspect-square overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
            <Image 
              src="/images/video-grid-7.jpg" 
              alt="Film editing" 
              fill={true}
              style={{ objectFit: "cover" }}
              className="hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
              <span className="text-xs font-medium text-emerald-300">AI Video Creator</span>
              <h3 className="text-xl font-bold text-white">Xưởng Phim AI</h3>
            </div>
          </div>
          
          {/* Hàng 3 */}
          <div className="col-span-2 relative aspect-video overflow-hidden">
            <Image 
              src="/images/video-grid-8.jpg" 
              alt="Video production" 
              fill={true}
              style={{ objectFit: "cover" }}
              className="hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="col-span-1 relative aspect-square overflow-hidden">
            <Image 
              src="/images/video-grid-9.jpg" 
              alt="Camera equipment" 
              fill={true}
              style={{ objectFit: "cover" }}
              className="hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="col-span-1 relative aspect-video overflow-hidden">
            <Image 
              src="/images/video-grid-10.jpg" 
              alt="Film editing" 
              fill={true}
              style={{ objectFit: "cover" }}
              className="hover:scale-110 transition-transform duration-700"
            />
          </div>
        </div>
        
        {/* Nội dung overlay với Title và Tagline */}
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center text-white px-6 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 drop-shadow-lg relative whitespace-nowrap">
              Xưởng Phim AI
              <span className="block absolute left-1/2 -bottom-2 w-1/3 -translate-x-1/2 pointer-events-none">
                <svg height="10" width="100%" viewBox="0 0 200 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8 Q 40 2 70 8 Q 100 14 130 8 Q 160 2 198 8" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round"></path>
                </svg>
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-300 font-semibold mb-6 max-w-xl mx-auto">
              Đột phá sáng tạo với AI - Chỉ cần ý tưởng, AI lo phần còn lại!
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex justify-center"
            >
              <GradientButton 
                onClick={onStart}
                className="px-10 py-4 text-lg font-bold rounded-xl shadow-lg"
              >
                <span className="flex items-center">
                  Bắt Đầu Sáng Tạo Ngay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </span>
              </GradientButton>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Phần Selling Points với UI/UX trực quan và lý giải logic */}
      <div className="w-full max-w-5xl mx-auto py-12 px-4 z-30 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 drop-shadow-lg">
            Tại Sao Chọn Xưởng Phim AI?
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Chúng tôi mang đến giải pháp sản xuất video đột phá, giúp bạn tập trung vào sáng tạo và đạt được kết quả ấn tượng.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center space-y-4 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl shadow-md border border-emerald-100"
          >
            <div className="text-emerald-600 bg-emerald-100 p-3 rounded-full w-14 h-14 flex items-center justify-center">
              <Wand2 size={28} />
            </div>
            <h3 className="font-bold text-xl text-emerald-800">Sáng tạo không giới hạn</h3>
            <p className="text-sm text-gray-600 leading-relaxed text-center max-w-xs">
              AI giúp bạn biến mọi ý tưởng thành video độc đáo và ấn tượng, không giới hạn khả năng sáng tạo. Từ kịch bản đến hình ảnh, mọi thứ đều có thể được tạo ra theo tầm nhìn của bạn.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center space-y-4 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl shadow-md border border-emerald-100"
          >
            <div className="text-emerald-600 bg-emerald-100 p-3 rounded-full w-14 h-14 flex items-center justify-center">
              <Zap size={28} />
            </div>
            <h3 className="font-bold text-xl text-emerald-800">Kiểm soát tối đa</h3>
            <p className="text-sm text-gray-600 leading-relaxed text-center max-w-xs">
              Tùy chỉnh từng chi tiết, đảm bảo video đúng như mong muốn của bạn với quyền kiểm soát hoàn toàn. Bạn có thể điều chỉnh nội dung, phong cách và cảm xúc của video bất cứ lúc nào.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col items-center space-y-4 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl shadow-md border border-emerald-100"
          >
            <div className="text-emerald-600 bg-emerald-100 p-3 rounded-full w-14 h-14 flex items-center justify-center">
              <Clock size={28} />
            </div>
            <h3 className="font-bold text-xl text-emerald-800">Tiết kiệm chi phí</h3>
            <p className="text-sm text-gray-600 leading-relaxed text-center max-w-xs">
              Giảm thiểu lãng phí với AI tạo nội dung chính xác, tránh lỗi không đáng có, tiết kiệm thời gian và nguồn lực. Bạn không cần phải quay lại nhiều lần hay chỉnh sửa liên tục.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col items-center space-y-4 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl shadow-md border border-emerald-100"
          >
            <div className="text-emerald-600 bg-emerald-100 p-3 rounded-full w-14 h-14 flex items-center justify-center">
              <LayoutGrid size={28} />
            </div>
            <h3 className="font-bold text-xl text-emerald-800">Quy trình thông minh</h3>
            <p className="text-sm text-gray-600 leading-relaxed text-center max-w-xs">
              Tự động hóa quy trình, giúp bạn tập trung vào ý tưởng sáng tạo mà không lo lắng về kỹ thuật. Từ lên ý tưởng đến xuất bản, mọi bước đều được tối ưu hóa.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-emerald-100/50 mb-12"
        >
          <h3 className="text-xl md:text-2xl font-semibold text-emerald-700 mb-3">Trải Nghiệm Sản Xuất Video Hiện Đại</h3>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Tận hưởng trải nghiệm sản xuất video hiện đại, tự động hóa từng bước, với khả năng tùy chỉnh cao và giao diện trực quan. 
            <span className="text-emerald-600 font-medium"><Rocket className="inline-block h-5 w-5 mr-1" /> Biến ý tưởng thành video chất lượng cao chỉ trong vài phút!</span>
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col md:flex-row gap-4 justify-center items-center mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <GradientButton onClick={onStart} size="lg" className="px-8 py-6 text-lg w-full md:w-auto rounded-xl shadow-lg">
            <Clapperboard className="mr-2 h-5 w-5" />
            Bắt Đầu Sáng Tạo
          </GradientButton>
          <Link href="/examples" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium transition-colors w-full md:w-auto justify-center shadow-md">
            <Play className="h-5 w-5" />
            <span>Xem Video Mẫu</span>
          </Link>
        </motion.div>
      </div>

      {/* Các phần khác nếu cần */}
    </div>
  )
}
