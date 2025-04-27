import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type ResponseData = {
  success: boolean;
  voices?: string[];
  error?: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Phương thức không được phép' });
  }

  try {
    const refVoicesDir = path.join(process.cwd(), 'public', 'ref_voices');
    if (!fs.existsSync(refVoicesDir)) {
      return res.status(200).json({ success: true, voices: [] });
    }

    const files = fs.readdirSync(refVoicesDir).filter(file => file.endsWith('.wav') || file.endsWith('.mp3'));
    return res.status(200).json({ success: true, voices: files });
  } catch (error: any) {
    console.error('Lỗi khi liệt kê file giọng:', error);
    return res.status(500).json({ success: false, error: 'Không thể liệt kê file giọng' });
  }
}