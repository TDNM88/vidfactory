import { NextApiRequest, NextApiResponse } from "next";
import { join } from "path";
import { promises as fs } from "fs";
import { verifyToken } from "../../lib/auth";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_DIRS: Record<string, string> = {
  "generated-images": "public/generated-images",
  "generated-videos": "public/generated-videos",
  "generated-audios": "public/generated-audios",
  "voices": "public/voices", // chỉ cho phép truy cập các file mẫu chung ở đây
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type, filename, userId } = req.query;
  if (typeof type !== "string" || typeof filename !== "string") {
    return res.status(400).json({ success: false, error: "Invalid params" });
  }
  if (!BASE_DIRS[type]) {
    return res.status(400).json({ success: false, error: "Invalid type" });
  }
  try {
    // Nếu là voices (giọng mẫu), cho phép mọi user truy cập
    if (type === "voices") {
      const filePath = join(process.cwd(), BASE_DIRS[type], filename);
      try {
        const data = await fs.readFile(filePath);
        res.setHeader("Content-Type", getMimeType(filename));
        return res.status(200).send(data);
      } catch {
        return res.status(404).json({ success: false, error: "Not found" });
      }
    }
    // Các loại khác: yêu cầu xác thực và đúng user
    const user = await verifyToken(req, prisma);
    if (!user) return res.status(401).json({ success: false, error: "Unauthorized" });
    // Admin có thể truy cập mọi file
    if (user.isAdmin || user.id === userId) {
      const filePath = join(process.cwd(), BASE_DIRS[type], String(user.id), filename);
      try {
        const data = await fs.readFile(filePath);
        res.setHeader("Content-Type", getMimeType(filename));
        return res.status(200).send(data);
      } catch {
        return res.status(404).json({ success: false, error: "Not found" });
      }
    }
    return res.status(403).json({ success: false, error: "Forbidden" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

function getMimeType(filename: string) {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".mp4")) return "video/mp4";
  if (filename.endsWith(".mp3")) return "audio/mpeg";
  if (filename.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}
