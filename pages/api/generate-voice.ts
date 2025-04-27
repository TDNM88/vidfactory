import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '@gradio/client';
import fetch from 'node-fetch';
import { phonemizeVietnamese } from '../../lib/phonemize-vi';

// Define the response type
type ResponseData = {
  success: boolean;
  voiceUrl?: string;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { text, segmentIdx, voiceName, voiceApiType, language, normalizeText, speed } = req.body;

    // Validate input
    if (!text || segmentIdx === undefined || !voiceName) {
      return res.status(400).json({ success: false, error: 'Missing required fields: text, segmentIdx, voiceName' });
    }
    if (!voiceApiType || !['f5-tts', 'vixtts'].includes(voiceApiType)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing voiceApiType' });
    }

    // Phonemize the input text for better Vietnamese pronunciation
    const phonemizedText = phonemizeVietnamese(text);

    // Xác thực user
    const prisma = new PrismaClient();
    const user = await verifyToken(req, prisma);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const userId = String(user.id);
    // Prepare output directory
    const outputDir = path.join(tmpdir(), 'generated-audios', userId);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate unique file name
    const fileName = `${uuidv4()}.mp3`;
    const outputPath = path.join(outputDir, fileName);

    // Select Gradio Space based on voiceApiType
    const spaceId = voiceApiType === 'vixtts' ? 'sysf/vixtts-demo' : 'hynt/F5-TTS-Vietnamese-100h';
    const hfToken = process.env.HF_TOKEN;
    const client = await Client.connect(spaceId, { hf_token: hfToken as `hf_${string}` | undefined });

    // Prepare reference audio
    let audioBlob: Blob;
    const refAudioPath = path.join(process.cwd(), 'public', 'ref_voices', voiceName);
    if (fs.existsSync(refAudioPath)) {
      audioBlob = new Blob([fs.readFileSync(refAudioPath)]);
    } else {
      // Use default audio if reference is missing
      const defaultAudioUrl =
        voiceApiType === 'vixtts'
          ? 'https://github.com/gradio-app/gradio/raw/main/test/test_files/audio_sample.wav'
          : '';
      const response = await fetch(defaultAudioUrl);
      audioBlob = await response.blob();
    }

    // Call Gradio API
    let audioUrl: string;
    if (voiceApiType === 'vixtts') {
      const result: any = await client.predict('/predict', {
        prompt: phonemizedText,
        language: language || 'vi',
        audio_file_pth: audioBlob,
        normalize_text: normalizeText !== undefined ? normalizeText : true,
      });

      if (!result || !result.data || !result.data[0]) {
        throw new Error('No audio file received from VixTTS API');
      }
      audioUrl = result.data[0].url || result.data[0];
    } else {
      const result: any = await client.predict('/infer_tts', {
        ref_audio_orig: audioBlob,
        gen_text: phonemizedText,
        speed: speed || 1,
      });

      if (!result || !result.data || !result.data[0]) {
        throw new Error('No audio file received from F5-TTS API');
      }
      audioUrl = result.data[0].url || result.data[0];
    }

    // Download and save the audio file
    const response = await fetch(audioUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);

    // Verify the file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Failed to create audio file');
    }

    // Return the user-specific URL
    const voiceUrl = `/api/temp-audios/${userId}/${fileName}`;
    return res.status(200).json({ success: true, voiceUrl });
  } catch (error: any) {
    console.error('Error generating voice:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}