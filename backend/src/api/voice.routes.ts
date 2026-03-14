/**
 * Google Cloud Text-to-Speech API Route
 *
 * Endpoints:
 * - POST /api/voice/synthesize - Generate speech from text
 * - GET /api/voice/voices - Get available voices
 *
 * Uses Google Cloud Text-to-Speech API with the provided API key.
 * Supports male/female voices with British English (en-GB) neural voices.
 */

import { Router, Request, Response } from 'express';
import { voiceService } from '../services/voice.service';

const router = Router();

// ==================== INTERFACES ====================

interface VoiceSynthesisRequest {
  text: string;
  voiceType?: 'male' | 'female';
  avatarType?: 'maths' | 'science' | 'homework';
  speed?: number;
  pitch?: number;
  educational?: boolean;
  subject?: 'math' | 'science' | 'english';
}

// ==================== ROUTES ====================

/**
 * SYNTHESIZE SPEECH
 *
 * Generates audio from text using Google Cloud Text-to-Speech.
 * Returns MP3 audio buffer.
 *
 * Request body:
 * - text: string (required) - Text to synthesize
 * - voiceType: 'male' | 'female' (optional) - Voice gender
 * - avatarType: 'maths' | 'science' | 'homework' (optional) - Determines voice automatically
 * - speed: number (optional) - Speaking rate (0.5-2.0)
 * - pitch: number (optional) - Pitch adjustment (-20 to 20)
 * - educational: boolean (optional) - Use educational optimization
 * - subject: 'math' | 'science' | 'english' (optional) - Subject-specific optimization
 */
router.post('/synthesize', async (req: Request, res: Response) => {
  try {
    const { text, voiceType, avatarType, speed, pitch, educational, subject }: VoiceSynthesisRequest = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required',
        required: ['text'],
      });
    }

    // Determine voice type from avatarType if voiceType not specified
    let finalVoiceType = voiceType;
    if (!finalVoiceType && avatarType) {
      finalVoiceType = avatarType === 'science' ? 'female' : 'male';
    }

    console.log(` Voice Synthesis Request:`, {
      textLength: text.length,
      voiceType: finalVoiceType,
      avatarType,
      speed,
      pitch,
      educational,
      subject,
    });

    // Frontend handles TTS directly via Google Cloud API
    // This endpoint returns empty audio with fallback flag
    console.log(' Voice service: Frontend handles TTS directly');
    
    res.status(500).json({
      error: 'Voice service not available',
      fallback: 'Using browser TTS',
      useBrowserTTS: true,
      message: 'Frontend should use Google Cloud TTS API directly',
    });
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    res.status(500).json({
      error: 'Failed to synthesize speech',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'Using browser TTS',
      useBrowserTTS: true,
    });
  }
});

/**
 * GET AVAILABLE VOICES
 *
 * Returns list of available Google Cloud voices.
 */
router.get('/voices', async (req: Request, res: Response) => {
  try {
    const voices = await voiceService.getAvailableVoices();

    res.json({
      success: true,
      voices,
      count: voices.length,
    });
  } catch (error) {
    console.error('Error getting available voices:', error);
    res.status(500).json({
      error: 'Failed to get available voices',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * LEGACY ENDPOINT - Maintain compatibility with existing frontend
 * POST /api/voice
 *
 * This endpoint maintains backward compatibility with the existing frontend
 * that calls /api/voice directly.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, avatarType = 'maths' }: { text: string; avatarType?: 'maths' | 'science' | 'homework' } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required',
        required: ['text'],
      });
    }

    console.log(` Voice Request (Legacy):`, { avatarType, textLength: text.length });

    // Determine voice type based on avatar
    const voiceType = avatarType === 'science' ? 'female' : 'male';

    // Generate educational speech (optimized for learning)
    const result = await voiceService.generateEducationalSpeech(text, {
      voiceType,
      subject: avatarType === 'maths' ? 'math' : avatarType === 'science' ? 'science' : undefined,
    });

    // Set headers and send audio
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Length', result.audioContent.length);
    res.send(result.audioContent);
  } catch (error) {
    console.error('Error in legacy voice endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'Using browser TTS',
      useBrowserTTS: true,
    });
  }
});

export default router;
