import { NextResponse } from 'next/server';
import { join } from 'path';
import { tmpdir } from 'os';

export async function GET(request: Request) {
  // Extract filename from the URL path
  const url = new URL(request.url);
  const paths = url.pathname.split("/");
  const filename = paths[paths.length - 1];
  try {
    const { filename } = params;
    // Validate filename - only allow .mp3 or .wav, no path traversal
    if (!filename.match(/^audio-[^/]+\.(mp3|wav)$/)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid filename' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const filePath = join(tmpdir(), filename);
    const fs = await import('fs/promises');
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return new NextResponse(null, { status: 404 });
      }
      console.error('Error serving audio:', error);
      return new NextResponse(null, { status: 500 });
    }
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': filename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error serving audio:', error);
    return new NextResponse(null, { status: 500 });
  }
}