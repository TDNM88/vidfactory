"use client";

import { useState, useEffect } from "react";
import { VideoGenerator } from "@/components/video-generator";
import { DecorativeBackground } from "@/components/ui-custom/decorative-background";
import { IntroScreen } from "@/components/intro-screen";
import { GradientButton } from "@/components/ui-custom/gradient-button";
import { OutlineButton } from "@/components/ui-custom/outline-button";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);


  useEffect(() => {
    const hasSeenIntro = localStorage.getItem("hasSeenIntro");
    if (hasSeenIntro === "true") {
      setShowIntro(false);
      setHasSeenIntro(true);
    }
  }, []);

  const handleStartApp = () => {
    setShowIntro(false);
    localStorage.setItem("hasSeenIntro", "true");
    setHasSeenIntro(true);
    toast.success("Chào mừng bạn đến với ứng dụng tạo video AI!", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const handleShowIntro = () => {
    setShowIntro(true);
    toast.info("Đang hiển thị màn hình giới thiệu...");
  };

  const handleReset = () => {
    // Callback để reset trạng thái trong VideoGenerator
    toast.info("Đã quay lại trạng thái ban đầu!");
  };

  return (
    <main className="min-h-screen pb-20">
      <DecorativeBackground />
      <ToastContainer position="top-right" autoClose={3000} />

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <IntroScreen onStart={handleStartApp} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="container mx-auto py-8 md:py-12 px-4">
              <motion.div
                className="text-center mb-8 md:mb-12"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, staggerChildren: 0.2 }}
              >
                <motion.h1
                  className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 gradient-heading responsive-text-xl"
                  data-tip="Tạo video chuyên nghiệp chỉ trong vài phút!"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  Tạo Video Chuyên Nghiệp Cùng AI
                </motion.h1>
                <motion.p
                  className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto responsive-text-base"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  Sản xuất mọi loại hình video chỉ trong vài phút với công nghệ AI tiên tiến
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <GradientButton
                    className="mt-4"
                    data-tip="Bắt đầu tạo video ngay bây giờ!"
                    onClick={() => toast.info("Hãy nhập thông tin để tạo video!")}
                  >
                    Tạo Video Ngay
                  </GradientButton>
                </motion.div>
              </motion.div>

              <div className="flex justify-between mb-6">
                <OutlineButton onClick={handleShowIntro}>Xem lại hướng dẫn</OutlineButton>
                <OutlineButton onClick={handleReset}>Reset trạng thái</OutlineButton>
              </div>

              <VideoGenerator />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </main>
  );
}