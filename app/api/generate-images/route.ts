import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs/promises";
import { join } from "path";
import { tmpdir } from "os";
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
const platform = (formData.get("platform") as string)?.toLowerCase() || "tiktok";
let resizeWidth = 512, resizeHeight = 512;
if (platform === "tiktok") {
  resizeWidth = 720; resizeHeight = 1280;
} else if (platform === "youtube") {
  resizeWidth = 1280; resizeHeight = 720;
} else if (platform === "facebook") {
  resizeWidth = 1080; resizeHeight = 1080;
}


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
      const ai = apiKey ? new GoogleGenAI({ apiKey }) : undefined;
      try {
        let buffer: Buffer;
        const fileName = `image-${Date.now()}-${index}.png`;
        const filePath = join(process.cwd(), 'public', 'generated', fileName);
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

  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    buffer = await sharp(buffer)
      .resize(resizeWidth, resizeHeight, { fit: "fill" })
      .png()
      .toBuffer();

    await fs.writeFile(filePath, buffer);

    controller.enqueue(
      JSON.stringify({
        type: "image",
        index,
        direct_image_url: imageUrl,
        filename: fileName,
      }) + "\n"
    );
    controller.close();
  } catch (error) {
    controller.enqueue(
      JSON.stringify({
        type: "error",
        index,
        message: "Lỗi khi lưu ảnh upload: " + (error as Error).message,
      }) + "\n"
    );
    controller.close();
    return;
  }
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

          const model = "gemini-2.0-flash-exp-image-generation";
          generateWithRetry(ai!, model, prompt)
            .then((response) => {
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

              const imageData = imagePart.inlineData.data;
if (typeof imageData !== "string") {
  controller.enqueue(
    JSON.stringify({
      type: "error",
      index,
      message: "Dữ liệu ảnh trả về không hợp lệ (không phải string)",
    }) + "\n"
  );
  controller.close();
  return;
}
buffer = Buffer.from(imageData, "base64");
              // Lưu ảnh
               fs.writeFile(filePath, buffer)
                .then(() => {
                  controller.enqueue(
                    JSON.stringify({
                      type: "image",
                      index,
                     
                      direct_image_url: imageUrl,
                    }) + "\n"
                  );
                  controller.close();
                })
                .catch((error) => {
                  console.error("Error saving image for index", index, ":", error);
                  controller.enqueue(
                    JSON.stringify({
                      type: "error",
                      index,
                      message: "Lỗi khi lưu ảnh: " + (error as Error).message,
                    }) + "\n"
                  );
                  controller.close();
                  return;
                });
            })
            .catch((error) => {
              console.error("Error generating image with retry for index", index, ":", error);
              controller.enqueue(
                JSON.stringify({
                  type: "error",
                  index,
                  message: "Lỗi khi tạo ảnh: " + (error as Error).message,
                }) + "\n"
              );
              controller.close();
              return;
            });
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