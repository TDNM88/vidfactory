import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const voicesDir = path.join(process.cwd(), "public", "voices");
  let files: string[] = [];
  try {
    files = fs.readdirSync(voicesDir).filter(f => f.endsWith(".wav"));
  } catch (e) {
    files = [];
  }
  return NextResponse.json(files);
}
