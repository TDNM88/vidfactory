import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';
import { tmpdir } from 'os';
import * as fs from 'fs/promises';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;
  if (!filename || Array.isArray(filename)) return res.status(400).end('Bad request');
  try {
    const filePath = join(tmpdir(), filename as string);
    const buffer = await fs.readFile(filePath);
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch {
    res.status(404).end('Not found');
  }
}
