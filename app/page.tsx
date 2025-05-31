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
import DashboardWorkflowBasic from '@/components/dashboardworkflow-basic';
import DashboardWorkflowBasicPlus from '@/components/dashboardworkflow-basic-plus';
import WorkflowSelection from '@/components/workflow-selection';
import Link from 'next/link';

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [showWorkflowSelection, setShowWorkflowSelection] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const videoGeneratorRef = useRef<HTMLDivElement>(null);

  const handleStartApp = () => {
    setShowIntro(false);
    setShowWorkflowSelection(true);
    toast.success("Chào mừng bạn đến với ứng dụng tạo video AI!", {
      duration: 3000,
    });
  };

  const handleSelectWorkflow = (workflow: string) => {
    setSelectedWorkflow(workflow);
    setShowWorkflowSelection(false);
    toast.success(`Bạn đã chọn luồng ${workflow}!`, {
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
      </div>
      <AnimatePresence mode="wait">
        {showIntro ? (
          <IntroScreen onStart={handleStartApp} />
        ) : showWorkflowSelection ? (
          <motion.div
            key="workflow-selection"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative z-10"
          >
            <WorkflowSelection onSelectWorkflow={handleSelectWorkflow} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative z-10"
          >
            <div className="container mx-auto py-12 md:py-16 px-4 bg-white/70 backdrop-blur-sm rounded-lg">
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
                  Làm Phim Đỉnh Cao Với Sức Mạnh AI
                </motion.h1>
                <motion.p
                  className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto responsive-text-base leading-relaxed"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Đột phá sáng tạo với nền tảng dựng video tự động bằng trí tuệ nhân tạo.<br />
                  Chỉ cần ý tưởng, mọi thứ còn lại hãy để AI lo!<br />
                  Toàn quyền kiểm soát nhờ bảng điều khiển chuyên nghiệp <br />
                </motion.p>
                <motion.div
                  className="flex flex-col items-center mt-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex space-x-2">
                    <Link href="/login" passHref>
                      <OutlineButton size="sm">Đăng nhập</OutlineButton>
                    </Link>
                    <GradientButton onClick={() => setShowWorkflowSelection(true)} size="sm">Quay lại chọn luồng</GradientButton>
                  </div>
                </motion.div>
              </motion.div>
              {selectedWorkflow === "basic" && <DashboardWorkflowBasic voiceOptions={[]} voiceApiType="vixtts" onVoiceChange={() => {}} onGenerateVoiceForSegment={async () => {}} onEditImageDesc={() => {}} onGenerateImageForSegment={async () => {}} onConfirm={() => {}} />}
              {selectedWorkflow === "basic-plus" && <DashboardWorkflowBasicPlus voiceOptions={[]} voiceApiType="vixtts" onVoiceChange={() => {}} onGenerateVoiceForSegment={async () => {}} onEditImageDesc={() => {}} onGenerateImageForSegment={async () => {}} onConfirm={() => {}} />}
              {selectedWorkflow === "premium" && <DashboardWorkflowBasicPlus voiceOptions={[]} voiceApiType="vixtts" onVoiceChange={() => {}} onGenerateVoiceForSegment={async () => {}} onEditImageDesc={() => {}} onGenerateImageForSegment={async () => {}} onConfirm={() => {}} />}
              {selectedWorkflow === "super" && (
                <div className="text-center py-12 px-4">
                  <h2 className="text-2xl font-bold mb-4 text-purple-600">Luồng Super - Sắp ra mắt</h2>
                  <p className="text-gray-600 mb-6">
                    Chúng tôi đang phát triển luồng Super với các tính năng cao cấp nhất. 
                    Vui lòng quay lại sau hoặc chọn một luồng khác.
                  </p>
                  <GradientButton onClick={() => setShowWorkflowSelection(true)}>
                    Quay lại chọn luồng
                  </GradientButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-emerald-400">AI Video Creator</h3>
              <p className="text-gray-400 mb-4">Biến ý tưởng thành video chuyên nghiệp chỉ trong vài phút với sức mạnh của trí tuệ nhân tạo.</p>
              <p className="text-gray-500 text-sm">Phát triển bởi TDNM</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-emerald-400">Sản phẩm</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-400 hover:text-emerald-300">Tính năng</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-emerald-300">Bảng giá</Link></li>
                <li><Link href="/examples" className="text-gray-400 hover:text-emerald-300">Ví dụ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-emerald-400">Tài nguyên</h3>
              <ul className="space-y-2">
                <li><Link href="/tutorials" className="text-gray-400 hover:text-emerald-300">Hướng dẫn</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-emerald-300">Blog</Link></li>
                <li><Link href="/community" className="text-gray-400 hover:text-emerald-300">Cộng đồng</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-emerald-400">Liên hệ</h3>
              <ul className="space-y-2">
                <li><Link href="/support" className="text-gray-400 hover:text-emerald-300">Hỗ trợ</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-emerald-300">Liên hệ với chúng tôi</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-emerald-300">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} AI Video Creator - TDNM. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}