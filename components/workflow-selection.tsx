"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { GradientButton } from './ui-custom/gradient-button';
import { Card, CardContent } from './ui/card';
import { Sparkles, Video, Zap, Crown, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface WorkflowSelectionProps {
  onSelectWorkflow: (workflow: string) => void;
}

const workflowRoutes = [
  {
    path: "basic",
    name: "Cơ Bản",
    icon: <Sparkles className="h-6 w-6 text-blue-500" />,
    color: "from-blue-500 to-cyan-400",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    hoverBorderColor: "hover:border-blue-400",
    bgColor: "bg-blue-50",
    description: "Tạo video nhanh chóng với quy trình đơn giản, phù hợp cho người mới bắt đầu.",
    features: [
      "Tạo kịch bản AI tự động",
      "Tối đa 5 hình ảnh/video",
      "Độ dài video tối đa 30 giây",
      "2 giọng đọc cơ bản",
      "Xuất video HD"
    ],
    credits: 10
  },
  {
    path: "basic-plus",
    name: "Basic+",
    icon: <Zap className="h-6 w-6 text-amber-500" />,
    color: "from-amber-500 to-yellow-400",
    textColor: "text-amber-600",
    borderColor: "border-amber-200",
    hoverBorderColor: "hover:border-amber-400",
    bgColor: "bg-amber-50",
    description: "Nhiều tùy chọn tùy chỉnh hơn cho những ai cần kiểm soát chi tiết.",
    badge: "Phổ biến",
    badgeColor: "bg-amber-100 text-amber-700",
    features: [
      "Tất cả tính năng của gói Cơ Bản",
      "Tối đa 10 hình ảnh/video",
      "Độ dài video tối đa 1 phút",
      "5 giọng đọc đa dạng",
      "Tùy chỉnh nhạc nền",
      "Xuất video Full HD"
    ],
    credits: 20
  },
  {
    path: "premium",
    name: "Premium",
    icon: <Video className="h-6 w-6 text-emerald-500" />,
    color: "from-emerald-500 to-teal-400",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    hoverBorderColor: "hover:border-emerald-400",
    bgColor: "bg-emerald-50",
    description: "Toàn quyền kiểm soát mọi khía cạnh của quá trình tạo video với các tính năng nâng cao.",
    features: [
      "Tất cả tính năng của gói Basic+",
      "Tối đa 20 hình ảnh/video",
      "Độ dài video tối đa 3 phút",
      "10 giọng đọc chuyên nghiệp",
      "Hiệu ứng chuyển cảnh nâng cao",
      "Xuất video 2K",
      "Xuất nhiều định dạng",
      "Ưu tiên xử lý"
    ],
    credits: 40
  },
  {
    path: "super",
    name: "Super",
    icon: <Crown className="h-6 w-6 text-purple-500" />,
    color: "from-purple-500 to-indigo-400",
    textColor: "text-purple-600",
    borderColor: "border-purple-200",
    hoverBorderColor: "hover:border-purple-400",
    bgColor: "bg-purple-50",
    description: "Trải nghiệm sản xuất video cao cấp nhất với các công nghệ AI tiên tiến và hiệu ứng đặc biệt.",
    badge: "Sắp ra mắt",
    badgeColor: "bg-purple-100 text-purple-700",
    features: [
      "Tất cả tính năng của gói Premium",
      "Số lượng hình ảnh/video không giới hạn",
      "Độ dài video tối đa 10 phút",
      "Tất cả giọng đọc cao cấp",
      "Hiệu ứng đặc biệt độc quyền",
      "Xuất video 4K",
      "Hỗ trợ kỹ thuật 24/7 VIP"
    ],
    credits: 80
  }
];

const WorkflowSelection: React.FC<WorkflowSelectionProps> = ({ onSelectWorkflow }) => {
  return (
    <div className="min-h-screen py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Chọn Luồng Sản Xuất Video
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Chúng tôi cung cấp nhiều luồng công việc khác nhau để đáp ứng mọi nhu cầu sản xuất video của bạn.
            Hãy chọn luồng phù hợp nhất với dự án của bạn.
          </motion.p>
        </div>

        {/* Workflow Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800">
            Quy Trình Sản Xuất Video
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/4 left-0 right-0 h-1 bg-emerald-200 z-0"></div>
            
            {[
              {
                step: 1,
                title: "Nhập Ý Tưởng",
                description: "Nhập ý tưởng của bạn và để AI tạo kịch bản chuyên nghiệp."
              },
              {
                step: 2,
                title: "Tùy Chỉnh Nội Dung",
                description: "Chỉnh sửa kịch bản, hình ảnh và giọng đọc theo ý muốn."
              },
              {
                step: 3,
                title: "Tạo Video",
                description: "AI tự động kết hợp các yếu tố thành video hoàn chỉnh."
              },
              {
                step: 4,
                title: "Xuất Video",
                description: "Xuất video chất lượng cao và chia sẻ lên mạng xã hội."
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                className="bg-white rounded-xl shadow-md p-6 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-center mb-2">{step.title}</h3>
                <p className="text-gray-600 text-center">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowRoutes.map((workflow, index) => (
            <motion.div
              key={workflow.path}
              className={`rounded-xl overflow-hidden shadow-lg border ${workflow.borderColor} ${workflow.hoverBorderColor} transition-all duration-300 h-full`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className={`p-6 ${workflow.bgColor}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {workflow.icon}
                    <h3 className={`text-xl font-bold ml-2 ${workflow.textColor}`}>{workflow.name}</h3>
                  </div>
                  {workflow.badge && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${workflow.badgeColor}`}>
                      {workflow.badge}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{workflow.description}</p>
              </div>
              
              <div className="p-6 bg-white">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Tín dụng</span>
                    <span className="font-bold text-lg">{workflow.credits}</span>
                  </div>
                  <div className={`h-2 w-full bg-gray-200 rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${workflow.color}`} 
                      style={{ width: `${(workflow.credits / 80) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <ul className="mb-6 space-y-2">
                  {workflow.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-5 w-5 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => onSelectWorkflow(workflow.path)}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center bg-gradient-to-r ${workflow.color} hover:opacity-90 transition-opacity`}
                >
                  <span>Chọn Luồng Này</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Tất cả các luồng đều sử dụng hệ thống tín dụng linh hoạt. Bạn chỉ trả tiền cho những gì bạn sử dụng.
          </p>
          <Link href="/pricing" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Xem chi tiết bảng giá
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkflowSelection;
