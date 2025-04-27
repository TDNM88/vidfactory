import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import * as path from "path";
import sharp from "sharp";
import formidable from "formidable";

// Danh sách phong cách hợp lệ
const validStyles = ["cinematic", "anime", "flat lay", "realistic"];

// Interface cho body của request JSON
interface RequestBody {
  prompt?: string;
  segmentIdx?: string | number;
  styleSettings?: { style: string; character: string; scene: string };
  image_base64?: string;
}

// Utility function to generate images with retry logic
async function generateWithRetry(ai: GoogleGenAI, model: string, prompt: string, retries = 5) {
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
      const retryableErrors = ["500 Internal Server Error", "429 Too Many Requests", "503 Service Unavailable"];
      if (retryableErrors.some((err) => error.message.includes(err)) && attempt < retries) {
        console.warn(`Attempt ${attempt} failed with ${error.message}, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw new Error(`Failed to generate image after ${attempt} attempts: ${error.message}`);
    }
  }
}

// Main API handler
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    const contentType = req.headers["content-type"] || "";
    let index: number | undefined;
    let prompt: string | undefined;
    let file: any;
    let styleSettings: { style: string; character: string; scene: string } | undefined;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured");
      return res.status(500).json({ success: false, error: "GEMINI_API_KEY is not configured" });
    }

    // Handle JSON or multipart/form-data requests
    if (contentType.includes("application/json")) {
      const body: RequestBody = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error("Invalid JSON format"));
          }
        });
      });
      if (typeof body.prompt === "string") {
        prompt = body.prompt;
      }
      if (typeof body.segmentIdx !== "undefined") {
        index = parseInt(String(body.segmentIdx), 10);
      }
      if (body.styleSettings && typeof body.styleSettings === "object") {
        styleSettings = body.styleSettings;
      }
      if (typeof body.image_base64 === "string" && body.image_base64.startsWith("data:image")) {
        file = { base64: body.image_base64 };
      }
    } else if (contentType.includes("multipart/form-data")) {
      const form = formidable({ multiples: false, maxFileSize: 5 * 1024 * 1024 });
      const formData = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
        form.parse(req as any, (err, fields, files) => {
          if (err) {
            console.error("Formidable parse error:", err);
            reject(new Error("Failed to parse form data"));
          } else {
            resolve({ fields, files });
          }
        });
      });
      index = parseInt(
        Array.isArray(formData.fields.index) ? formData.fields.index[0] : formData.fields.index || "0",
        10
      );
      prompt = Array.isArray(formData.fields.prompt) ? formData.fields.prompt[0] : formData.fields.prompt;
      if (typeof prompt !== "string") {
        return res.status(400).json({ success: false, error: "Prompt must be a string" });
      }
      styleSettings = formData.fields.styleSettings
        ? JSON.parse(
            Array.isArray(formData.fields.styleSettings)
              ? formData.fields.styleSettings[0]
              : formData.fields.styleSettings
          )
        : undefined;
      file = formData.files.file;
      const imageBase64 = Array.isArray(formData.fields.image_base64)
        ? formData.fields.image_base64[0]
        : formData.fields.image_base64;
      if (typeof imageBase64 === "string" && imageBase64.startsWith("data:image")) {
        file = { base64: imageBase64 };
      }
    } else {
      return res.status(400).json({ success: false, error: "Unsupported content type" });
    }

    // Validate inputs
    if (!apiKey && !file) {
      return res.status(500).json({ success: false, error: "Missing GEMINI_API_KEY or file" });
    }
    if (typeof index !== "number" || isNaN(index)) {
      return res.status(400).json({ success: false, error: "Invalid segment index" });
    }
    if (prompt && !styleSettings) {
      return res.status(400).json({ success: false, error: "Missing styleSettings for AI-generated image" });
    }
    if (styleSettings && !validStyles.includes(styleSettings.style)) {
      return res.status(400).json({ success: false, error: `Invalid style: ${styleSettings.style}` });
    }
    if (styleSettings && (styleSettings.character.length > 100 || styleSettings.scene.length > 100)) {
      return res.status(400).json({
        success: false,
        error: "Character or scene description exceeds 100 characters",
      });
    }

    // Get user ID from token
    const prisma = new PrismaClient();
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const userId = user.id;

    // Prepare file paths
    const userDir = path.join('/tmp/generated-images', userId);
    await fs.mkdir(userDir, { recursive: true });
    const fileName = `image-${Date.now()}-${index}.png`;
    const filePath = path.join(userDir, fileName);
    const imageUrl = `/api/temp-images/${userId}/${fileName}`;

    // Build style prompt dynamically
    const stylePrompt = styleSettings
      ? `
        Phong cách: ${styleSettings.style}.
        Nhân vật: ${styleSettings.character || "Không có nhân vật, tập trung vào bối cảnh chi tiết"}.
        Bối cảnh: ${styleSettings.scene || "Bối cảnh phù hợp với nội dung mô tả, không lặp lại văn bản"}.
        Chi tiết: Màu sắc sống động, ánh sáng mềm mại, bố cục cân đối, góc quay cận cảnh hoặc trung cảnh.
      `
      : "";

    // Process request
    let buffer: Buffer;
    if (file) {
      try {
        if (file.base64) {
          const matches = file.base64.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
          if (!matches) {
            return res.status(400).json({ success: false, error: "Invalid base64 image format" });
          }
          const base64Data = matches[2];
          const imageBuffer = Buffer.from(base64Data, "base64");
          buffer = await sharp(imageBuffer)
            .resize(512, 512, { fit: "fill" })
            .png()
            .toBuffer();
        } else {
          const data = await fs.readFile(file.filepath);
          buffer = await sharp(data)
            .resize(512, 512, { fit: "fill" })
            .png()
            .toBuffer();
        }
        await fs.writeFile(filePath, buffer);
        return res.status(200).json({
          success: true,
          imageUrl,
          direct_image_url: imageUrl,
          image_path: filePath,
          index,
        });
      } catch (error: any) {
        console.error("Image processing error:", error);
        return res.status(500).json({ success: false, error: "Failed to process uploaded image" });
      }
    } else if (prompt && apiKey && styleSettings) {
      try {
        const enhancedPrompt = `${prompt}. ${stylePrompt}`;
        const ai = new GoogleGenAI({ apiKey });
        const model = "gemini-2.0-flash-exp-image-generation";
        const response = await generateWithRetry(ai, model, enhancedPrompt);
        if (!response || !response.candidates || response.candidates.length === 0) {
          return res.status(500).json({ success: false, error: "No candidates data received from API" });
        }
        const candidate = response.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
          return res.status(500).json({ success: false, error: "No content or parts data in response" });
        }
        const parts = candidate.content.parts;
        const imagePart = parts.find((part: any) => part.inlineData);
        if (!imagePart || !imagePart.inlineData) {
          return res.status(500).json({ success: false, error: "No image data found in response" });
        }
        const imageData = imagePart.inlineData.data;
        if (typeof imageData !== "string") {
          return res.status(500).json({ success: false, error: "Image data is not a valid string" });
        }
        buffer = Buffer.from(imageData, "base64");
        buffer = await sharp(buffer)
          .resize(512, 512, { fit: "fill" })
          .png()
          .toBuffer();
        await fs.writeFile(filePath, buffer);
        return res.status(200).json({
          success: true,
          imageUrl,
          direct_image_url: imageUrl,
          index,
        });
      } catch (error: any) {
        console.error("Gemini API error:", error);
        return res.status(500).json({ success: false, error: "Failed to generate image with Gemini API" });
      }
    } else {
      return res.status(400).json({ success: false, error: "Must provide prompt or file" });
    }
  } catch (error: any) {
    console.error("Error processing image:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to process image" });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};