"use client";

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next"; // Đã sửa lại đường dẫn import next-auth
import { authOptions } from "@/lib/auth";
import { BasicVideoProcessor } from "@/lib/workflows/basic/videoProcessor";

type PlatformType = "TikTok" | "YouTube" | "Instagram";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Lấy dữ liệu từ request
    const { imageUrl, options } = req.body;
    
    // Xử lý ảnh với các tham số cần thiết
    const userId = session.user.email || 'unknown'; // Sử dụng email làm ID nếu không có id
    
    // Kiểm tra và ép kiểu an toàn cho platform
    const validPlatforms = ['TikTok', 'YouTube', 'Instagram'];
    const platform: PlatformType = validPlatforms.includes(options.platform) 
      ? options.platform as PlatformType
      : 'YouTube'; // Sử dụng giá trị mặc định là YouTube

    // Tạo outputPath từ userId và timestamp
    const outputPath = `output_${userId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

    const result = await BasicVideoProcessor.processImage(
      imageUrl,
      outputPath,
      platform
    );
    
    // Trả về kết quả thành công
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}