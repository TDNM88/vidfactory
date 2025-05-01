import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string; // Pexels page URL
  image: string; // Thumbnail URL
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: {
    id: number;
    quality: string; // e.g., 'hd', 'sd'
    file_type: string; // e.g., 'video/mp4'
    width: number;
    height: number;
    link: string; // Download link
  }[];
  video_pictures: {
    id: number;
    picture: string; // Thumbnail/preview picture URL
    nr: number;
  }[];
}

interface PexelsApiResponse {
  page: number;
  per_page: number;
  total_results: number;
  url: string;
  videos: PexelsVideo[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query, orientation = 'landscape', per_page = '15', size } = req.query;
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.error('Pexels API key is missing.');
    return res.status(500).json({ error: 'Server configuration error: Missing Pexels API Key' });
  }

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid query parameter' });
  }

  try {
    const pexelsApiUrl = 'https://api.pexels.com/videos/search';
    const response = await axios.get<PexelsApiResponse>(pexelsApiUrl, {
      headers: {
        Authorization: apiKey,
      },
      params: {
        query: query,
        orientation: orientation as string, // landscape, portrait, square
        size: size as string | undefined, // large (24MP+), medium (12MP-24MP), small (4MP-12MP) - Optional
        per_page: parseInt(per_page as string, 10) || 15,
      },
    });

    // Filter and format the results slightly for frontend use
    const formattedVideos = response.data.videos.map(video => ({
      id: video.id,
      thumbnail: video.image, // Use 'image' as the primary thumbnail
      duration: video.duration,
      previewUrl: video.video_pictures[0]?.picture, // Use first video picture as preview if available
      // Find the best quality download link (prefer HD)
      downloadUrl: video.video_files.find(f => f.quality === 'hd')?.link || video.video_files[0]?.link, 
      pexelsUrl: video.url, // Link back to Pexels page for attribution/details
      photographer: video.user.name,
      photographerUrl: video.user.url,
      width: video.width,
      height: video.height,
    }));

    res.status(200).json({ videos: formattedVideos });

  } catch (error: any) {
    console.error('Error fetching from Pexels API:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch videos from Pexels',
      details: error.response?.data || error.message,
    });
  }
}
