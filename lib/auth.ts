import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function verifyToken(req: NextApiRequest, prisma: PrismaClient) {
  const header = req.headers.authorization;
  if (!header) return null;
  const token = header.replace(/^Bearer /, '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number, isAdmin: boolean };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    return user;
  } catch {
    return null;
  }
}

export async function verifyAdmin(req: NextApiRequest, prisma: PrismaClient) {
  const user = await verifyToken(req, prisma);
  if (!user || !user.isAdmin) return null;
  return user;
}
