import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function verifyToken(req: NextApiRequest, prisma: PrismaClient) {
  try {
    // Tìm token từ các nguồn - ưu tiên Authorization header trước
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || getCookieFromRequest(req, 'token');
    
    if (!token) {
      return null;
    }
    
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        password: true,
        credit: true,
        totalSpentCredits: true,
        brandName: true,
        logoUrl: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function generateToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function getCookieFromRequest(req: NextApiRequest, cookieName: string) {
  const cookies = req.headers.cookie?.split(';');
  
  if (!cookies) {
    return null;
  }
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    
    if (name === cookieName) {
      return value;
    }
  }
  
  return null;
}
