// pages/api/merge-video-voice.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../../utils/auth';
import { exec } from 'child_process';
import util from 'util';
import CreditService from '../../services/CreditService';

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);
const execPromise = util.promisify(exec);

interface ResponseData {
  success: boolean;
  videoUrl?: string;
  error?: string;
  debug?: any;
  credits?: {
    cost: number;
    remaining: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Xác thực người dùng
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Kiểm tra và trừ credit
    const creditResult = await creditService.deductCredit(
      user.id, 
      'merge_video_voice', 
      'Ghép video và giọng nói',
      { username: user.username }
    );

    if (!creditResult.success) {
      return res.status(400).json({ success: false, error: creditResult.error });
    }

    console.log(`User ${user.username} deducted ${creditResult.creditCost} credits for merging video and voice`);

    const body = req.body;
    const { videoUrl, voiceUrl, segmentIdx } = body;

    if (!videoUrl || !voiceUrl || isNaN(segmentIdx)) {
      return res.status(400).json(
        { success: false, error: "Thiếu videoUrl, voiceUrl hoặc segmentIdx không hợp lệ" }
      );
    }

    const tempDir = path.join(process.cwd(), "public", "temp-videos");
    await fs.promises.mkdir(tempDir, { recursive: true });

    const fileName = `merged-${Date.now()}-${segmentIdx}.mp4`;
    const outputFile = path.join(tempDir, fileName);
    const newVideoUrl = `/temp-videos/${fileName}`;

    // Bước 1: Xác định thời lượng của file giọng đọc và video
    const voiceDuration = await getMediaDuration(path.join(process.cwd(), "public", voiceUrl));
    if (!voiceDuration) {
      throw new Error("Không thể xác định thời lượng của file giọng đọc");
    }
    
    const videoDuration = await getMediaDuration(path.join(process.cwd(), "public", videoUrl));
    if (!videoDuration) {
      throw new Error("Không thể xác định thời lượng của file video");
    }

    console.log(`Thời lượng giọng đọc: ${voiceDuration} giây`);
    console.log(`Thời lượng video gốc: ${videoDuration} giây`);

    // Số lần lặp cần thiết để video dài bằng hoặc dài hơn giọng đọc một chút
    const loopCount = Math.ceil(voiceDuration / videoDuration);
    console.log(`Số lần lặp video: ${loopCount}`);

    // Bước 2: Ghép video và giọng đọc, với video loop để phù hợp với thời lượng giọng đọc
    await new Promise((resolve, reject) => {
      // Sử dụng ffmpeg từ ffmpeg-static
      const ffmpegPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
      if (!fs.existsSync(ffmpegPath)) {
        return reject(new Error(`Không tìm thấy ffmpeg binary tại ${ffmpegPath}`));
      }
      
      const ffmpegArgs = [
        "-y",
        "-i", path.join(process.cwd(), "public", voiceUrl)
      ];
      
      // Thêm video đầu vào nhiều lần nếu cần lặp
      if (loopCount <= 1) {
        ffmpegArgs.push("-i", path.join(process.cwd(), "public", videoUrl));
      } else {
        // Tạo danh sách file để ghép video lặp lại
        const listFilePath = path.join(tempDir, `loop-list-${Date.now()}.txt`);
        const videoPath = path.join(process.cwd(), "public", videoUrl);
        const fileContent = Array(loopCount).fill(`file '${videoPath.replace(/\\/g, "/")}'`).join('\n');
        fs.promises.writeFile(listFilePath, fileContent)
          .then(() => {
            // Thêm input là concatenated video
            ffmpegArgs.push(
              "-f", "concat",
              "-safe", "0",
              "-i", listFilePath
            );
            
            // Thêm các thông số xuất video
            ffmpegArgs.push(
              "-c:v", "libx264",
              "-c:a", "aac",
              "-map", "1:v:0", // Video từ input thứ hai (video đã concat)
              "-map", "0:a:0", // Audio từ input thứ nhất (giọng đọc)
              "-t", voiceDuration.toString(), // Cắt theo đúng thời lượng giọng đọc
              "-pix_fmt", "yuv420p",
              "-movflags", "+faststart",
              outputFile
            );
            
            // Thực thi ffmpeg
            const ffmpegCommand = `"${ffmpegPath}" ${ffmpegArgs.map(arg => `"${arg}"`).join(' ')}`;
            const ffmpeg = execPromise(ffmpegCommand);
            
            ffmpeg.then(() => {
              // Xóa file danh sách tạm sau khi hoàn thành
              fs.promises.unlink(listFilePath).catch(e => console.warn("Cannot delete temp list file:", e));
              resolve(null);
            })
            .catch(err => reject(new Error(`FFmpeg error: ${err.message}`)));
          })
          .catch(err => reject(new Error(`Error creating video list file: ${err.message}`)));
        return; // Tránh thực thi code bên dưới khi sử dụng phương pháp concatenate
      }
      
      // Nếu không cần concat (loopCount <= 1), sử dụng cách ghép trực tiếp như trước
      if (loopCount <= 1) {
        ffmpegArgs.push(
          "-c:v", "libx264", 
          "-c:a", "aac", 
          "-map", "1:v:0", // Video từ input thứ hai
          "-map", "0:a:0", // Audio từ input thứ nhất
          "-t", voiceDuration.toString(), // Cắt theo đúng thời lượng giọng đọc
          "-pix_fmt", "yuv420p",
          "-movflags", "+faststart",
          outputFile
        );
        
        const ffmpegCommand = `"${ffmpegPath}" ${ffmpegArgs.map(arg => `"${arg}"`).join(' ')}`;
        const ffmpeg = execPromise(ffmpegCommand);
        
        ffmpeg.then(() => resolve(null))
        .catch(err => reject(new Error(`FFmpeg error: ${err.message}`)));
      }
    });

    // Xác nhận thời lượng cuối cùng của video
    const finalDuration = await getMediaDuration(outputFile);
    console.log(`Thời lượng video cuối: ${finalDuration} giây`);

    // Trả về kết quả
    return res.status(200).json({ 
      success: true, 
      videoUrl: newVideoUrl,
      credits: {
        cost: creditResult.creditCost || 0,
        remaining: creditResult.remainingCredit || 0
      },
      debug: {
        voiceDuration,
        videoDuration: await getMediaDuration(path.join(process.cwd(), "public", videoUrl)),
        finalDuration
      }
    });
  } catch (error: any) {
    console.error('Error in merge-video-voice API:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

// Hàm xác định thời lượng của file media
async function getMediaDuration(mediaPath: string): Promise<number | null> {
  return new Promise((resolve) => {
    let duration = "";
    
    // Sử dụng ffprobe từ ffprobe-static package
    const ffprobeStatic = require('ffprobe-static');
    const ffprobePath = ffprobeStatic.path;
    
    if (!fs.existsSync(ffprobePath)) {
      console.error(`Không tìm thấy ffprobe binary tại ${ffprobePath}`);
      // Nếu không tìm thấy, giả định thời lượng là 30 giây để không ngắt tiến trình
      resolve(30);
      return;
    }
    
    // Chuyển mảng tham số thành chuỗi lệnh đầy đủ để sử dụng với exec
    const ffprobeCommand = `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${mediaPath}"`;
    const ffprobe = execPromise(ffprobeCommand);
    
    ffprobe.then(output => {
      duration += output.stdout;
      if (duration.trim()) {
        resolve(parseFloat(duration.trim()));
      } else {
        console.error(`FFprobe failed to get duration`);
        resolve(null);
      }
    })
    .catch(err => {
      console.error(`FFprobe error: ${err.message}`);
      resolve(null);
    });
  });
}