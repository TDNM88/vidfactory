import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';
import CreditService from '../../../services/CreditService';

const prisma = new PrismaClient();
const creditService = new CreditService(prisma);

// Dữ liệu lịch sử credit mặc định cho người dùng chưa đăng nhập
const defaultCreditHistory = [
  { id: 1, action: 'Mua gói credit', delta: 100, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), note: 'Mẫu - Gói Nhỏ' },
  { id: 2, action: 'Tạo script', delta: -1, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), note: 'Mẫu - Tạo script' },
  { id: 3, action: 'Tạo hình ảnh', delta: -2, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), note: 'Mẫu - Tạo hình ảnh' },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Ghi log để debug
    console.log('API /api/credits/info được gọi');
    
    // Xác thực người dùng (không bắt buộc)
    const user = await verifyToken(req, prisma);
    
    // Ghi log kết quả xác thực
    console.log('Kết quả xác thực:', user ? `Thành công, userId: ${user.id}` : 'Không có người dùng');
    
    // Lấy tham số phân trang
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    // Nếu người dùng chưa đăng nhập, trả về dữ liệu mẫu
    if (!user) {
      console.log('Trả về dữ liệu mẫu cho người dùng chưa đăng nhập');
      return res.status(200).json({
        success: true,
        balance: 0,
        totalSpent: 0,
        history: defaultCreditHistory.slice(offset, offset + limit),
        total: defaultCreditHistory.length
      });
    }

    // Ghi log thông tin người dùng
    console.log('Thông tin người dùng:', { 
      id: user.id, 
      credit: user.credit, 
      totalSpentCredits: user.totalSpentCredits !== undefined ? user.totalSpentCredits : 'undefined'
    });

    // Lấy lịch sử tín dụng
    const historyResult = await creditService.getCreditHistory(user.id, limit, offset);
    
    if (!historyResult.success) {
      console.error('Lỗi khi lấy lịch sử tín dụng:', historyResult.error);
      return res.status(400).json({ 
        success: false, 
        error: historyResult.error 
      });
    }

    // Đảm bảo totalSpentCredits có giá trị
    const totalSpent = user.totalSpentCredits !== undefined ? user.totalSpentCredits : 0;
    console.log('Trả về thông tin credit:', { balance: user.credit, totalSpent });

    // Trả về thông tin credit và lịch sử
    return res.status(200).json({
      success: true,
      balance: user.credit,
      totalSpent: totalSpent,
      history: historyResult.history,
      total: historyResult.total
    });
  } catch (error: any) {
    console.error('Error fetching credit info:', error);
    // Trả về response lỗi chi tiết hơn
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
