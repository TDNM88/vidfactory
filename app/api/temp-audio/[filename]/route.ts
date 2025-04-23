import { NextResponse } from 'next/server';
import { join } from 'path';
import { tmpdir } from 'os';

export async function GET(request: Request, context: { params: { filename: string } }) {
  try {
    const { filename } = context.params;
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
        'Content-Type': 'audio/mpeg',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error serving audio:', error);
    return new NextResponse(null, { status: 500 });
  }
}