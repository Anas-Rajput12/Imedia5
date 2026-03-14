import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface TeacherResponse {
  answer: string;
  structuredResponse: {
    introduction: string;
    explanation: string;
    examples: string;
    summary: string;
  };
  sources: string[];
  confidence: number;
  flags: string[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: GeminiConfig;

  constructor(config?: Partial<GeminiConfig>) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not set in environment variables');
    }

    this.config = {
      apiKey,
      model: config?.model || 'gemini-1.5-flash', // Updated model name
      temperature: config?.temperature ?? 0.7,
      maxOutputTokens: config?.maxOutputTokens ?? 1024,
    };

    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: this.config.model!,
      generationConfig: {
        temperature: this.config.temperature!,
        maxOutputTokens: this.config.maxOutputTokens!,
      },
    });
  }

  /**
   * Generate a teacher-style response with retrieval context
   */
  async generateTeacherResponse(
    question: string,
    retrievedContext: string,
    sources: string[],
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<TeacherResponse> {
    try {
      // Build the prompt with teacher persona
      const prompt = this.buildTeacherPrompt(
        question,
        retrievedContext,
        conversationHistory
      );

      // Generate response
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse structured response
      const structuredResponse = this.parseStructuredResponse(text);

      // Calculate confidence based on retrieval quality
      const confidence = this.calculateConfidence(retrievedContext, text);

      // Generate flags
      const flags = this.generateFlags(confidence, retrievedContext);

      return {
        answer: text,
        structuredResponse,
        sources,
        confidence,
        flags,
      };
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      throw error;
    }
  }

  /**
   * Build prompt with teacher persona
   */
  private buildTeacherPrompt(
    question: string,
    retrievedContext: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): string {
    const systemPrompt = `You are a professional school teacher. Your role is to:
- Explain concepts clearly, patiently, and encouragingly
- Use age-appropriate language for secondary school students
- Follow pedagogical best practices with scaffolded learning
- Maintain a professional educator tone (not casual chatbot)
- Only use information from the provided context
- Acknowledge when you're uncertain about an answer
- Cite sources when making factual claims

STRUCTURED RESPONSE FORMAT:
Always organize your response in this exact structure:

**Introduction:**
[Brief overview of the topic, 2-3 sentences]

**Explanation:**
[Step-by-step breakdown of the concept, numbered steps if applicable]

**Examples:**
[Worked examples demonstrating the concept]

**Summary:**
[Key takeaways, 2-3 bullet points]

IMPORTANT RULES:
1. If the retrieved context doesn't contain enough information to answer, say: "I cannot find sufficient information about this topic in the provided study materials."
2. Never make up information not present in the context
3. Keep explanations simple and accessible
4. Use encouraging language like "Great question!" or "Let's explore this together"`;

    const contextSection = `
RETRIEVED CONTEXT (from study materials):
${retrievedContext}

`;

    const historySection = conversationHistory && conversationHistory.length > 0
      ? `
PREVIOUS CONVERSATION:
${conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n')}

`
      : '';

    const questionSection = `
STUDENT QUESTION:
${question}

`;

    return systemPrompt + contextSection + historySection + questionSection;
  }

  /**
   * Parse structured response from Gemini output
   */
  private parseStructuredResponse(text: string): TeacherResponse['structuredResponse'] {
    const sections = {
      introduction: '',
      explanation: '',
      examples: '',
      summary: '',
    };

    // Try to extract sections using markdown headers
    const introductionMatch = text.match(/\*\*Introduction:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const explanationMatch = text.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const examplesMatch = text.match(/\*\*Examples:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const summaryMatch = text.match(/\*\*Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);

    sections.introduction = introductionMatch
      ? introductionMatch[1].trim()
      : this.extractFirstParagraph(text);
    sections.explanation = explanationMatch
      ? explanationMatch[1].trim()
      : text;
    sections.examples = examplesMatch
      ? examplesMatch[1].trim()
      : '';
    sections.summary = summaryMatch
      ? summaryMatch[1].trim()
      : '';

    return sections;
  }

  /**
   * Extract first paragraph as introduction fallback
   */
  private extractFirstParagraph(text: string): string {
    const paragraphs = text.split('\n\n');
    return paragraphs[0]?.trim() || '';
  }

  /**
   * Calculate confidence score based on retrieval quality
   */
  private calculateConfidence(context: string, response: string): number {
    // If context is empty, very low confidence
    if (!context || context.trim().length === 0) {
      return 0.1;
    }

    // If response indicates uncertainty, lower confidence
    const uncertaintyPhrases = [
      'i cannot find',
      'not enough information',
      'unable to determine',
      'uncertain',
    ];

    const lowerResponse = response.toLowerCase();
    for (const phrase of uncertaintyPhrases) {
      if (lowerResponse.includes(phrase)) {
        return 0.3;
      }
    }

    // Default high confidence if context is substantial
    if (context.length > 200) {
      return 0.85;
    }

    return 0.6;
  }

  /**
   * Generate response flags
   */
  private generateFlags(confidence: number, context: string): string[] {
    const flags: string[] = [];

    if (confidence < 0.5) {
      flags.push('LOW_CONFIDENCE');
    }

    if (!context || context.trim().length === 0) {
      flags.push('NO_RETRIEVAL');
    }

    return flags;
  }

  /**
   * Generate a simple response (for chat without retrieval)
   */
  async generateSimpleResponse(
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      const prompt = conversationHistory && conversationHistory.length > 0
        ? `${conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n')}\nStudent: ${message}`
        : `Student: ${message}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating simple response:', error);
      throw error;
    }
  }

  /**
   * Generate daily lesson slides
   */
  async generateDailyLesson(topic: string, subject: string): Promise<Array<{
    slideNumber: number;
    slideType: 'overview' | 'explanation' | 'example' | 'summary';
    title: string;
    content: string;
    bulletPoints?: string[];
  }>> {
    try {
      const prompt = `You are a professional teacher. Create a 7-slide structured lesson about "${topic}" for ${subject}.

REQUIREMENTS:
- Slide 1: Topic Overview with learning objectives
- Slides 2-5: Detailed explanation broken into logical sections
- Slide 6: Worked examples
- Slide 7: Summary with key takeaways

Use simple, age-appropriate language. Include bullet points for clarity.

Format each slide as:
SLIDE 1: [Title]
- Type: overview
- Content: [main content]
- Bullets: [bullet points]

SLIDE 2: [Title]
... (continue for all 7 slides)`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseLessonSlides(text);
    } catch (error) {
      console.error('Error generating daily lesson:', error);
      throw error;
    }
  }

  /**
   * Parse lesson slides from Gemini output
   */
  private parseLessonSlides(text: string): Array<{
    slideNumber: number;
    slideType: 'overview' | 'explanation' | 'example' | 'summary';
    title: string;
    content: string;
    bulletPoints?: string[];
  }> {
    const slides: Array<{
      slideNumber: number;
      slideType: 'overview' | 'explanation' | 'example' | 'summary';
      title: string;
      content: string;
      bulletPoints?: string[];
    }> = [];

    // Simple parsing - in production, use more robust parsing
    const slideMatches = text.match(/SLIDE\s*(\d+):([\s\S]*?)(?=SLIDE|$)/gi);

    if (!slideMatches) {
      // Fallback: create default structure
      return this.createDefaultLessonStructure();
    }

    slideMatches.forEach((match, index) => {
      const slideNum = parseInt(match.match(/SLIDE\s*(\d+)/i)?.[1] || String(index + 1));
      const content = match.split(':')[1]?.trim() || '';

      // Determine slide type based on position
      let slideType: 'overview' | 'explanation' | 'example' | 'summary' = 'explanation';
      if (slideNum === 1) slideType = 'overview';
      else if (slideNum === 6) slideType = 'example';
      else if (slideNum === 7) slideType = 'summary';

      // Extract title and content
      const lines = content.split('\n');
      const title = lines[0]?.replace(/^-/, '').trim() || `Slide ${slideNum}`;
      const body = lines.slice(1).join('\n').trim();

      // Extract bullet points
      const bulletPoints = content
        .match(/^-?\s*(.+)/gm)
        ?.map((b) => b.replace(/^-?\s*/, '').trim()) || [];

      slides.push({
        slideNumber: slideNum,
        slideType,
        title,
        content: body,
        bulletPoints: bulletPoints.length > 0 ? bulletPoints : undefined,
      });
    });

    return slides;
  }

  /**
   * Create default lesson structure as fallback
   */
  private createDefaultLessonStructure(): Array<{
    slideNumber: number;
    slideType: 'overview' | 'explanation' | 'example' | 'summary';
    title: string;
    content: string;
    bulletPoints?: string[];
  }> {
    return [
      { slideNumber: 1, slideType: 'overview', title: 'Lesson Overview', content: 'Introduction to the topic', bulletPoints: ['Learning objective 1', 'Learning objective 2'] },
      { slideNumber: 2, slideType: 'explanation', title: 'Part 1', content: 'First part of explanation', bulletPoints: [] },
      { slideNumber: 3, slideType: 'explanation', title: 'Part 2', content: 'Second part of explanation', bulletPoints: [] },
      { slideNumber: 4, slideType: 'explanation', title: 'Part 3', content: 'Third part of explanation', bulletPoints: [] },
      { slideNumber: 5, slideType: 'explanation', title: 'Part 4', content: 'Fourth part of explanation', bulletPoints: [] },
      { slideNumber: 6, slideType: 'example', title: 'Examples', content: 'Worked examples', bulletPoints: ['Example 1', 'Example 2'] },
      { slideNumber: 7, slideType: 'summary', title: 'Summary', content: 'Key takeaways', bulletPoints: ['Key point 1', 'Key point 2'] },
    ];
  }

  /**
   * Generate content with prompt (for smart teaching)
   */
  async generateContent(
    prompt: string,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.config.model!,
        generationConfig: {
          temperature: options?.temperature ?? this.config.temperature!,
          maxOutputTokens: options?.maxOutputTokens ?? this.config.maxOutputTokens!,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
