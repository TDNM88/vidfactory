import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

import { viduImg2Video } from "./vidu-img2video";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body?.vidu_img2video) {
      // Nhận các tham số từ client cho API VIDU
      const result = await viduImg2Video(body.vidu_img2video);
      if (result.error) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, ...result });
    }
    // Logic cũ:
    const { script, background_music } = body;

    // Get session ID from cookies (must await cookies() in Next.js 13+)
    const cookieStore = await cookies();
    let sessionId = (await cookieStore.get("session_id"))?.value;
    if (!sessionId) {
      sessionId = uuidv4();
      await cookieStore.set("session_id", sessionId);
    }

    // === Tạo video thật ===
    const { join } = await import("path");
    const fs = await import("fs/promises");
    const util = await import("util");
    const { execFile } = await import("child_process");
    const ffmpegPath = join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe");
    const execFilePromise = util.promisify(execFile);
    const { existsSync } = await import("fs");
    console.log("DEBUG ffmpegPath:", ffmpegPath);
    if (!ffmpegPath) {
      console.log("ffmpegPath is null or undefined");
      return NextResponse.json({ success: false, error: "Không tìm thấy ffmpeg binary (ffmpegPath null)" }, { status: 500 });
    }
    console.log("ffmpeg exists:", existsSync(ffmpegPath));
    if (!existsSync(ffmpegPath)) {
      return NextResponse.json({ success: false, error: `Không tìm thấy ffmpeg binary tại ${ffmpegPath}` }, { status: 500 });
    }

    // 1. Ghép từng segment thành video nhỏ
    const segmentVideoPaths: string[] = [];
    for (let i = 0; i < script.segments.length; i++) {
      const seg = script.segments[i];
      const img = seg.direct_image_url;
      const audio = seg.audio_path || seg.voice_path || seg.direct_voice_url;
      if (!img || !audio) continue;
      const os = await import("os");
      const segmentVideo = join(os.tmpdir(), `segment-${Date.now()}-${i}.mp4`);
      // Lấy kích thước nền tảng từ script, fallback nếu không có
      const platform_width = script.platform_width || 1080;
      const platform_height = script.platform_height || 1920;
      // ffmpeg: ghép ảnh + audio thành video segment, resize/canvas đúng size nền tảng
      await execFilePromise(ffmpegPath, [
        "-y",
        "-loop", "1",
        "-i", img,
        "-i", audio,
        "-vf", `scale=w=${platform_width}:h=${platform_height}:force_original_aspect_ratio=increase,crop=${platform_width}:${platform_height}`,
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        segmentVideo
      ]);
      segmentVideoPaths.push(segmentVideo);
    }

    // 2. Ghép các segment video lại thành video tổng
    if (segmentVideoPaths.length === 0) {
      return NextResponse.json({ success: false, error: "Không có segment hợp lệ (thiếu ảnh hoặc audio) để ghép video." }, { status: 400 });
    }
    const os = await import("os");
    const listFile = join(os.tmpdir(), `list-${Date.now()}.txt`);
    await fs.writeFile(listFile, segmentVideoPaths.map(path => `file '${path}'`).join('\n'));
    const outputVideo = join(os.tmpdir(), `video-${Date.now()}.mp4`);
    await execFilePromise(ffmpegPath, [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-c", "copy",
      outputVideo
    ]);

    // 3. Nếu có nhạc nền, chèn nhạc nền vào video tổng
    let finalVideo = outputVideo;
    if (background_music && background_music !== "none") {
      const musicPath = join(process.cwd(), "public", "music", background_music);
      if (existsSync(musicPath)) {
        const withMusic = join(os.tmpdir(), `video-music-${Date.now()}.mp4`);
        await execFilePromise(ffmpegPath, [
          "-y",
          "-i", outputVideo,
          "-i", musicPath,
          "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=3",
          "-c:v", "copy",
          "-shortest",
          withMusic
        ]);
        finalVideo = withMusic;
      }
    }

    // trả về đường dẫn của file tạm
    const filename = finalVideo.split(/[/\\]/).pop();    
    // Đường dẫn public
    const videoPath = "/generated/" + filename.replace(/\\/g, "/");
    script.video_path = videoPath;

    return NextResponse.json({
      success: true,
      video_path: videoPath,
      script,
    })
  } catch (error) {
    console.error("Error creating video:", error)
    return NextResponse.json({ success: false, error: "Lỗi máy chủ nội bộ" }, { status: 500 })
  }
}

