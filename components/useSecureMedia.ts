import { useEffect, useState } from 'react';

/**
 * H ook lấy URL bảo mật cho video/audio từ API user-files, tự động thêm token.
 * @param url Đường dẫn API user-files (ví dụ: /api/user-files?type=generated-videos&filename=abc.mp4&userId=4)
 * @returns { url, loading, error }
 */
export function useSecureMedia(url: string | null) {
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

  return { url: mediaUrl, blob: mediaBlob, loading, error };
}

