const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Thêm API generate-image vào bảng apiPricing
    const newApi = await prisma.apiPricing.create({
      data: {
        apiName: 'generate-image',
        creditCost: 1,
        displayName: 'Tạo ảnh',
        description: 'Tạo ảnh từ mô tả hoặc tìm kiếm ảnh từ Pexels',
        isActive: true,
        sortOrder: 2
      }
    });

    console.log('Đã thêm API generate-image vào hệ thống giá:', newApi);
  } catch (error) {
    console.error('Lỗi khi thêm API generate-image:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
