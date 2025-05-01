import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import fse from 'fs-extra'; // Use fs-extra for ensureDir
import path from 'path';
import { Readable } from 'stream';

// Define the base directory for temporary videos within the public folder
const TEMP_VIDEO_DIR = path.resolve('./public', 'temp_videos');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { downloadUrl, sessionId, segmentIndex } = req.body;

    // --- Input Validation ---
    if (!downloadUrl || typeof downloadUrl !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid downloadUrl' });
    }
    if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid sessionId' });
    }
    if (segmentIndex === undefined || segmentIndex === null || isNaN(Number(segmentIndex))) {
        return res.status(400).json({ error: 'Missing or invalid segmentIndex' });
    }

    try {
        // --- Directory and File Path Setup ---
        const sessionDir = path.join(TEMP_VIDEO_DIR, sessionId);
        await fse.ensureDir(sessionDir); // Create directory if it doesn't exist

        // Use a consistent file extension (mp4 is common for Pexels)
        const videoFileName = `segment_${segmentIndex}.mp4`;
        const absoluteVideoPath = path.join(sessionDir, videoFileName);
        const publicVideoPath = `/temp_videos/${sessionId}/${videoFileName}`; // Path relative to public folder for potential future use

        console.log(`Attempting to download video from ${downloadUrl} to ${absoluteVideoPath}`);

        // --- Download Video using Stream ---
        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream',
        });

        // Check if the response is successful before writing
        if (response.status !== 200) {
            throw new Error(`Failed to download video. Status code: ${response.status}`);
        }

        const writer = fs.createWriteStream(absoluteVideoPath);
        
        // Type assertion to handle the unknown type of response.data
        if (!response.data) {
            throw new Error('No data received from video stream');
        }
        
        // Cast response.data to Readable stream
        const stream = response.data as Readable;
        stream.pipe(writer);

        // --- Wait for Download Completion ---
        await new Promise<void>((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (err) => {
                 console.error('Error writing video file:', err);
                 // Attempt to clean up the partially written file
                 fs.unlink(absoluteVideoPath, unlinkErr => {
                    if (unlinkErr) console.error('Error deleting partial file:', unlinkErr);
                 });
                 reject(err);
            });
            
            // Add error handler to the stream
            stream.on('error', (err: any) => { // Catch errors on the read stream too
                console.error('Error reading video stream:', err);
                writer.close(); // Close the writer stream if read stream fails
                reject(err);
            });
        });

        console.log(`Video downloaded successfully to: ${absoluteVideoPath}`);

        // --- Respond with Success --- 
        // Return the absolute path for backend (ffmpeg) and relative public path for frontend if needed
        res.status(200).json({ 
            success: true, 
            video_path: absoluteVideoPath, // Absolute path for server-side processing
            public_url: publicVideoPath    // Relative path for client-side access if needed
        });

    } catch (error: any) {
        console.error('Error downloading Pexels video:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to download video',
            details: error.message,
        });
    }
}
