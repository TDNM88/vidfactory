import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';
import CreditService from '../../services/CreditService';
import formidable from "formidable";
import * as fs from "node:fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import sharp from "sharp";

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);

// Kích thước video theo nền tảng
const PLATFORM_DIMENSIONS = {
  'tiktok': { width: 1080, height: 1920 }, // 9:16
  'instagram': { width: 1080, height: 1350 }, // 4:5
  'youtube': { width: 1920, height: 1080 }, // 16:9
  'facebook': { width: 1200, height: 630 }, // 1.91:1
  'default': { width: 1080, height: 1080 } // 1:1 (mặc định)
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Xác thực người dùng
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Kiểm tra và trừ credit
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    const creditResult = await creditService.deductCredit(
      userId,
      'generate-image', // Sử dụng API đã thêm vào database
      'Upload và crop ảnh',
      { username: user.username }
    );

    if (!creditResult.success) {
      return res.status(400).json({ success: false, error: creditResult.error });
    }

    // Parse form data
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      uploadDir: tmpdir(),
      filename: (_name, _ext, part) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${uniqueSuffix}-${part.originalFilename}`;
        return filename;
      },
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // Lấy thông tin nền tảng và segment index
    const platform = fields.platform?.[0] || 'default';
    const segmentIdx = parseInt(fields.segmentIdx?.[0] || '0', 10);

    // Xác định kích thước theo nền tảng
    const dimensions = PLATFORM_DIMENSIONS[platform as keyof typeof PLATFORM_DIMENSIONS] || PLATFORM_DIMENSIONS.default;

    // Đọc file ảnh
    const imageBuffer = await fs.readFile(file.filepath);

    // Crop và resize ảnh
    const processedImageBuffer = await sharp(imageBuffer)
      .resize({
        width: dimensions.width,
        height: dimensions.height,
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();

    // Chuyển đổi ảnh thành base64
    const base64Image = processedImageBuffer.toString('base64');
    const imageUrl = `data:${file.mimetype};base64,${base64Image}`;

    // Xóa file tạm
    await fs.unlink(file.filepath);

    // Trả về kết quả
    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      direct_image_url: imageUrl,
      index: segmentIdx,
      dimensions: dimensions
    });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
}
