import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Thêm dữ liệu mẫu cho bảng ApiPricing
    await prisma.apiPricing.deleteMany(); // Xóa dữ liệu cũ để tránh trùng lặp

    // Tạo các bản ghi API pricing
    const apis = [
      {
        apiName: 'create_script',
        displayName: 'Tạo kịch bản',
        description: 'Tạo kịch bản cho video từ các từ khóa đầu vào',
        creditCost: 5,
        sortOrder: 1,
      },
      {
        apiName: 'generate_image',
        displayName: 'Tạo hình ảnh',
        description: 'Tạo hình ảnh từ mô tả văn bản',
        creditCost: 8,
        sortOrder: 2,
      },
      {
        apiName: 'create_voice',
        displayName: 'Tạo giọng đọc',
        description: 'Chuyển đổi văn bản thành giọng đọc',
        creditCost: 3,
        sortOrder: 3,
      },
      {
        apiName: 'merge_video_voice',
        displayName: 'Ghép video và giọng nói',
        description: 'Kết hợp video và âm thanh thành một video hoàn chỉnh',
        creditCost: 2,
        sortOrder: 4,
      },
      {
        apiName: 'analyze_content',
        displayName: 'Phân tích nội dung',
        description: 'Phân tích nội dung văn bản và gợi ý từ khóa',
        creditCost: 1,
        sortOrder: 5,
      },
      {
        apiName: 'concat_videos',
        displayName: 'Ghép nhiều video',
        description: 'Ghép nhiều video thành một video dài',
        creditCost: 5,
        sortOrder: 6,
      },
    ];

    for (const api of apis) {
      await prisma.apiPricing.create({
        data: api,
      });
    }

    console.log('Đã thêm dữ liệu cho bảng ApiPricing');

    // Thêm dữ liệu mẫu cho bảng CreditPackage
    await prisma.creditPackage.deleteMany(); // Xóa dữ liệu cũ để tránh trùng lặp

    // Tạo các gói tín dụng
    const packages = [
      {
        name: 'Gói Basic',
        credits: 50,
        price: 50000,
        description: 'Gói cơ bản với 50 credits',
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Gói Standard',
        credits: 150,
        price: 125000,
        description: 'Gói tiêu chuẩn với 150 credits, tiết kiệm 17%',
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'Gói Premium',
        credits: 500,
        price: 350000,
        description: 'Gói cao cấp với 500 credits, tiết kiệm 30%',
        isActive: true,
        sortOrder: 3,
      },
      {
        name: 'Gói Enterprise',
        credits: 1500,
        price: 900000,
        description: 'Gói doanh nghiệp với 1500 credits, tiết kiệm 40%',
        isActive: true,
        sortOrder: 4,
      },
    ];

    for (const pkg of packages) {
      await prisma.creditPackage.create({
        data: pkg,
      });
    }

    console.log('Đã thêm dữ liệu cho bảng CreditPackage');

    // Tạo tài khoản admin nếu chưa có
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!adminExists) {
      await prisma.user.create({
        data: {
          username: 'admin',
          password: '$2a$12$OsVx8laTHjC9VKH7mYU8K.VhYKPVz4QHIKz6TF/wKhWyoJdh44eTe', // Hashed password: 'admin123'
          credit: 1000,
          isAdmin: true,
        },
      });
      console.log('Đã tạo tài khoản admin');
    }

    console.log('Migration hoàn tất');
  } catch (error) {
    console.error('Lỗi trong quá trình migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
