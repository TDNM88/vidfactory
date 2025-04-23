import { join } from 'path';
import { tmpdir } from 'os';
import * as fs from 'fs/promises';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  const { filename } = params;
  if (!filename) return new Response('Bad request', { status: 400 });
  try {
    const filePath = join(tmpdir(), filename);
    const buffer = await fs.readFile(filePath);
    return new Response(buffer, {
      headers: { 'Content-Type': 'image/png' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
