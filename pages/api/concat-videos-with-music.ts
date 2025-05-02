import type { NextApiRequest, NextApiResponse } from "next";
import { join, resolve, normalize } from "path";
import { promises as fs } from "fs";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../utils/auth';
import CreditService from '../../services/CreditService';

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);
const execFilePromise = promisify(execFile);

interface ConcatRequestBody {
  videoFiles: string[];
  musicFile?: string;
  musicVolume?: number;
  platform?: string;
}

interface ConcatResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
  debug?: any;
  credits?: {
    cost: number;
    remaining: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ConcatResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
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
      'concat_videos', 
      'Ghép nhiều video với nhạc nền',
      { username: user.username }
    );

    if (!creditResult.success) {
      return res.status(400).json({ success: false, error: creditResult.error });
    }

    console.log(`User ${user.username} deducted ${creditResult.creditCost} credits for concatenating videos with music`);

    const { videoFiles, musicFile, musicVolume = 0.2, platform = "TikTok" } = req.body as ConcatRequestBody;

    if (!videoFiles || !Array.isArray(videoFiles) || videoFiles.length === 0) {
      return res.status(400).json({ success: false, error: "Danh sách video không hợp lệ" });
    }

    // Kiểm tra ffmpeg
    const ffmpegPath = join(process.cwd(), "node_modules", "ffmpeg-static", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
    if (!existsSync(ffmpegPath)) {
      return res.status(500).json({ success: false, error: `Không tìm thấy ffmpeg binary tại ${ffmpegPath}` });
    }

    // Kiểm tra ffprobe
    const ffprobePath = join(process.cwd(), "node_modules", "ffprobe-static", "bin", process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
    if (!existsSync(ffprobePath)) {
      return res.status(500).json({ success: false, error: `Không tìm thấy ffprobe binary tại ${ffprobePath}` });
    }

    // Tạo thư mục lưu video
    const tempDir = join(process.cwd(), "public", "temp-videos");
    await fs.mkdir(tempDir, { recursive: true });

    // Validate video files
    console.log("[API] videoFiles received:", videoFiles);
    
    // Debug chi tiết mỗi file để kiểm tra đường dẫn
    videoFiles.forEach((file, index) => {
      console.log(`[API Debug] Video file ${index + 1}:`, {
        path: file,
        exists: file ? existsSync(join(process.cwd(), 'public', file.replace(/^[/\\]+/, ''))) : false
      });
    });
    
    const videoPaths = await Promise.all(
      videoFiles.map(async (file: string) => {
        let filePath = '';
        // Nếu là URL API dạng /api/user-files?type=generated-videos&filename=...&userId=...
        if (file.startsWith('/api/user-files')) {
          const url = new URL('http://localhost' + file); // base URL giả để parse
          const type = url.searchParams.get('type');
          const filename = url.searchParams.get('filename');
          const userId = url.searchParams.get('userId');
          if (type === 'generated-videos' && filename && userId) {
            filePath = resolve(process.cwd(), 'public', 'generated-videos', String(userId), filename);
          } else {
            throw new Error(`Invalid video URL params: ${file}`);
          }
        } else {
          // Remove leading slash or backslash to avoid resolve ignoring 'public'
          const safeFile = file.replace(/^[/\\]+/, '');
          filePath = resolve(process.cwd(), 'public', safeFile);
        }
        if (!existsSync(filePath)) {
          throw new Error(`Video file not found: ${file}`);
        }
        // Normalize path to use forward slashes for FFmpeg
        return normalize(filePath).replace(/\\/g, "/");
      })
    );
    console.log("[API] videoPaths for concat:", videoPaths);

    // Lấy thông tin về thời lượng của mỗi video
    const videoDurations = await Promise.all(
      videoPaths.map(async (path) => {
        const duration = await getMediaDuration(ffprobePath, path);
        return { path, duration };
      })
    );

    // Tính tổng thời lượng âm thanh trong video
    const totalAudioDuration = videoDurations.reduce((sum, video) => sum + video.duration, 0);
    console.log(`[API] Total audio duration: ${totalAudioDuration} seconds`);

    // Tạo file danh sách video
    const listFile = join(tempDir, `list-${Date.now()}.txt`);
    const fileListContent = videoPaths.map((path) => `file '${path}'`).join("\n");
    await fs.writeFile(listFile, fileListContent);

    // Log file list for debugging
    console.log("[API] FFmpeg concat list file:");
    console.log(fileListContent);
    console.log("[API] FFmpeg concat list file path:", listFile);

    // Ghép các video
    const outputVideo = join(tempDir, `concat-${Date.now()}.mp4`);
    await execFilePromise(ffmpegPath, [
      "-y", // Overwrite output files
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-c:v", "libx264", // Re-encode to ensure compatibility
      "-c:a", "aac",
      "-b:a", "192k",
      "-pix_fmt", "yuv420p", // Ensure compatibility with most players
      "-movflags", "+faststart", // Optimize for web streaming
      outputVideo,
    ]).catch((err) => {
      throw new Error(`FFmpeg concat error: ${err.stderr || err.message}`);
    });

    // Xác nhận thời lượng của video đầu ra
    const outputDuration = await getMediaDuration(ffprobePath, outputVideo);
    console.log(`[API] Output video duration before adding music: ${outputDuration} seconds`);

    // Thêm nhạc nền nếu có
    let finalVideo = outputVideo;
    let videoUrl = `/temp-videos/${outputVideo.split(/[\\/]/).pop()}`;
    if (musicFile && musicFile !== "none") {
      // Support music files in public/musics
      let musicPath = resolve(process.cwd(), "public", "musics", musicFile).replace(/\\/g, "/");
      if (!existsSync(musicPath)) {
        throw new Error(`Music file not found: ${musicFile}`);
      }

      const withMusic = join(tempDir, `final-${Date.now()}.mp4`);
      
      // Lấy thời lượng nhạc
      const musicDuration = await getMediaDuration(ffprobePath, musicPath);
      console.log(`[API] Music duration: ${musicDuration} seconds`);
      
      // Nếu nhạc ngắn hơn video, loop nó
      const loopOption = musicDuration < outputDuration ? ["-stream_loop", Math.ceil(outputDuration / musicDuration).toString()] : [];
      
      await execFilePromise(ffmpegPath, [
        "-y",
        "-i", outputVideo,
        ...loopOption,
        "-i", musicPath,
        "-filter_complex",
        `[0:a]volume=1[a];[1:a]volume=${musicVolume}[b];[a][b]amix=inputs=2:duration=first`,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        withMusic,
      ]).catch((err) => {
        throw new Error(`FFmpeg music error: ${err.stderr || err.message}`);
      });

      finalVideo = withMusic;
      videoUrl = `/temp-videos/${withMusic.split(/[\\/]/).pop()}`;

      // Xác nhận thời lượng video cuối cùng
      const finalDuration = await getMediaDuration(ffprobePath, finalVideo);
      console.log(`[API] Final video duration: ${finalDuration} seconds`);

      // So sánh với thời lượng âm thanh ban đầu
      if (Math.abs(finalDuration - totalAudioDuration) > 1) {
        console.warn(`[API] Warning: Final video duration (${finalDuration}s) differs from total audio duration (${totalAudioDuration}s)`);
      }

      // Delete intermediate outputVideo
      await fs.unlink(outputVideo).catch((err) => console.warn("Failed to delete intermediate file:", err));
    }

    // Xóa file danh sách
    await fs.unlink(listFile).catch((err) => console.warn("Failed to delete list file:", err));

    // Trả về kết quả
    return res.status(200).json({ 
      success: true, 
      videoUrl,
      credits: {
        cost: creditResult.creditCost ?? 0,
        remaining: creditResult.remainingCredit ?? 0
      },
      debug: {
        videoDurations,
        totalAudioDuration,
        finalDuration: await getMediaDuration(ffprobePath, finalVideo)
      }
    });
  } catch (error: any) {
    console.error("[API] Error in concat-videos-with-music:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Lỗi không xác định khi ghép video"
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Hàm lấy thời lượng của file media
async function getMediaDuration(ffprobePath: string, mediaPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let duration = "";
    
    const ffprobe = spawn(ffprobePath, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      mediaPath
    ]);
    
    ffprobe.stdout.on("data", (data) => {
      duration += data.toString();
    });
    
    ffprobe.stderr.on("data", (data) => {
      console.error(`FFprobe error: ${data}`);
    });
    
    ffprobe.on("close", (code) => {
      if (code === 0 && duration.trim()) {
        resolve(parseFloat(duration.trim()));
      } else {
        console.error(`FFprobe failed with code ${code}`);
        // Trả về giá trị mặc định nếu không thể lấy thời lượng
        resolve(10); 
      }
    });
  });
}