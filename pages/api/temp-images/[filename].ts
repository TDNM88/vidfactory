import { NextApiRequest, NextApiResponse } from "next";
import { join } from "path";
import { tmpdir } from "os";
import * as fs from "node:fs/promises";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;
  if (typeof filename !== "string") {
    return res.status(400).json({ success: false, error: "Invalid filename" });
  }

  const filePath = join(tmpdir(), filename);
  try {
    const fileBuffer = await fs.readFile(filePath);
    res.setHeader("Content-Type", "image/png");
    res.status(200).send(fileBuffer);
  } catch (error: any) {
    res.status(404).json({ success: false, error: "File not found" });
  }
}