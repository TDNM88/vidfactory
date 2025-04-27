// pages/api/create-video.ts
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import fetch from "node-fetch";
import {
  createViduUploadSession,
  uploadFileToViduPutUrl,
  processImageToPlatformSize,
  viduImg2Video,
  ViduImg2VideoParams,
} from "../../lib/vidu-api";

const platformSizes: Record<string, { width: number; height: number }> = {
  TikTok: { width: 720, height: 1280 },
  YouTube: { width: 1280, height: 720 },
  Instagram: { width: 1080, height: 1080 },
};

async function checkViduTaskStatus(taskId: string): Promise<{ state: string; video_url?: string; error?: string }> {
  const res = await fetch(`https://api.vidu.com/ent/v2/tasks/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Token ${process.env.VIDU_API_KEY}`,
    },
  });
  const data: unknown = await res.json();
  if (typeof data !== 'object' || data === null) {
    return {
      state: "unknown",
      video_url: undefined,
      error: "Invalid response format"
    };
  }
  const safeData = data as { state?: string; video_url?: string; error?: string };
  return {
    state: safeData.state || "unknown",
    video_url: safeData.video_url,
    error: safeData.error,
  };



}

import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

export async function POST(req: NextRequest) {
  // Helper: convert NextRequest headers to plain object
  function getAuthHeaderFromNextRequest(req: NextRequest): string | undefined {
    // next/server headers is a Headers instance
    return req.headers.get('authorization') || req.headers.get('Authorization') || undefined;
  }

  try {
    // --- CREDIT CHECK ---
    const prisma = new PrismaClient();
    // Build fake NextApiRequest-like object for verifyToken
    const fakeReq = { headers: { authorization: getAuthHeaderFromNextRequest(req) } } as any;
    const user = await verifyToken(fakeReq, prisma);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (user.credit < 2) return NextResponse.json({ success: false, error: 'Không đủ credit để tạo video' }, { status: 400 });
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { credit: { decrement: 2 } } }),
      prisma.creditLog.create({ data: { userId: user.id, action: 'create_video', delta: -2, note: 'Tạo video AI' } })
    ]);
    // --- END CREDIT CHECK ---
    const body = await req.json();

    // Luồng Vidu
    if (body?.vidu_image && body?.platform_width && body?.platform_height && body?.prompt) {
      let imageBuffer: Buffer;
      if (body.vidu_image.startsWith("http")) {
        const imgRes = await fetch(body.vidu_image);
        imageBuffer = Buffer.from(await imgRes.arrayBuffer());
      } else {
        imageBuffer = Buffer.from(
          body.vidu_image.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
          "base64"
        );
      }

      const resizedBuffer = await processImageToPlatformSize(
        imageBuffer,
        Number(body.platform_width),
        Number(body.platform_height)
      );

      const uploadSession = (await createViduUploadSession(
        "segment.png",
        resizedBuffer.length,
        "image/png"
      )) as { id: string; put_url: string; uri: string };

      await uploadFileToViduPutUrl(uploadSession.put_url, resizedBuffer, "image/png");

      const viduParams: ViduImg2VideoParams = {
        model: "vidu2.0",
        images: [uploadSession.uri],
        prompt: String(body.prompt),
        duration: 4,
        resolution: "720p",
        movement_amplitude: "auto",
      };
      const result = await viduImg2Video(viduParams);
      if (result.error || !result.task_id) {
        return NextResponse.json(
          { success: false, error: result.error || "Không nhận được task_id từ Vidu" },
          { status: 400 }
        );
      }

      // Polling trạng thái
      let status: { state: string; video_url?: string; error?: string } = { state: result.state };
      while (status.state !== "completed" && status.state !== "failed") {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        status = await checkViduTaskStatus(result.task_id);
        if (status.error) {
          return NextResponse.json(
            { success: false, error: status.error || "Lỗi khi kiểm tra trạng thái tác vụ" },
            { status: 500 }
          );
        }
      }

      if (status.state === "failed" || !status.video_url) {
        return NextResponse.json(
          { success: false, error: "Tác vụ Vidu thất bại hoặc không có video_url" },
          { status: 500 }
        );
      }

      // Lưu video
      const tempDir = join(process.cwd(), "public", "temp-videos");
      await fs.mkdir(tempDir, { recursive: true });

      const fileName = `vidu-${Date.now()}.mp4`;
      const videoPath = join(tempDir, fileName);
      const videoUrl = `/temp-videos/${fileName}`;

      const videoResp = await fetch(status.video_url!);
      if (!videoResp.ok) {
        return NextResponse.json(
          { success: false, error: `Lỗi khi tải video: ${videoResp.statusText}` },
          { status: 500 }
        );
      }

      const writer = createWriteStream(videoPath);
      await new Promise((resolve, reject) => {
        if (videoResp.body) {
          // @ts-ignore
          Readable.fromWeb(videoResp.body as any).pipe(writer);
        } else {
          throw new Error('No video body stream');
        }
        writer.on("finish", () => resolve(undefined));
        writer.on("error", reject);
      });

      return NextResponse.json({ success: true, videoUrl });
    }

    // Luồng cũ: Chuyển hướng sang /api/concat-videos-with-music
    if (body?.script && body?.background_music) {
      const { videoFiles, platform } = body.script;
      const musicFile = body.background_music !== "none" ? body.background_music : undefined;
      const res = await fetch(`${req.nextUrl.origin}/api/concat-videos-with-music`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoFiles: videoFiles || body.script.segments.map((seg: any) => seg.video_path).filter(Boolean),
          musicFile,
          musicVolume: 0.2,
          platform,
        }),
      });
      const data = await res.json() as { success: boolean; videoUrl?: string; script?: any; error?: string };
      if (!data.success) {
        return NextResponse.json({ success: false, error: data.error }, { status: res.status });
      }
      return NextResponse.json({
        success: true,
        videoUrl: data.videoUrl,
        script: { ...body.script, video_path: data.videoUrl },
      });
    }

    return NextResponse.json(
      { success: false, error: "Thiếu tham số vidu_image hoặc script" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}