"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Video, CheckCircle, Clock, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";

interface BasicPlusWelcomeProps {
  onStart: () => void;
}

const BasicPlusWelcome: React.FC<BasicPlusWelcomeProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 text-center">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <Video className="w-12 h-12 text-purple-600 mr-4" />
          <h1 className="text-4xl font-bold text-gray-800">Luồng Basic+</h1>
        </div>
        
        {/* Main content */}
        <div className="mb-10">
          <p className="text-xl text-gray-700 mb-6">
            Tạo video chất lượng cao với <span className="font-semibold text-purple-600">video stock từ Pexels</span> thay vì ảnh AI. 
            Đơn giản, nhanh chóng và hiệu quả!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <Card className="border-purple-100 hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center">
                <CheckCircle className="w-10 h-10 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Video Chất Lượng Cao</h3>
                <p className="text-gray-600 text-center">Sử dụng video stock chuyên nghiệp từ Pexels với chất lượng HD</p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-100 hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center">
                <Clock className="w-10 h-10 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tiết Kiệm Thời Gian</h3>
                <p className="text-gray-600 text-center">Không cần chờ tạo ảnh AI, chọn video có sẵn và sử dụng ngay</p>
              </CardContent>
            </Card>
            
            <Card className="border-purple-100 hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center">
                <Sparkles className="w-10 h-10 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Kết Quả Chuyên Nghiệp</h3>
                <p className="text-gray-600 text-center">Tạo video chuyên nghiệp với giọng đọc AI và hiệu ứng chuyển cảnh</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="relative h-64 w-full rounded-xl overflow-hidden mb-8">
            <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center">
              <Video className="w-16 h-16 text-white opacity-80" />
            </div>
            <Image 
              src="/images/pexels-preview.jpg" 
              alt="Pexels Video Preview"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-xl"
              onError={(e) => {
                // Fallback if image doesn't exist
                const target = e.target as HTMLImageElement;
                target.style.backgroundColor = '#f3f4f6';
              }}
            />
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg mb-8">
            <h3 className="text-lg font-semibold mb-2 text-purple-800">Quy trình làm việc đơn giản</h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>Nhập chủ đề và tóm tắt nội dung video của bạn</li>
              <li>AI sẽ tạo kịch bản phù hợp với nội dung</li>
              <li>Tìm kiếm và chọn video stock từ Pexels cho từng phân đoạn</li>
              <li>Tạo giọng đọc AI cho từng phân đoạn</li>
              <li>Kết xuất video hoàn chỉnh với hiệu ứng chuyển cảnh</li>
            </ol>
          </div>
        </div>
        
        {/* Call to action */}
        <Button 
          onClick={onStart} 
          size="lg" 
          className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          Bắt đầu tạo Video Basic+
        </Button>
        
        <p className="text-gray-500 mt-4 text-sm">
          Video stock được cung cấp bởi Pexels - Nguồn video miễn phí chất lượng cao
        </p>
      </div>
    </div>
  );
};

export default BasicPlusWelcome;
