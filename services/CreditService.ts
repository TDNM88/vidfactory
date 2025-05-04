import { PrismaClient } from '@prisma/client';

class CreditService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Kiểm tra số dư tín dụng của người dùng
   * @param userId ID của người dùng
   * @param apiName Tên API cần kiểm tra
   * @returns Đối tượng chứa thông tin về việc kiểm tra tín dụng
   */
  async checkUserCredit(userId: number, apiName: string): Promise<{ 
    success: boolean; 
    user?: any; 
    pricing?: any; 
    error?: string;
  }> {
    try {
      // Lấy thông tin người dùng
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'Người dùng không tồn tại' };
      }

      // Lấy thông tin giá của API
      const pricing = await this.prisma.apiPricing.findUnique({
        where: { apiName },
      });

      if (!pricing) {
        return { success: false, error: 'API không tồn tại trong hệ thống giá' };
      }

      // Kiểm tra số dư tín dụng
      if (user.credit < pricing.creditCost) {
        return { 
          success: false, 
          user, 
          pricing, 
          error: `Không đủ credit để sử dụng ${pricing.displayName}. Bạn cần ${pricing.creditCost} credit.` 
        };
      }

      return { success: true, user, pricing };
    } catch (error) {
      console.error('Error checking user credit:', error);
      return { success: false, error: 'Lỗi khi kiểm tra tín dụng người dùng' };
    }
  }

  /**
   * Trừ tín dụng của người dùng khi sử dụng API
   * @param userId ID của người dùng
   * @param apiName Tên API được sử dụng
   * @param note Ghi chú cho việc trừ tín dụng
   * @param metadata Metadata bổ sung (tùy chọn)
   * @returns Đối tượng chứa kết quả của việc trừ tín dụng
   */
  async deductCredit(userId: number, apiName: string, note: string = '', metadata: any = null): Promise<{
    success: boolean;
    error?: string;
    creditCost?: number;
    remainingCredit?: number;
  }> {
    try {
      const checkResult = await this.checkUserCredit(userId, apiName);
      
      if (!checkResult.success) {
        return { success: false, error: checkResult.error };
      }

      const creditCost = checkResult.pricing.creditCost;

      // Thực hiện transaction để đảm bảo cả hai hoạt động đều thành công hoặc thất bại
      const metadataStr = metadata ? JSON.stringify(metadata) : null;
      
      await this.prisma.$transaction([
        this.prisma.user.update({ 
          where: { id: userId }, 
          data: { 
            credit: { decrement: creditCost },
            totalSpentCredits: { increment: creditCost },
          } 
        }),
        this.prisma.creditLog.create({ 
          data: { 
            userId, 
            action: apiName, 
            delta: -creditCost, 
            note,
            metadata: metadataStr,
          } 
        }),
      ]);

      // Lấy số dư mới sau khi giao dịch hoàn tất
      const updatedUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { credit: true }
      });

      return { 
        success: true, 
        creditCost, 
        remainingCredit: updatedUser!.credit 
      };
    } catch (error) {
      console.error('Error deducting credit:', error);
      return { success: false, error: 'Lỗi khi trừ tín dụng người dùng' };
    }
  }

  /**
   * Thêm tín dụng cho người dùng
   * @param userId ID của người dùng
   * @param amount Số lượng tín dụng cần thêm
   * @param reason Lý do thêm tín dụng
   * @param metadata Metadata bổ sung (tùy chọn)
   * @returns Đối tượng chứa kết quả của việc thêm tín dụng
   */
  async addCredit(userId: number, amount: number, reason: string, metadata: any = null): Promise<{
    success: boolean;
    error?: string;
    newBalance?: number;
  }> {
    try {
      if (amount <= 0) {
        return { success: false, error: 'Số lượng tín dụng phải lớn hơn 0' };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'Người dùng không tồn tại' };
      }

      const metadataStr = metadata ? JSON.stringify(metadata) : null;

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { credit: { increment: amount } },
        }),
        this.prisma.creditLog.create({
          data: {
            userId,
            action: 'add_credit',
            delta: amount,
            note: reason,
            metadata: metadataStr,
          },
        }),
      ]);

      const updatedUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { credit: true },
      });

      return { 
        success: true, 
        newBalance: updatedUser!.credit 
      };
    } catch (error) {
      console.error('Error adding credit:', error);
      return { success: false, error: 'Lỗi khi thêm tín dụng cho người dùng' };
    }
  }

  /**
   * Lấy lịch sử tín dụng của người dùng
   * @param userId ID của người dùng
   * @param limit Số lượng bản ghi tối đa cần lấy
   * @param offset Vị trí bắt đầu
   * @returns Danh sách lịch sử tín dụng
   */
  async getCreditHistory(userId: number, limit: number = 10, offset: number = 0): Promise<{
    success: boolean;
    error?: string;
    history?: any[];
    total?: number;
  }> {
    try {
      const history = await this.prisma.creditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      const total = await this.prisma.creditLog.count({
        where: { userId },
      });

      return { 
        success: true, 
        history, 
        total 
      };
    } catch (error) {
      console.error('Error fetching credit history:', error);
      return { success: false, error: 'Lỗi khi lấy lịch sử tín dụng' };
    }
  }

  /**
   * Lấy thông tin về giá API
   * @returns Danh sách giá của các API
   */
  async getApiPricing(): Promise<{
    success: boolean;
    error?: string;
    pricing?: any[];
  }> {
    try {
      const pricing = await this.prisma.apiPricing.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      return { 
        success: true, 
        pricing 
      };
    } catch (error) {
      console.error('Error fetching API pricing:', error);
      return { success: false, error: 'Lỗi khi lấy thông tin giá API' };
    }
  }

  /**
   * Lấy thông tin về các gói tín dụng
   * @returns Danh sách các gói tín dụng
   */
  async getCreditPackages(): Promise<{
    success: boolean;
    error?: string;
    packages?: any[];
  }> {
    try {
      const packages = await this.prisma.creditPackage.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      return { 
        success: true, 
        packages 
      };
    } catch (error) {
      console.error('Error fetching credit packages:', error);
      return { success: false, error: 'Lỗi khi lấy thông tin gói tín dụng' };
    }
  }
}

export default CreditService;
