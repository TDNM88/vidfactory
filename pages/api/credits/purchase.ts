import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';
import CreditService from '../../../services/CreditService';

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Xác thực người dùng
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Lấy thông tin gói credit từ request body
    const { packageId } = req.body;
    
    if (!packageId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thiếu thông tin gói credit' 
      });
    }

    // Lấy thông tin gói credit
    const creditPackage = await prisma.creditPackage.findUnique({
      where: { id: parseInt(packageId) },
    });
    
    if (!creditPackage) {
      return res.status(404).json({ 
        success: false, 
        error: 'Gói credit không tồn tại' 
      });
    }

    // Thực hiện mua credit
    // Ở đây có thể thêm phần tích hợp thanh toán
    // Giả lập thanh toán thành công
    
    // Thêm credit cho người dùng
    const metadata = {
      packageId: creditPackage.id,
      packageName: creditPackage.name,
      price: creditPackage.price
    };
    
    const addResult = await creditService.addCredit(
      user.id, 
      creditPackage.credits, 
      `Mua gói ${creditPackage.name}`, 
      metadata
    );
    
    if (!addResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: addResult.error 
      });
    }

    // Trả về kết quả
    return res.status(200).json({
      success: true,
      message: `Đã mua thành công gói ${creditPackage.name}`,
      credits: creditPackage.credits,
      newBalance: addResult.newBalance
    });
  } catch (error) {
    console.error('Error in credits/purchase API:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
