// pages/api/merge-video-voice.ts
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { promises as fs } from "fs";
import { spawn } from "child_process";

import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

export async function POST(req: NextRequest) {
  // Helper: convert NextRequest headers to plain object
  function getAuthHeaderFromNextRequest(req: NextRequest): string | undefined {
    return req.headers.get('authorization') || req.headers.get('Authorization') || undefined;
  }

  try {
    // --- CREDIT CHECK ---
    const prisma = new PrismaClient();
    // Build fake NextApiRequest-like object for verifyToken
    const fakeReq = { headers: { authorization: getAuthHeaderFromNextRequest(req) } } as any;
    const user = await verifyToken(fakeReq, prisma);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.credit < 1) return NextResponse.json({ success: false, error: 'Không đủ credit để ghép video' }, { status: 400 });
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { credit: { decrement: 1 } } }),
      prisma.creditLog.create({ data: { userId: user.id, action: 'merge_video_voice', delta: -1, note: 'Ghép video và giọng đọc' } })
    ]);
    // --- END CREDIT CHECK ---
    const body = await req.json();
    const { videoUrl, voiceUrl, segmentIdx } = body;

    if (!videoUrl || !voiceUrl || isNaN(segmentIdx)) {
      return NextResponse.json(
        { success: false, error: "Thiếu videoUrl, voiceUrl hoặc segmentIdx không hợp lệ" },
        { status: 400 }
      );
    }

    const userId = String(user.id);
    const tempDir = join(require('os').tmpdir(), 'generated-videos', userId);
    await fs.mkdir(tempDir, { recursive: true });

    const fileName = `merged-${Date.now()}-${segmentIdx}.mp4`;
    const outputFile = join(tempDir, fileName);
    const newVideoUrl = `/api/temp-videos/${userId}/${fileName}`;

    // Ghép video và giọng đọc
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-i",
        join(process.cwd(), "public", videoUrl),
        "-i",
        join(process.cwd(), "public", voiceUrl),
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        outputFile,
      ]);
      ffmpeg.on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)));
      ffmpeg.on("close", (code) =>
        code === 0 ? resolve(null) : reject(new Error(`FFmpeg failed with code ${code}`))
      );
    });

    return NextResponse.json({ success: true, videoUrl: newVideoUrl });
  } catch (error: any) {
    console.error("Error merging video and voice:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi ghép video và giọng đọc" },
      { status: 500 }
    );
  }
}