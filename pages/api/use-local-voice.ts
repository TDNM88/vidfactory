import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';
import CreditService from '../../services/CreditService';

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);

// Define the response type
type ResponseData = {
  success: boolean;
  voice_url?: string; // direct static URL for playback
  voice_path?: string; // absolute server path for backend
  secure_voice_url?: string; // secure API route
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { text, segmentIdx, voicePath } = req.body;

    // Require authentication for all user-generated audio
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Validate input
    if (!text || segmentIdx === undefined || !voicePath) {
      return res.status(400).json({ success: false, error: 'Missing required fields: text, segmentIdx, voicePath' });
    }

    // Kiểm tra xem đường dẫn giọng đọc có hợp lệ không
    const localVoicePath = path.join(process.cwd(), 'public', voicePath.replace(/^\//, ''));
    if (!fs.existsSync(localVoicePath)) {
      return res.status(404).json({ success: false, error: 'Voice file not found' });
    }

    // Trừ credit cho người dùng (sử dụng giọng đọc có sẵn vẫn tính phí nhưng có thể ít hơn)
    try {
      // Trừ credit với API generate-voice
      await creditService.deductCredit(user.id, 'generate-voice');
    } catch (error: any) {
      return res.status(402).json({ success: false, error: error.message || 'Insufficient credits' });
    }

    // Prepare output directory for user
    const userId = String(user.id);
    const outputDir = path.join(process.cwd(), 'public', 'generated-audios', userId);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate unique file name
    const fileName = `${uuidv4()}.mp3`;
    const outputPath = path.join(outputDir, fileName);
    
    // Secure API URL for access
    const secureAudioUrl = `/api/user-files?type=generated-audios&filename=${encodeURIComponent(fileName)}&userId=${encodeURIComponent(userId)}`;
    
    // Direct static URL for playback
    const staticAudioUrl = `/generated-audios/${userId}/${fileName}`;
    
    // Absolute path for backend
    const audioAbsPath = outputPath;

    // Copy file từ thư mục voices sang thư mục generated-audios của người dùng
    fs.copyFileSync(localVoicePath, outputPath);

    // Verify the file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Failed to create audio file');
    }

    // Return all URLs
    return res.status(200).json({
      success: true,
      voice_url: staticAudioUrl,
      voice_path: audioAbsPath,
      secure_voice_url: secureAudioUrl,
    });
  } catch (error: any) {
    console.error('Error using local voice:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
