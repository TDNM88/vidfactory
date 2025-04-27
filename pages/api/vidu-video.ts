// pages/api/vidu-video.ts
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

// Kích thước theo nền tảng
const platformSizes: Record<string, { width: number; height: number }> = {
  TikTok: { width: 720, height: 1280 },
  YouTube: { width: 1280, height: 720 },
  Instagram: { width: 1080, height: 1080 },
};

// Kiểm tra trạng thái tác vụ
async function checkViduTaskStatus(taskId: string): Promise<{ state: string; video_url?: string; error?: string }> {
  const res = await fetch(`https://api.vidu.com/ent/v2/tasks/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Token ${process.env.VIDU_API_KEY}`,
    },
  });
  const data = await res.json();
  if (typeof data !== 'object' || data === null) {
    return {
      state: "unknown",
      video_url: undefined,
      error: "Invalid response format"
    };
  }
  return {
    state: (data as any).state || "unknown",
    video_url: (data as any).video_url,
    error: (data as any).error,
  };

}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, prompt, segmentIdx, platform = "TikTok" } = body;

    if (!imageUrl || !prompt || isNaN(segmentIdx)) {
      return NextResponse.json(
        { success: false, error: "Thiếu imageUrl, prompt hoặc segmentIdx không hợp lệ" },
        { status: 400 }
      );
    }

    // Kiểm tra API key
    const apiKey = process.env.VIDU_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Thiếu VIDU_API_KEY trong biến môi trường" },
        { status: 500 }
      );
    }

    // Đọc ảnh từ public/generated
    const imagePath = join(process.cwd(), "public", imageUrl);
    let imageBuffer: Buffer;
    try {
      const imgRes = await fetch(`http://localhost:3000${imageUrl}`); // Hoặc dùng fs.readFile nếu file cục bộ
      imageBuffer = Buffer.from(await imgRes.arrayBuffer());
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy ảnh tại ${imageUrl}` },
        { status: 400 }
      );
    }

    // Resize ảnh theo nền tảng
    const { width, height } = platformSizes[platform] || platformSizes.TikTok;
    const processedImageBuffer = await processImageToPlatformSize(imageBuffer, width, height);

    // Tạo session upload
    const imageFileName = `image-${Date.now()}-${segmentIdx}.png`;
    const session = await createViduUploadSession(imageFileName, processedImageBuffer.length, "image/png") as { put_url: string; uri: string };
    if (!session.put_url || !session.uri) {
      return NextResponse.json(
        { success: false, error: "Không tạo được session upload Vidu" },
        { status: 500 }
      );
    }

    // Upload ảnh
    await uploadFileToViduPutUrl(session.put_url, processedImageBuffer, "image/png");

    // Gọi Vidu img2video
    const params: ViduImg2VideoParams = {
      model: "vidu2.0",
      images: [session.uri],
      prompt,
      duration: 4,
      resolution: "720p",
      movement_amplitude: "auto",
    };
    const response = await viduImg2Video(params);
    if (response.error || !response.task_id) {
      return NextResponse.json(
        { success: false, error: response.error || "Không nhận được task_id từ Vidu" },
        { status: 500 }
      );
    }

    // Polling trạng thái tác vụ
    let status: { state: string; video_url?: string; error?: string } = { state: response.state };
    while (status.state !== "completed" && status.state !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      status = await checkViduTaskStatus(response.task_id);
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

    // Tải và lưu video
    const tempDir = join(process.cwd(), "public", "temp-videos");
    await fs.mkdir(tempDir, { recursive: true });

    const videoFileName = `vidu-${Date.now()}-${segmentIdx}.mp4`;
    const videoPath = join(tempDir, videoFileName);
    let videoUrl = `/temp-videos/${videoFileName}`;

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
  // @ts-ignore: Node.js 18+ Readable.fromWeb
  Readable.fromWeb(videoResp.body as any).pipe(writer);
} else {
  throw new Error('No video body stream');
}
      writer.on("finish", () => resolve(undefined));
      writer.on("error", reject);
    });

    return NextResponse.json({ success: true, videoUrl });
  } catch (error: any) {
    console.error("Error generating Vidu video:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi tạo video Super" },
      { status: 500 }
    );
  }
}