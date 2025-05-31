import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Xác thực người dùng (chỉ admin mới có quyền thêm API)
    const user = await verifyToken(req, prisma);
    if (!user || !user.isAdmin) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Thêm API generate-image vào bảng apiPricing
    const existingApi = await prisma.apiPricing.findUnique({
      where: {
        apiName: 'generate-image'
      }
    });

    if (existingApi) {
      return res.status(200).json({ 
        success: true, 
        message: 'API generate-image đã tồn tại trong hệ thống giá',
        api: existingApi
      });
    }

    const newApi = await prisma.apiPricing.create({
      data: {
        apiName: 'generate-image',
        creditCost: 1,
        displayName: 'Tạo ảnh',
        description: 'Tạo ảnh từ mô tả hoặc tìm kiếm ảnh từ Pexels',
        isActive: true,
        sortOrder: 2
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Đã thêm API generate-image vào hệ thống giá',
      api: newApi
    });
  } catch (error: any) {
    console.error("Error adding API pricing:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
}
