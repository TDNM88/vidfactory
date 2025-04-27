import { NextApiRequest, NextApiResponse } from "next";
import { join } from "path";
import { tmpdir } from "os";
import * as fs from "node:fs/promises";
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename, userId } = req.query;
  if (typeof filename !== "string" || typeof userId !== "string") {
    return res.status(400).json({ success: false, error: "Invalid filename or userId" });
  }

  // Xác thực user
  const prisma = new PrismaClient();
  const user = await verifyToken(req, prisma);
  if (!user || String(user.id) !== userId) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  const filePath = join(tmpdir(), 'generated-audios', userId, filename);
  try {
    const fileBuffer = await fs.readFile(filePath);
    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(fileBuffer);
  } catch (error: any) {
    res.status(404).json({ success: false, error: "File not found" });
  }
}
