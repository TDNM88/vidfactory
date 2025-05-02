"use client"

import type React from "react"

import { motion } from "framer-motion"
import { GradientButton } from "./ui-custom/gradient-button"
import { Sparkles, ImageIcon, Mic, Video, CheckCircle, ArrowRight, Play, Wand2 } from "lucide-react"
import Link from "next/link";

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
      
      {/* Workflow Selection Section - Đặt sau cụm giới thiệu và animation */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        className="mt-16 mb-12 w-full max-w-7xl mx-auto px-4"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
          Khám Phá Các Luồng Công Việc AI
        </h2>
        <p className="text-lg text-gray-600 text-center mb-10 max-w-3xl mx-auto">
          Tạo video chuyên nghiệp dễ dàng với các gói công việc được thiết kế riêng, phù hợp mọi cấp độ từ mới bắt đầu đến chuyên gia.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflowRoutes.map((route) => (
            <Link key={route.path} href={`/dashboard/workflows/${route.path}`} passHref>
              <motion.div 
                className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-gray-200 hover:border-emerald-300 relative overflow-hidden group"
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                {route.badge && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {route.badge}
                  </span>
                )}
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-3 text-emerald-500">{route.icon}</span>
                  <h3 className="text-2xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">{route.name}</h3>
                </div>
                <p className="text-gray-600 mb-4">{route.description}</p>
                <motion.div 
                  className="text-xs text-gray-500"
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Khám phá ngay {route.name.toLowerCase()} →
                </motion.div>
              </motion.div>
            </Link>
          ))}
        </div>
        
        {/* Phần Super được tách riêng để nổi bật */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
          className="mt-10 p-6 bg-white/90 rounded-xl shadow-lg border border-gray-200 relative overflow-hidden max-w-xl mx-auto"
        >
          <span className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
            Sắp ra mắt
          </span>
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3 text-purple-500">💎</span>
            <h3 className="text-2xl font-bold text-gray-800">Super</h3>
          </div>
          <p className="text-gray-600 mb-4">Mở khóa toàn bộ tiềm năng sáng tạo của AI với các tính năng cao cấp để tạo ra những sản phẩm ấn tượng nhất.</p>
          <motion.div 
            className="text-sm text-purple-600 font-medium cursor-pointer hover:underline"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Đăng ký để nhận thông báo khi ra mắt →
          </motion.div>
        </motion.div>
      </motion.div>
      
      {/* Thêm phần trình chiếu video */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
        className="mt-12 mb-16 w-full max-w-4xl mx-auto px-4"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
          Video Được Tạo Bởi AI
        </h2>
        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <motion.div 
              className="bg-white/90 backdrop-blur-sm rounded-full p-4 cursor-pointer hover:bg-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="h-8 w-8 text-emerald-600" />
            </motion.div>
          </div>
          {/* Nhúng link video */}
          <iframe className="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/D73Z4YPNRHI?si=0_5a-TW9aujMpir4&autoplay=1" title="Video giới thiệu AI" allowFullScreen></iframe>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20"></div>
        </div>
        <p className="text-center text-gray-600 mt-4">Xem cách AI biến ý tưởng thành video ấn tượng chỉ trong vài phút.</p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 max-w-3xl"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Chọn gói phù hợp với bạn</h2>
        <p className="text-gray-600 mb-6">
          Mỗi gói được thiết kế để đáp ứng nhu cầu khác nhau - từ người mới bắt đầu đến nhà sáng tạo chuyên nghiệp.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {workflowRoutes.map((workflow, index) => (
            <motion.div
              key={workflow.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              className={`bg-${workflow.bgColor}-50 rounded-lg p-5 shadow-sm border border-${workflow.bgColor}-100 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center mb-3">
                <div className={`w-10 h-10 flex items-center justify-center rounded-full bg-${workflow.bgColor}-200 text-xl mr-3`}>
                  {workflow.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{workflow.name}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4 h-16 line-clamp-3">{workflow.description}</p>
              <Link
                href={`/dashboard/workflows/${workflow.path}`}
                className={`block w-full text-center py-2 bg-${workflow.bgColor}-500 text-white rounded-lg hover:bg-${workflow.bgColor}-600 transition-colors font-medium`}
              >
                Khám phá {workflow.name}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        initial={{ x: '100vw' }}
        animate={{ x: '-100vw' }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="text-xs text-gray-500 truncate max-w-[60vw] select-none"
      >
        Ứng dụng được phát triển bởi <span className="font-semibold text-primary">TDNM</span> - mọi chi tiết xin liên hệ: <a href="mailto:aigc.tdnm@gmail.com" className="underline hover:text-primary">aigc.tdnm@gmail.com</a> hoặc hotline: <a href="tel:0984519098" className="underline hover:text-primary">0984 519 098</a>
      </motion.div>
    </div>
  )
}

// Custom illustration component that represents video creation
function VideoCreationIllustration() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl overflow-hidden relative">
      {/* Main content frame */}
      <div className="absolute inset-8 bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Video preview area */}
        <div className="h-3/5 bg-gradient-to-r from-emerald-100 to-teal-50 relative">
          {/* Video content representation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className="relative w-28 h-28"
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, 0, -2, 0]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
                animate={{ 
                  boxShadow: [
                    "0 0 0 0 rgba(16, 185, 129, 0)",
                    "0 0 0 10px rgba(16, 185, 129, 0.2)",
                    "0 0 0 0 rgba(16, 185, 129, 0)"
                  ]
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <Play className="h-10 w-10 text-emerald-600" />
              </motion.div>
            </motion.div>
          </div>

          {/* Animated elements representing video content being created */}
          <motion.div 
            className="absolute top-6 left-6 w-16 h-16 rounded-lg bg-emerald-100/80"
            animate={{ 
              opacity: [0, 1, 0],
              x: [0, 10, 0],
              y: [0, -5, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
          />
          
          <motion.div 
            className="absolute bottom-16 right-8 w-20 h-12 rounded-lg bg-teal-100/80"
            animate={{ 
              opacity: [0, 1, 0],
              x: [-10, 0, -10],
              y: [5, 0, 5]
            }}
            transition={{ duration: 4.5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
          />

          {/* Video timeline with animated progress */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-white/90 flex items-center px-4 border-t border-gray-100">
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center">
                <motion.div 
                  className="text-xs font-medium text-emerald-600"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  00:15
                </motion.div>
                <motion.div 
                  className="text-xs font-medium text-gray-500"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  01:30
                </motion.div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: ["5%", "65%", "30%", "85%", "45%"] }}
                  transition={{ 
                    duration: 15, 
                    repeat: Infinity, 
                    times: [0, 0.2, 0.5, 0.8, 1],
                    ease: "easeInOut" 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Controls area with animated elements */}
        <div className="h-2/5 p-4 relative">
          {/* Script representation with typing effect */}
          <div className="space-y-2 mb-4">
            <motion.div 
              className="w-3/4 h-3 bg-gray-200 rounded-full" 
              animate={{ width: ["50%", "75%", "65%"] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="w-1/2 h-3 bg-gray-200 rounded-full"
              animate={{ width: ["30%", "50%", "40%"] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }}
            />
            <motion.div 
              className="w-2/3 h-3 bg-gray-200 rounded-full"
              animate={{ width: ["40%", "65%", "55%"] }}
              transition={{ duration: 4.2, repeat: Infinity, repeatType: "reverse", delay: 0.4 }}
            />
          </div>

          {/* Activity indicators */}
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-2"
              animate={{ x: [0, 3, 0, -3, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              <motion.div 
                className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                animate={{ 
                  backgroundColor: ["rgb(209, 250, 229)", "rgb(167, 243, 208)", "rgb(209, 250, 229)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <motion.div 
                  className="w-4 h-4 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <motion.div 
                className="h-2 w-2 rounded-full bg-emerald-500"
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>

            <motion.div 
              className="flex items-center space-x-1"
              animate={{ y: [0, -2, 0, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="w-2 h-2 rounded-full bg-teal-400"
                  animate={{ 
                    opacity: [0.3, 1, 0.3],
                    y: [-2, 2, -2]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>

            <motion.div 
              className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              animate={{ 
                rotate: [0, 10, 0, -10, 0],
                backgroundColor: ["rgb(209, 250, 229)", "rgb(153, 246, 228)", "rgb(209, 250, 229)"]
              }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              <motion.div 
                className="w-5 h-5 rounded-md bg-teal-500"
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
          
          {/* Processing indicator */}
          <motion.div 
            className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center space-x-1"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-xs text-emerald-600 font-medium">Đang xử lý</div>
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={i}
                className="w-1 h-1 rounded-full bg-emerald-500"
                animate={{ 
                  y: [0, -3, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 0.6, 
                  repeat: Infinity, 
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Decorative elements */}
      <motion.div
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center"
        animate={{ 
          scale: [1, 1.2, 1],
          boxShadow: [
            "0 0 0 0 rgba(16, 185, 129, 0)",
            "0 0 0 8px rgba(16, 185, 129, 0.1)",
            "0 0 0 0 rgba(16, 185, 129, 0)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <motion.div 
          className="w-6 h-6 rounded-full bg-emerald-300"
          animate={{ scale: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>

      <motion.div
        className="absolute bottom-12 left-4 w-8 h-8 rounded-full bg-teal-200"
        animate={{ 
          scale: [1, 1.3, 1],
          x: [0, 5, 0, -5, 0],
          y: [0, -5, 0, 5, 0]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          times: [0, 0.25, 0.5, 0.75, 1],
          ease: "easeInOut" 
        }}
      />
      
      {/* Floating notification dots */}
      <motion.div
        className="absolute top-1/3 right-6 w-3 h-3 rounded-full bg-emerald-400"
        animate={{ 
          y: [0, -15, 0],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-12 w-2 h-2 rounded-full bg-teal-300"
        animate={{ 
          y: [0, -10, 0],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      />
      
      <motion.div
        className="absolute top-1/2 left-6 w-2 h-2 rounded-full bg-emerald-300"
        animate={{ 
          y: [0, -12, 0],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.8 }}
      />
    </div>
  )
}

export const workflowRoutes = [
  {
    path: "basic",
    name: "Basic",
    icon: "🟢",
    description: "Gói cơ bản dành cho người mới bắt đầu. Tạo video nhanh chóng với các bước đơn giản và giao diện trực quan.",
    badge: "Phổ biến",
    bgColor: "emerald"
  },
  {
    path: "basic-plus",
    name: "Basic+",
    icon: "🟡",
    description: "Nâng cấp từ Basic, thêm các tính năng chỉnh sửa nâng cao để tạo video chuyên nghiệp hơn.",
    badge: "Nâng cao",
    bgColor: "yellow"
  },
  {
    path: "premium",
    name: "Premium",
    icon: "🔴",
    description: "Giải pháp toàn diện cho nhà sáng tạo chuyên nghiệp. Tối đa hóa khả năng tùy chỉnh và tích hợp AI nâng cao.",
    badge: "Chuyên nghiệp",
    bgColor: "red"
  }
];
