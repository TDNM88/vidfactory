// pages/api/veo-video.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { join } from "path";
import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, script, segmentIdx } = body;

    if (!imageUrl || !script || isNaN(segmentIdx)) {
      return NextResponse.json(
        { success: false, error: "Thiếu imageUrl, script hoặc segmentIdx không hợp lệ" },
        { status: 400 }
      );
    }

    // Khởi tạo GoogleGenAI
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Thiếu GOOGLE_API_KEY trong biến môi trường" },
        { status: 500 }
      );
    }
    const ai = new GoogleGenAI({ apiKey });

    // Đọc ảnh từ public/generated
    const imagePath = join(process.cwd(), "public", imageUrl);
    let imageBytes: Buffer;
    try {
      imageBytes = await fs.readFile(imagePath);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy ảnh tại ${imageUrl}` },
        { status: 400 }
      );
    }

    // Chuyển ảnh thành base64
    const mimeType = imageUrl.endsWith(".png") ? "image/png" : "image/jpeg";
    const imageBase64 = imageBytes.toString("base64");

    // Tạo thư mục lưu video
    const tempDir = join(process.cwd(), "public", "temp-videos");
    await fs.mkdir(tempDir, { recursive: true });

    // Gọi Veo API
    let operation = await ai.models.generateVideos({
      model: "veo-2.0-generate-001",
      prompt: script, // Sử dụng script làm prompt
      image: {
        imageBytes: imageBase64,
        mimeType,
      },
      config: {
        aspectRatio: "16:9", // Tỷ lệ phù hợp với YouTube/TikTok
        numberOfVideos: 1, // Chỉ tạo 1 video
      },
    });

    // Polling cho đến khi hoàn tất
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Chờ 10s
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    // Kiểm tra kết quả
    if (!operation.response?.generatedVideos?.length) {
      return NextResponse.json(
        { success: false, error: "Không nhận được video từ Veo API" },
        { status: 500 }
      );
    }

    // Tải và lưu video
    const generatedVideo = operation.response.generatedVideos[0];
    const videoUri = generatedVideo.video?.uri;
    if (!videoUri) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy URI video trong phản hồi" },
        { status: 500 }
      );
    }

    const fileName = `veo-${Date.now()}-${segmentIdx}.mp4`;
    const videoPath = join(tempDir, fileName);
    const videoUrl = `/temp-videos/${fileName}`;

    const resp = await fetch(`${videoUri}&key=${apiKey}`);
    if (!resp.ok) {
      return NextResponse.json(
        { success: false, error: `Lỗi khi tải video: ${resp.statusText}` },
        { status: 500 }
      );
    }

    const writer = createWriteStream(videoPath);
    await new Promise((resolve, reject) => {
      Readable.fromWeb(resp.body).pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    return NextResponse.json({ success: true, videoUrl });
  } catch (error: any) {
    console.error("Error generating Veo video:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi khi tạo video Premium" },
      { status: 500 }
    );
  }
}