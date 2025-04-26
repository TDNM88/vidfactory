// Chuyển đổi relative hoặc base URL thành absolute URL dựa trên NEXT_PUBLIC_BASE_URL
export function toAbsoluteUrl(url: string): string {
  if (!url) return '';
  // Nếu đã là absolute (http/https), trả về luôn
  if (/^https?:\/\//.test(url)) return url;
  // Nếu là base64 hoặc data:image, trả về luôn
  if (/^data:image\//.test(url)) return url;

  // Lấy base từ env hoặc mặc định
  const base = process.env.NEXT_PUBLIC_BASE_URL || '';
  if (!base) {
    console.warn('NEXT_PUBLIC_BASE_URL is not set!');
    return url;
  }
  // Nếu bắt đầu bằng / thì nối vào base
  if (url.startsWith('/')) {
    return base.replace(/\/$/, '') + url;
  }
  // Nếu là đường dẫn vật lý tuyệt đối trên server, có thể cần xử lý riêng (tùy backend)
  return url;
}
