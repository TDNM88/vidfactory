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
  try {
    const { handleViduRequest } = await import('@/lib/workflows/premium/viduHandler');
    return handleViduRequest(req);
  } catch (error) {
    console.error('Error handling Vidu request:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}