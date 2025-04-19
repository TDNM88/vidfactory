import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs/promises";
import { join } from "path";
import sharp from "sharp";

async function generateWithRetry(ai: GoogleGenAI, model: string, prompt: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseModalities: ["Text", "Image"],
        },
      });
      return response;
    } catch (error: any) {
      if (error.message.includes("500 Internal Server Error") && attempt < retries) {
        console.warn(`Attempt ${attempt} failed with 500 error, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const apiKey = process.env.GEMINI_API_KEY;
  const index = parseInt(formData.get("index") as string, 10);
  const prompt = formData.get("prompt") as string;
  const file = formData.get("file") as File | null;

  if (!apiKey && !file) {
    return NextResponse.json(
      { success: false, error: "Missing GEMINI_API_KEY or file" },
      { status: 500 }
    );
  }

  if (isNaN(index)) {
    return NextResponse.json(
      { success: false, error: "Invalid segment index" },
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let buffer: Buffer;
        const fileName = `image-${Date.now()}-${index}.png`;
        const filePath = join(process.cwd(), "public", "generated", fileName);
        const imageUrl = `/generated/${fileName}`;

        if (file) {
          // Xử lý upload ảnh
          controller.enqueue(
            JSON.stringify({
              type: "progress",
              index,
              message: `Đang xử lý ảnh upload cho phân đoạn ${index + 1}...`,
            }) + "\n"
          );

          const arrayBuffer = await file.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          buffer = await sharp(buffer)
            .resize(512, 512, { fit: "fill" })
            .png()
            .toBuffer();
        } else if (prompt && apiKey) {
          // Tạo ảnh bằng Gemini API
          controller.enqueue(
            JSON.stringify({
              type: "progress",
              index,
              message: `Đang tạo ảnh cho phân đoạn ${index + 1}...`,
            }) + "\n"
          );

          console.log("Generating image for index", index, "with prompt:", prompt); // Log prompt

          const ai = new GoogleGenAI({ apiKey });
          const model = "gemini-2.0-flash-exp-image-generation";
          const response = await generateWithRetry(ai, model, prompt);

          console.log("Full API Response for index", index, ":", JSON.stringify(response, null, 2));

          if (!response || !response.candidates || response.candidates.length === 0) {
            controller.enqueue(
              JSON.stringify({
                type: "error",
                index,
                message: "Không nhận được dữ liệu candidates từ API",
              }) + "\n"
            );
            controller.close();
            return;
          }

          const candidate = response.candidates[0];
          if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            console.log("Invalid candidate data for index", index, ":", JSON.stringify(candidate, null, 2));
            controller.enqueue(
              JSON.stringify({
                type: "error",
                index,
                message: "Không tìm thấy dữ liệu nội dung hoặc parts trong phản hồi",
              }) + "\n"
            );
            controller.close();
            return;
          }

          const parts = candidate.content.parts;
          const imagePart = parts.find((part) => part.inlineData);
          if (!imagePart || !imagePart.inlineData) {
            console.log("No image data in parts for index", index, ":", JSON.stringify(parts, null, 2));
            controller.enqueue(
              JSON.stringify({
                type: "error",
                index,
                message: "Không tìm thấy dữ liệu ảnh trong phản hồi",
              }) + "\n"
            );
            controller.close();
            return;
          }

          buffer = Buffer.from(imagePart.inlineData.data, "base64");
        } else {
          controller.enqueue(
            JSON.stringify({
              type: "error",
              index,
              message: "Cần cung cấp prompt hoặc file",
            }) + "\n"
          );
          controller.close();
          return;
        }

        // Lưu ảnh
        await fs.mkdir(join(process.cwd(), "public", "generated"), { recursive: true });
        await fs.writeFile(filePath, buffer);

        controller.enqueue(
          JSON.stringify({
            type: "image",
            index,
            image_path: filePath,
            direct_image_url: imageUrl,
          }) + "\n"
        );
        controller.close();
      } catch (error) {
        console.error("Error generating or uploading image for index", index, ":", error);
        controller.enqueue(
          JSON.stringify({
            type: "error",
            index,
            message: "Lỗi khi xử lý ảnh: " + (error as Error).message,
          }) + "\n"
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}