import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '@gradio/client';
import fetch from 'node-fetch';
import { phonemizeVietnamese } from '../../lib/phonemize-vi';
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
    const { text, segmentIdx, voiceName, voiceApiType, language, normalizeText, speed } = req.body;

    // Require authentication for all user-generated audio
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Validate input
    if (!text || segmentIdx === undefined || !voiceName) {
      return res.status(400).json({ success: false, error: 'Missing required fields: text, segmentIdx, voiceName' });
    }
    if (!voiceApiType || voiceApiType !== 'vixtts') {
      return res.status(400).json({ success: false, error: 'Invalid or missing voiceApiType. Only vixtts is supported.' });
    }

    // Kiểm tra và trừ credit của người dùng (1.5 credit cho mỗi lần tạo giọng đọc)
    const creditResult = await creditService.deductCredit(
      Number(user.id),
      'generate-voice',
      `Tạo giọng đọc cho phân đoạn ${segmentIdx}`,
      { segmentIdx, voiceName, voiceApiType }
    );

    if (!creditResult.success) {
      return res.status(402).json({ success: false, error: creditResult.error || 'Không đủ credit để tạo giọng đọc' });
    }

    // Phonemize the input text for better Vietnamese pronunciation
    const phonemizedText = phonemizeVietnamese(text);

    // Prepare output directory
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

    // Sử dụng Gradio Space của VixTTS
    const spaceId = 'sysf/vixtts-demo';
    const hfToken = process.env.HF_TOKEN;
    const client = await Client.connect(spaceId, { hf_token: hfToken as `hf_${string}` | undefined });

    // Chuẩn bị file âm thanh mẫu để gửi đến API tạo giọng đọc
    let sampleAudioBuffer: Buffer;
    const sampleVoicePath = path.join(process.cwd(), 'public', 'voices', voiceName);
    if (fs.existsSync(sampleVoicePath)) {
      sampleAudioBuffer = fs.readFileSync(sampleVoicePath);
    } else {
      // Sử dụng file âm thanh mẫu mặc định nếu không tìm thấy file mẫu đã chọn
      const defaultSampleVoiceUrl = 'https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav';
      const response = await fetch(defaultSampleVoiceUrl);
      sampleAudioBuffer = Buffer.from(await response.arrayBuffer());
    }

    // Gọi API VixTTS với file âm thanh mẫu để tạo giọng đọc mới
    let audioUrl: string;
    const result: any = await client.predict('/predict', {
      prompt: phonemizedText,
      language: language || 'vi',
      audio_file_pth: sampleAudioBuffer,
      normalize_text: normalizeText !== undefined ? normalizeText : true,
    });

    if (!result || !result.data || !result.data[0]) {
      // Trả về lỗi chi tiết nếu có
      return res.status(500).json({
        success: false,
        error: result?.message || result?.error || 'No audio file received from VixTTS API',
      });
    }
    audioUrl = result.data[0].url || result.data[0];

    // Download and save the audio file
    const response = await fetch(audioUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);

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
    console.error('Error generating voice:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}