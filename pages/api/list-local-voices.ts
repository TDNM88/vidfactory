import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

const prisma = new PrismaClient();

// Define the response type
type ResponseData = {
  success: boolean;
  voices?: Array<{
    fileName: string;
    displayName: string;
    url: string;
  }>;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Require authentication for accessing voices
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Đường dẫn đến thư mục voices
    const voicesDir = path.join(process.cwd(), 'public', 'voices');
    
    // Kiểm tra thư mục có tồn tại không
    if (!fs.existsSync(voicesDir)) {
      return res.status(404).json({ success: false, error: 'Voices directory not found' });
    }
    
    // Đọc danh sách file trong thư mục
    const files = fs.readdirSync(voicesDir);
    
    // Lọc các file âm thanh (.wav, .mp3)
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.wav' || ext === '.mp3';
    });
    
    // Tạo danh sách giọng đọc
    const voices = audioFiles.map(file => {
      // Lấy tên file không có phần mở rộng
      const displayName = path.basename(file, path.extname(file));
      
      // Tạo URL cho file
      const url = `/voices/${file}`;
      
      return {
        fileName: file,
        displayName,
        url
      };
    });
    
    // Trả về danh sách giọng đọc
    return res.status(200).json({
      success: true,
      voices
    });
    
  } catch (error: any) {
    console.error('Error listing local voices:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
