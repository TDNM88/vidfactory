import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Missing username or password' });
  }
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  const valid = password === user.password;
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
  return res.status(200).json({ success: true, token, user: { username: user.username, isAdmin: user.isAdmin, credit: user.credit, brandName: user.brandName, logoUrl: user.logoUrl, email: user.email } });
}
