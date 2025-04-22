import { NextResponse } from "next/server"

import { readdir } from "fs/promises";
import { join } from "path";

// Lấy danh sách file nhạc nền từ thư mục public/music
async function getMusicFiles() {
  const musicDir = join(process.cwd(), "public", "music");
  const files = await readdir(musicDir);
  return files.filter(f => f.endsWith('.mp3')).map(filename => ({
    filename,
    path: `/music/${filename}`
  }));
}

export async function GET() {
  try {
    const musicFiles = await getMusicFiles();
    return NextResponse.json({
      music_files: musicFiles,
    })
  } catch (error) {
    console.error("Error listing music files:", error)
    return NextResponse.json({ success: false, error: "Lỗi máy chủ nội bộ" }, { status: 500 })
  }
}

