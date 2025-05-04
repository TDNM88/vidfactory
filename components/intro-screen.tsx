"use client"

import type React from "react"

import { motion } from "framer-motion"
import { GradientButton } from "./ui-custom/gradient-button"
import { Sparkles, ImageIcon, Mic, Video, CheckCircle, ArrowRight, Play, Wand2, Zap, Clock, LayoutGrid, Layers, Film, Clapperboard } from "lucide-react"
import Link from "next/link";
import Image from "next/image";
import { VideoCreationIllustration } from './illustrations';

interface IntroScreenProps {
  onStart: () => void
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-white">
      {/* Hero Section với Grid Ảnh */}
      <div className="relative w-full max-w-7xl mx-auto mb-16">
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
        
        {/* Nội dung overlay */}
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center text-white px-6 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="inline-block px-4 py-2 bg-emerald-500/30 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
              Công Nghệ AI Tiên Tiến
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg">
              Xưởng Phim <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">AI</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto text-white/90 mb-8 drop-shadow-md">
              Biến ý tưởng thành video chuyên nghiệp chỉ trong vài phút
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {['Quảng cáo', 'Giáo dục', 'Mạng xã hội', 'Thuyết trình', 'Sự kiện', 'Marketing'].map((tag, index) => (
                <motion.span 
                  key={tag}
                  className="text-sm font-medium text-white bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col md:flex-row gap-4 justify-center items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <GradientButton onClick={onStart} size="lg" className="px-8 py-6 text-lg">
                  <Clapperboard className="mr-2 h-5 w-5" />
                  Bắt Đầu Sáng Tạo
                </GradientButton>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/examples" className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <Play className="h-5 w-5" />
                  <span>Xem Video Mẫu</span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Cụm 1: Animation + Feature tags */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="order-2 lg:order-1"
      >
        <div className="relative aspect-[4/3] min-h-[420px] w-full max-w-xl mx-auto flex items-center justify-center lg:min-h-[520px]">
          {/* Overlay mờ nhẹ để làm dịu ảnh phụ */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-2xl pointer-events-none z-0" />
          {/* Main image (custom illustration) */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl z-10">
            <div className="relative w-full h-full">
              <VideoCreationIllustration />
            </div>
          </div>
          
          {/* Feature tags phân bố xung quanh minh họa */}
          {[
            { 
              icon: <Wand2 className="h-4 w-4" />, 
              text: "AI tạo video tự động",
              position: "top-4 left-4",
              delay: 0.2,
              animation: { y: [-5, 0, -5], x: [3, 0, 3] }
            },
            { 
              icon: <ImageIcon className="h-4 w-4" />, 
              text: "Kho video chất lượng",
              position: "top-4 right-4", 
              delay: 0.4,
              animation: { y: [-3, 2, -3], x: [-2, 0, -2] }
            },
            { 
              icon: <Mic className="h-4 w-4" />, 
              text: "Giọng đọc tự nhiên",
              position: "top-1/3 right-8", 
              delay: 0.6,
              animation: { y: [0, -4, 0], x: [-3, 0, -3] }
            },
            { 
              icon: <Video className="h-4 w-4" />, 
              text: "Nhiều định dạng",
              position: "bottom-1/3 left-6", 
              delay: 0.5,
              animation: { y: [3, 0, 3], x: [0, 4, 0] }
            },
            { 
              icon: <CheckCircle className="h-4 w-4" />, 
              text: "Xuất video HD",
              position: "bottom-16 right-8", 
              delay: 0.3,
              animation: { y: [2, -2, 2], x: [-2, 2, -2] }
            },
            { 
              icon: <ArrowRight className="h-4 w-4" />, 
              text: "Tốc độ vượt trội",
              position: "bottom-4 left-1/3", 
              delay: 0.7,
              animation: { y: [0, 3, 0], x: [2, -2, 2] }
            }
          ].map((tag, idx) => (
            <motion.div
              key={tag.text}
              className={`absolute ${tag.position} z-20`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: tag.delay, duration: 0.5 }}
            >
              <motion.div
                animate={tag.animation}
                transition={{ 
                  duration: 4 + idx * 0.5, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
                whileHover={{ scale: 1.08 }}
                className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-emerald-100 flex items-center gap-2 cursor-pointer"
              >
                <div className="text-emerald-600">{tag.icon}</div>
                <span className="text-sm font-medium text-gray-800">{tag.text}</span>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Cụm 2: Title + CTA */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="order-1 lg:order-2 flex flex-col justify-center"
      >
        <motion.div
          className="text-center lg:text-left mb-10 mt-8 lg:mt-16 z-30 relative"
        >
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 drop-shadow-lg relative whitespace-nowrap"
          >
            Xưởng Phim AI
            <span className="block absolute left-1/2 -bottom-1 w-2/3 -translate-x-1/2 pointer-events-none">
              <svg height="10" width="100%" viewBox="0 0 200 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 8 Q 40 2 70 8 Q 100 14 130 8 Q 160 2 198 8" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
          </motion.h1>
          <p className="text-xl md:text-2xl text-emerald-600 font-semibold mb-3 max-w-2xl mx-auto lg:mx-0">
            Đột phá sáng tạo với AI - Chỉ cần ý tưởng, mọi thứ còn lại để AI lo!
          </p>
          <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            Tận hưởng trải nghiệm sản xuất video hiện đại, tự động hóa từng bước, 
            với khả năng tùy chỉnh cao và giao diện trực quan.<br className="hidden md:inline"/> 
            Biến ý tưởng thành video chất lượng cao chỉ trong vài phút!
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
