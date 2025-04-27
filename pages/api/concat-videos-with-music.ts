import type { NextApiRequest, NextApiResponse } from "next";
import { join, resolve, normalize } from "path";
import { promises as fs } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";

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
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ConcatResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const { videoFiles, musicFile, musicVolume = 0.2, platform = "TikTok" } = req.body as ConcatRequestBody;

    if (!videoFiles || !Array.isArray(videoFiles) || videoFiles.length === 0) {
      return res.status(400).json({ success: false, error: "Danh sách video không hợp lệ" });
    }

    // Kiểm tra ffmpeg
    const ffmpegPath = join(process.cwd(), "node_modules", "ffmpeg-static", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
    if (!existsSync(ffmpegPath)) {
      return res.status(500).json({ success: false, error: `Không tìm thấy ffmpeg binary tại ${ffmpegPath}` });
    }

    // Xác thực user
    const { PrismaClient } = require('@prisma/client');
    const { verifyToken } = require('../../lib/auth');
    const prisma = new PrismaClient();
    const user = await verifyToken(req, prisma);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const userId = String(user.id);
    // Tạo thư mục lưu video riêng
    const tempDir = join(require('os').tmpdir(), 'generated-videos', userId);
    await fs.mkdir(tempDir, { recursive: true });

    // Validate video files
    console.log("[API] videoFiles received:", videoFiles);
    const videoPaths = await Promise.all(
      videoFiles.map(async (file: string) => {
        // Remove leading slash or backslash to avoid resolve ignoring 'public'
        const safeFile = file.replace(/^[/\\]+/, '');
        const filePath = resolve(process.cwd(), "public", safeFile);
        if (!existsSync(filePath)) {
          throw new Error(`Video file not found: ${file}`);
        }
        // Normalize path to use forward slashes for FFmpeg
        return normalize(filePath).replace(/\\/g, "/");
      })
    );
    console.log("[API] videoPaths for concat:", videoPaths);

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

    // Thêm nhạc nền nếu có
    let finalVideo = outputVideo;
    let videoUrl = `/temp-videos/${outputVideo.split(/[\\/]/).pop()}`;
    if (musicFile && musicFile !== "none") {
      // Support music files in public/music as well
let musicPath = resolve(process.cwd(), "public", musicFile).replace(/\\/g, "/");
if (!existsSync(musicPath)) {
  // Try public/music/<musicFile> if not found in public root
  musicPath = resolve(process.cwd(), "public", "music", musicFile).replace(/\\/g, "/");
  if (!existsSync(musicPath)) {
    throw new Error(`Music file not found: ${musicFile}`);
  }
}
      if (!existsSync(musicPath)) {
        throw new Error(`Music file not found: ${musicFile}`);
      }

      const withMusic = join(tempDir, `final-${Date.now()}.mp4`);
      await execFilePromise(ffmpegPath, [
        "-y",
        "-i", outputVideo,
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

      // Delete intermediate outputVideo
      await fs.unlink(outputVideo).catch((err) => console.warn("Failed to delete intermediate file:", err));
    }

    // Xóa file danh sách
    await fs.unlink(listFile).catch((err) => console.warn("Failed to delete list file:", err));

    return res.status(200).json({ success: true, videoUrl });
  } catch (error: any) {
    console.error("Error concatenating videos:", error);
    return res.status(500).json({ success: false, error: error.message || "Lỗi khi ghép video" });
  }
}