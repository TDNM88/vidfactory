"use client"

import type React from "react"

import { motion } from "framer-motion"
import { GradientButton } from "./ui-custom/gradient-button"
import { Sparkles, ImageIcon, Mic, Video, CheckCircle, ArrowRight, Play } from "lucide-react"

interface IntroScreenProps {
  onStart: () => void
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-white">
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
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
            {/* Feature tags động */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.13, delayChildren: 0.4 } },
                hidden: {}
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3 z-20"
            >
              {[
                { icon: <Sparkles className="h-4 w-4" />, text: "5 bước đơn giản" },
                { icon: <ImageIcon className="h-4 w-4" />, text: "Đa dạng nội dung" },
                { icon: <Mic className="h-4 w-4" />, text: "Tiếng Việt tự nhiên" },
                { icon: <Video className="h-4 w-4" />, text: "AI hiện đại" },
                { icon: <CheckCircle className="h-4 w-4" />, text: "Bảo mật & riêng tư" },
                { icon: <ArrowRight className="h-4 w-4" />, text: "Tốc độ vượt trội" }
              ].map((tag, idx) => (
                <motion.div
                  key={tag.text}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ type: 'spring', stiffness: 150, damping: 16 }}
                  whileHover={{ scale: 1.08 }}
                  className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-gray-100 flex items-center gap-2 cursor-pointer"
                >
                  <div className="text-primary">{tag.icon}</div>
                  <span className="text-sm font-medium">{tag.text}</span>
                </motion.div>
              ))}
            </motion.div>
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
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 gradient-heading drop-shadow-lg relative"
            >
              Bùng Nổ Ý Tưởng, Chạm Đỉnh Viral!
              <span className="block absolute left-1/2 -bottom-1 w-2/3 -translate-x-1/2 pointer-events-none">
                <svg height="10" width="100%" viewBox="0 0 200 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8 Q 40 2 70 8 Q 100 14 130 8 Q 160 2 198 8" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round"/>
                </svg>
              </span>
            </motion.h1>
            <p className="text-xl md:text-2xl text-primary font-semibold mb-3 max-w-2xl mx-auto lg:mx-0">
              Sáng tạo video AI cực chất, viral cực nhanh – Không cần kỹ năng, chỉ cần cảm hứng!
            </p>
            <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Tận hưởng trải nghiệm sản xuất video hiện đại, tự động hóa từng bước, cá nhân hóa và bảo mật tuyệt đối.<br className="hidden md:inline"/> Chỉ cần ý tưởng, mọi thứ còn lại đã có AI lo!
            </p>
            <div className="flex justify-center lg:justify-start">
              <GradientButton onClick={onStart} className="px-8 py-3 text-lg font-bold shadow-lg hover:scale-105 transition-transform">
                Bắt đầu ngay
              </GradientButton>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// Custom illustration component that represents video creation
function VideoCreationIllustration() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/20 rounded-2xl overflow-hidden relative">
      {/* Main content frame */}
      <div className="absolute inset-8 bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Video preview area */}
        <div className="h-3/5 bg-gradient-to-r from-primary/20 to-primary/10 relative">
          {/* Video content representation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-24 h-24">
              <motion.div
                className="absolute inset-0 rounded-full bg-white/80 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <Play className="h-8 w-8 text-primary" />
              </motion.div>
            </div>
          </div>

          {/* Video timeline */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-white/90 flex items-center px-4">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "60%" }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
              />
            </div>
          </div>
        </div>

        {/* Controls area */}
        <div className="h-2/5 p-4">
          {/* Script representation */}
          <div className="space-y-2">
            <div className="w-3/4 h-3 bg-gray-200 rounded-full" />
            <div className="w-1/2 h-3 bg-gray-200 rounded-full" />
            <div className="w-2/3 h-3 bg-gray-200 rounded-full" />
          </div>

          {/* Controls representation */}
          <div className="flex justify-between mt-4">
            <div className="w-8 h-8 rounded-full bg-primary/10" />
            <div className="w-8 h-8 rounded-full bg-primary/10" />
            <div className="w-8 h-8 rounded-full bg-primary/10" />
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <motion.div
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-primary/30"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      />

      <motion.div
        className="absolute bottom-12 left-4 w-8 h-8 rounded-full bg-primary/20"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
      />

      {/* Social media icons representation */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <div className="w-6 h-6 rounded-full bg-white shadow-md" />
        <div className="w-6 h-6 rounded-full bg-white shadow-md" />
        <div className="w-6 h-6 rounded-full bg-white shadow-md" />
      </div>
    </div>
  )
}

