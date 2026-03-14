// Voice Service - Simplified (Frontend handles TTS)
// This service is kept for future backend TTS integration

export interface VoiceConfig {
  apiKey: string;
  languageCode?: string;
  voiceType?: 'male' | 'female';
  speed?: number;
  pitch?: number;
}

export interface VoiceGenerationResult {
  audioContent: Buffer;
  mimeType: string;
}

export class VoiceService {
  private config: VoiceConfig;

  constructor(config?: Partial<VoiceConfig>) {
    const apiKey = process.env.GOOGLE_CLOUD_VOICE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY;

    this.config = {
      apiKey: apiKey || '',
      languageCode: config?.languageCode || 'en-GB',
      voiceType: config?.voiceType || 'male',
      speed: config?.speed || 1.0,
      pitch: config?.pitch || 0,
    };
  }

  /**
   * Generate speech from text
   * Note: Currently returns empty buffer - frontend handles TTS directly
   */
  async generateSpeech(
    text: string,
    options?: {
      voiceType?: 'male' | 'female';
      speed?: number;
      pitch?: number;
    }
  ): Promise<VoiceGenerationResult> {
    console.log('VoiceService: generateSpeech called (frontend handles TTS)');
    console.log('Text:', text.substring(0, 50) + '...');
    
    return {
      audioContent: Buffer.from(''),
      mimeType: 'audio/mp3',
    };
  }

  /**
   * Generate educational speech (placeholder)
   * Note: Frontend handles TTS directly
   */
  async generateEducationalSpeech(
    text: string,
    options?: {
      voiceType?: 'male' | 'female';
      subject?: 'math' | 'science' | 'english';
    }
  ): Promise<VoiceGenerationResult> {
    console.log('VoiceService: generateEducationalSpeech called (frontend handles TTS)');
    console.log('Text:', text.substring(0, 50) + '...');
    console.log('Options:', options);
    
    return {
      audioContent: Buffer.from(''),
      mimeType: 'audio/mp3',
    };
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<Array<{
    languageCodes: string[];
    name: string;
    ssmlGender: 'MALE' | 'FEMALE';
  }>> {
    return [
      {
        languageCodes: ['en-GB'],
        name: 'en-GB-Standard-A',
        ssmlGender: 'FEMALE',
      },
      {
        languageCodes: ['en-US'],
        name: 'en-US-Standard-B',
        ssmlGender: 'MALE',
      },
    ];
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
