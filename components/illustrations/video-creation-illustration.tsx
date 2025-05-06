"use client";

import React from 'react';
import { motion } from 'framer-motion';
import ReactTooltip from 'react-tooltip';

export const VideoCreationIllustration: React.FC = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-full"
      >
        {/* Camera body */}
        <rect x="40" y="70" width="100" height="60" rx="5" fill="#4F46E5" data-tip="Camera - Ghi lại khoảnh khắc" data-for="tooltip-camera" />
        
        {/* Camera lens */}
        <circle cx="90" cy="100" r="25" fill="#1E1B4B" stroke="#6366F1" strokeWidth="3" />
        <circle cx="90" cy="100" r="15" fill="#312E81" />
        <circle cx="90" cy="100" r="8" fill="#1E1B4B" />
        
        {/* Record button with animation */}
        <motion.circle
          cx="150"
          cy="85"
          r="8"
          fill="#EF4444"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          data-tip="Nút ghi - Bắt đầu quay" data-for="tooltip-record"
        />
        
        {/* Film strip with animation */}
        <rect x="30" y="140" width="140" height="20" fill="#6366F1" data-tip="Dải phim - Câu chuyện của bạn" data-for="tooltip-film" />
        <motion.rect x="40" y="140" width="10" height="20" fill="#312E81" animate={{ x: [40, 50, 40] }} transition={{ repeat: Infinity, duration: 3 }} />
        <motion.rect x="60" y="140" width="10" height="20" fill="#312E81" animate={{ x: [60, 70, 60] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5 }} />
        <motion.rect x="80" y="140" width="10" height="20" fill="#312E81" animate={{ x: [80, 90, 80] }} transition={{ repeat: Infinity, duration: 3, delay: 1 }} />
        <motion.rect x="100" y="140" width="10" height="20" fill="#312E81" animate={{ x: [100, 110, 100] }} transition={{ repeat: Infinity, duration: 3, delay: 1.5 }} />
        <motion.rect x="120" y="140" width="10" height="20" fill="#312E81" animate={{ x: [120, 130, 120] }} transition={{ repeat: Infinity, duration: 3, delay: 2 }} />
        <motion.rect x="140" y="140" width="10" height="20" fill="#312E81" animate={{ x: [140, 150, 140] }} transition={{ repeat: Infinity, duration: 3, delay: 2.5 }} />
        
        {/* Video icon */}
        <path
          d="M160 80L180 65V115L160 100V80Z"
          fill="#6366F1"
          stroke="#4F46E5"
          strokeWidth="2"
          data-tip="Video - Sản phẩm cuối cùng" data-for="tooltip-video"
        />
      </svg>
      <ReactTooltip id="tooltip-camera" place="top" effect="solid" />
      <ReactTooltip id="tooltip-record" place="top" effect="solid" />
      <ReactTooltip id="tooltip-film" place="bottom" effect="solid" />
      <ReactTooltip id="tooltip-video" place="right" effect="solid" />
    </div>
  );
};
