// pages/index.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { DecorativeBackground } from "@/components/ui-custom/decorative-background";
import { IntroScreen } from "@/components/intro-screen";
import { GradientButton } from "@/components/ui-custom/gradient-button";
import { OutlineButton } from "@/components/ui-custom/outline-button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import DashboardWorkflow from "@/components/dashboardworkflow";

import { useUserStatus } from "@/components/UserStatusContext";

export default function Home() {
  const { user } = useUserStatus();
  const [showIntro, setShowIntro] = useState(true);
  const videoGeneratorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) setShowIntro(false);
  }, [user]);

  // Nếu thực sự muốn kiểm tra token client-side (ví dụ F5 khi chưa load user), có thể bổ sung:
  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      if (localStorage.getItem("token")) {
        setShowIntro(false);
      }
    }
  }, []);

  const handleStartApp = () => {
    setShowIntro(false);
    toast.success("Chào mừng bạn đến với ứng dụng tạo video AI!", {
      duration: 3000,
    });
  };



  const handleCreateVideo = () => {
    toast("Hãy nhập thông tin để tạo video!");
    if (videoGeneratorRef.current) {
      videoGeneratorRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Tạo particles ngẫu nhiên chỉ trên client để tránh hydration mismatch
  const [particles, setParticles] = useState<Array<{ id: number; size: number; left: string; animationDelay: string }>>([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        size: Math.random() * 10 + 5,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
      }))
    );
  }, []);

  return (
    <main className="min-h-screen pb-20 relative overflow-hidden">
      {/* Particle Background */}
      <div className="particle-background">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              width: particle.size,
              height: particle.size,
              left: particle.left,
              bottom: "-10%",
              animationDelay: particle.animationDelay,
            }}
          />
        ))}
        <DecorativeBackground />
      </div>

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative z-10"
          >
            <IntroScreen onStart={handleStartApp} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10"
          >
            <div className="container mx-auto py-12 md:py-16 px-4">
              <motion.div
                className="text-center mb-12 md:mb-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, staggerChildren: 0.2 }}
              >
                <motion.h1
                  className="text-4xl md:text-6xl font-bold mb-4 md:mb-6 gradient-heading responsive-text-xl"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  aria-label="Tạo Video Chuyên Nghiệp Cùng AI"
                >
                  Tạo Video Chuyên Nghiệp Cùng AI
                </motion.h1>
                <motion.p
                  className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto responsive-text-base leading-relaxed"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Sản xuất mọi loại hình video chỉ trong vài phút với công nghệ AI tiên tiến.
                  Dễ dàng, nhanh chóng, hiệu quả!
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <GradientButton
                    className="mt-6 px-6 py-3 text-lg pulse-button shadow-lg hover:shadow-xl"
                    data-tip="Bắt đầu tạo video ngay bây giờ!"
                    onClick={handleCreateVideo}
                    aria-label="Tạo Video Ngay"
                  >
                    Tạo Video Ngay
                  </GradientButton>
                  <DashboardWorkflow/>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}