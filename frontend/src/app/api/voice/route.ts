import { NextRequest, NextResponse } from 'next/server'

/**
 * Voice API - Returns signal to use browser TTS
 * 
 * Since ElevenLabs quota is exceeded and free TTS APIs are unreliable,
 * we use the browser's built-in SpeechSynthesis API which is:
 * - 100% FREE and UNLIMITED
 * - No API key required
 * - High-quality neural voices (Microsoft Zira, David, Google US English)
 * - Works offline
 * 
 * Male voices: Math & Homework teachers
 * Female voices: Science teacher
 */
export async function POST(request: NextRequest) {
  try {
    const { text, avatarType = 'maths' } = await request.json()

    console.log(' Voice Request:', { avatarType, textLength: text?.length })

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Determine voice type based on avatar
    const voiceType = avatarType === 'science' ? 'female' : 'male'
    
    console.log(` Using browser TTS - ${voiceType} voice for ${avatarType} teacher`)

    // Return signal to use browser TTS with voice preference
    return NextResponse.json({
      useBrowserTTS: true,
      voiceType: voiceType,
      text: text,
      message: 'Using browser TTS (Free & Unlimited)'
    })

  } catch (error) {
    console.error(' Voice API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      useBrowserTTS: true,
      voiceType: 'male'
    }, { status: 500 })
  }
}

// Prepare text for natural speech - handle emojis, formatting, etc.
function prepareTextForSpeech(text: string): string {
  let cleanText = text

  // Replace emojis with spoken words
  const emojiMap: Record<string, string> = {
    '': 'hello',
    '': 'mathematics',
    '': 'science',
    '': 'books',
    '': 'let\'s begin',
    '': 'let\'s learn',
    '': 'here\'s an idea',
    '': 'now you try',
    '': 'great job',
    '': 'target',
    '': 'you can do it',
    '': 'excellent',
    '': 'well done',
    '': 'important point',
    '': 'note',
    '': 'let\'s talk',
    '': 'let\'s repeat',
    '': 'question',
    '': 'raise hand',
    '': 'leaf',
    '': 'air',
    '': 'water',
    '': 'sun',
    '': 'great work',
    '': 'document',
    '': 'listen',
    '': 'attached',
    '⭐': 'star',
    '': 'sparkle',
    '': 'let\'s go',
    '': 'love',
    '': 'heart',
    '': 'smile',
    '': 'happy',
    '': 'celebration',
  }

  Object.entries(emojiMap).forEach(([emoji, word]) => {
    cleanText = cleanText.replace(new RegExp(emoji, 'g'), ` ${word} `)
  })

  // Remove markdown formatting but keep meaning
  cleanText = cleanText
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/_(.+?)_/g, '$1') // Underscore italic
    .replace(/~~(.+?)~~/g, '$1') // Strikethrough
    .replace(/`(.+?)`/g, '$1') // Code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/#+\s/g, '') // Headers
    .replace(/>/g, '') // Blockquotes
    .replace(/\|/g, ',') // Tables
    .replace(/---+/g, 'dash') // Horizontal rules
    .replace(/\n+/g, '. ') // Newlines to periods
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim()

  // Handle special characters
  cleanText = cleanText
    .replace(/&/g, ' and ')
    .replace(/@/g, ' at ')
    .replace(/\$/g, ' dollars ')
    .replace(/%/g, ' percent ')
    .replace(/=/g, ' equals ')
    .replace(/\+/g, ' plus ')
    .replace(/-/g, ' minus ')
    .replace(/\*/g, ' times ')
    .replace(/\//g, ' over ')

  return cleanText
}