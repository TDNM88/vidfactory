import { useEffect, useState, useCallback } from 'react';

/**
 * Hook lấy URL bảo mật cho video/audio từ API user-files, tự động thêm token.
 * @param url Đường dẫn API user-files (ví dụ: /api/user-files?type=generated-videos&filename=abc.mp4&userId=4)
 * @returns { url, blob, loading, error, getSecureUrl }
 */
export function useSecureMedia(url: string | null = null) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setMediaUrl(null);
      setMediaBlob(null);
      setError(null);
      setLoading(false);
      return;
    }
    let revoke: string | null = null;
    setLoading(true);
    setError(null);
    fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải media');
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setMediaUrl(blobUrl);
        setMediaBlob(blob);
        revoke = blobUrl;
      })
      .catch((e) => {
        setError(e.message);
        setMediaUrl(null);
        setMediaBlob(null);
      })
      .finally(() => setLoading(false));
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [url]);

  // Thêm hàm getSecureUrl để hỗ trợ các component hiện tại
  const getSecureUrl = useCallback((urlToSecure: string): string => {
    if (!urlToSecure) return '';
    
    // Nếu đã là URL đầy đủ hoặc là URL blob, trả về nguyên dạng
    if (urlToSecure.startsWith('blob:') || urlToSecure.startsWith('http')) {
      return urlToSecure;
    }
    
    // Nếu là path API, thêm token vào
    const token = localStorage.getItem('token') || '';
    // Có thể thêm logic xử lý token ở đây nếu cần
    
    return urlToSecure;
  }, []);

  return { url: mediaUrl, blob: mediaBlob, loading, error, getSecureUrl };
}
