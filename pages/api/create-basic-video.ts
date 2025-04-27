import type { NextApiRequest, NextApiResponse } from 'next';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

// Cấu hình fluent-ffmpeg: Ưu tiên FFMPEG_PATH, sau đó đến ffmpeg-bin/ffmpeg.exe
const ffmpegPath =
  process.env.FFMPEG_PATH ||
  (process.platform === 'win32'
    ? path.join(process.cwd(), 'ffmpeg-bin', 'ffmpeg.exe')
    : '/usr/bin/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
console.log('FFmpeg path set to:', ffmpegPath);

const ffprobePath =
  process.env.FFPROBE_PATH ||
  (process.platform === 'win32'
    ? path.join(process.cwd(), 'ffmpeg-bin', 'ffprobe.exe')
    : '/usr/bin/ffprobe');
ffmpeg.setFfprobePath(ffprobePath);
console.log('FFprobe path set to:', ffprobePath);

// Định nghĩa kiểu dữ liệu
interface PlatformSize {
  width: number;
  height: number;
}

interface RequestBody {
  imageUrl: string;
  voiceUrl?: string;
  segmentIdx: number;
  platform: string;
}

interface ResponseData {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

// Định nghĩa kích thước nền tảng
const platformSizes: Record<string, PlatformSize> = {
  TikTok: { width: 720, height: 1280 },
  YouTube: { width: 1280, height: 720 },
  Instagram: { width: 1080, height: 1080 },
};

// Thư mục lưu trữ
// Thư mục sẽ được xác định động theo userId
let OUTPUT_DIR: string;
let TEMP_DIR: string;
  console.error('Failed to create directories:', error);
}

// Promisify ffmpeg để sử dụng async/await
const ffmpegCommand = promisify(ffmpeg);

// Hàm tải file từ URL
async function downloadFile(url: string, outputPath: string): Promise<void> {
  console.log(`Downloading file from ${url} to ${outputPath}`);
  try {
    let fetchUrl = url;
    // Nếu là đường dẫn tương đối, chuyển thành URL tuyệt đối dựa vào localhost:3000
    if (url.startsWith('/')) {
      const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      fetchUrl = base.replace(/\/$/, '') + url;
    }
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    await fs.writeFile(outputPath, buffer);
    console.log(`Downloaded ${fetchUrl} to ${outputPath}`);
  } catch (error) {
    console.error(`Failed to download ${url}:`, error);
    throw error;
  }
}

// Hàm lấy thời lượng audio
async function getAudioDuration(audioPath: string): Promise<number> {
  console.log(`Getting duration for audio: ${audioPath}`);
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        console.error(`FFprobe error for ${audioPath}:`, err);
        return reject(err);
      }
      const duration = metadata.format.duration || 5; // Mặc định 5 giây nếu không có audio
      console.log(`Audio duration: ${duration} seconds`);
      resolve(duration);
    });
  });
}

// Hàm xử lý ảnh: điều chỉnh kích thước đúng với nền tảng
async function processImage(
  inputImagePath: string,
  outputImagePath: string,
  platform: string
): Promise<void> {
  const size = platformSizes[platform] || platformSizes.TikTok;
  console.log(`Processing image ${inputImagePath} to ${size.width}x${size.height}`);
  return new Promise((resolve, reject) => {
    ffmpeg(inputImagePath)
      .outputOptions([
        `-vf scale=${size.width}:${size.height}:force_original_aspect_ratio=decrease,pad=${size.width}:${size.height}:(ow-iw)/2:(oh-ih)/2`,
        '-c:v png',
      ])
      .output(outputImagePath)
      .on('end', () => {
        console.log(`Processed image to ${outputImagePath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`Error processing image ${inputImagePath}:`, err);
        reject(err);
      })
      .on('stderr', (stderr) => console.log(`FFmpeg image stderr: ${stderr}`))
      .run();
  });
}

// API handler
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Phương thức không được hỗ trợ' });
  }

  const { imageUrl, voiceUrl, segmentIdx, platform } = req.body as RequestBody;

  // Kiểm tra đầu vào
  console.log('Request body:', req.body);
  if (!imageUrl || segmentIdx < 0 || !platform) {
    return res.status(400).json({ success: false, error: 'Thiếu imageUrl, segmentIdx hoặc platform' });
  }

  if (!platformSizes[platform]) {
    return res.status(400).json({ success: false, error: `Nền tảng ${platform} không được hỗ trợ` });
  }

  try {
    // Xác thực user
    const prisma = new PrismaClient();
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const userId = String(user.id);
    OUTPUT_DIR = path.join(tmpdir(), 'generated-videos', userId);
    TEMP_DIR = path.join(tmpdir(), 'generated-audios', userId); // dùng chung temp cho audio nếu cần
    await fs.ensureDir(OUTPUT_DIR);
    await fs.ensureDir(TEMP_DIR);

    // Tạo tên file tạm và đầu ra
    const tempImageName = `${uuidv4()}.png`;
    const tempImagePath = path.join(TEMP_DIR, tempImageName);
    const processedImageName = `${uuidv4()}_processed.png`;
    const processedImagePath = path.join(TEMP_DIR, processedImageName);
    const outputVideoName = `segment_${segmentIdx}_basic.mp4`;
    const outputVideoPath = path.join(OUTPUT_DIR, outputVideoName);
    const outputVideoUrl = `/api/temp-videos/${userId}/${outputVideoName}`;

    // Tải ảnh
    await downloadFile(imageUrl, tempImagePath);

    // Xử lý ảnh: điều chỉnh kích thước
    await processImage(tempImagePath, processedImagePath, platform);

    // Lấy thời lượng audio (hoặc mặc định 5 giây nếu không có)
    let duration = 5;
    let tempAudioPath: string | undefined;
    if (voiceUrl) {
      tempAudioPath = path.join(TEMP_DIR, `${uuidv4()}.mp3`);
      await downloadFile(voiceUrl, tempAudioPath);
      duration = await getAudioDuration(tempAudioPath);
    }

    // Tạo video từ ảnh và ghép audio
    console.log(`Creating video: ${outputVideoPath}, duration: ${duration}s`);
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg()
        .input(processedImagePath)
        .inputOptions(['-loop 1'])
        .inputOptions([`-t ${duration}`])
        .videoCodec('libx264')
        .outputOptions([
          `-pix_fmt yuv420p`,
          `-vf scale=${platformSizes[platform].width}:${platformSizes[platform].height}`,
          `-t ${duration}`,
          `-r 30`, // Frame rate 30fps
        ]);

      if (tempAudioPath) {
        command
          .input(tempAudioPath)
          .audioCodec('aac')
          .outputOptions(['-shortest']);
      }

      command
        .output(outputVideoPath)
        .on('end', () => {
          console.log(`Video created: ${outputVideoPath}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`FFmpeg video creation error:`, err);
          reject(err);
        })
        .on('stderr', (stderr) => console.log(`FFmpeg video stderr: ${stderr}`))
        .run();
    });

    // Dọn dẹp file tạm
    console.log('Cleaning up temporary files');
    await fs.remove(tempImagePath);
    await fs.remove(processedImagePath);
    if (tempAudioPath) {
      await fs.remove(tempAudioPath);
    }

    // Trả về URL video
    console.log(`Returning video URL: ${outputVideoUrl}`);
    res.status(200).json({ success: true, videoUrl: outputVideoUrl });
  } catch (error) {
    let errMsg = 'Không tạo được video!';
    let errStack = '';
    if (error instanceof Error) {
      errMsg = error.message;
      errStack = error.stack || '';
    } else if (typeof error === 'string') {
      errMsg = error;
    }
    console.error('Error creating video:', error, errStack);
    res.status(500).json({ success: false, error: errMsg });
  }
}