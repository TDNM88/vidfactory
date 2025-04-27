// pages/api/cleanup.ts
import { NextResponse } from "next/server";
import { join } from "path";
import { promises as fs } from "fs";

export async function POST() {
  try {
    const dirs = [join(process.cwd(), "public", "generated"), join(process.cwd(), "public", "temp-videos")];
    for (const dir of dirs) {
      const files = await fs.readdir(dir);
      for (const file of files) {
        const stats = await fs.stat(join(dir, file));
        if (Date.now() - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          await fs.unlink(join(dir, file));
        }
      }
    }
    return NextResponse.json({ success: true, message: "Đã dọn dẹp file cũ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}