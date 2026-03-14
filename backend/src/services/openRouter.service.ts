import { OpenAI } from 'openai';
import { GCSE_TUTOR_SYSTEM_PROMPT } from '../data/gceTutorPrompts';

export interface OpenRouterConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
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

export class OpenRouterService {
  private client: OpenAI;
  private config: OpenRouterConfig;

  constructor(config?: Partial<OpenRouterConfig>) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables');
    }

    this.config = {
      apiKey,
      baseURL,
      model: config?.model || 'meta-llama/llama-3-8b-instruct',
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 1024,
    };


    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
    });
  }

  async generateTeacherResponse(
    question: string,
    retrievedContext: string,
    sources: string[],
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<TeacherResponse> {
    try {
      console.log('Generating response with OpenRouter (GCSE Tutor Style)...');

      const messages = this.buildTeacherMessages(
        question,
        retrievedContext,
        conversationHistory
      );

      const completion = await this.client.chat.completions.create({
        model: this.config.model!,
        messages,
        temperature: this.config.temperature!,
        max_tokens: this.config.maxTokens!,
      });

      const text = completion.choices[0].message.content || '';

      const structuredResponse = this.parseStructuredResponse(text);
      const confidence = this.calculateConfidence(retrievedContext, text);
      const flags = this.generateFlags(confidence, retrievedContext);

      return {
        answer: text,
        structuredResponse,
        sources,
        confidence,
        flags,
      };
    } catch (error: any) {
      console.error('Error generating OpenRouter response:', error.message);
      throw error;
    }
  }

  private buildTeacherMessages(
    question: string,
    retrievedContext: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    // GCSE Tutor System Prompt - makes AI speak like a real human tutor
    const systemMessage = {
      role: 'system' as const,
      content: GCSE_TUTOR_SYSTEM_PROMPT,
    };

    const contextMessage = {
      role: 'user' as const,
      content: `RETRIEVED CONTEXT:\n${retrievedContext}\n\nQUESTION:\n${question}`,
    };

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [systemMessage];

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'student' ? 'user' : 'assistant',
          content: msg.content,
        });
      });
    }

    messages.push(contextMessage);

    return messages;
  }

  private parseStructuredResponse(text: string): TeacherResponse['structuredResponse'] {
    const sections = {
      introduction: '',
      explanation: '',
      examples: '',
      summary: '',
    };

    const introductionMatch = text.match(/\*\*Introduction:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const explanationMatch = text.match(/\*\*Explanation:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const examplesMatch = text.match(/\*\*Examples:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
    const summaryMatch = text.match(/\*\*Summary:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);

    sections.introduction = introductionMatch ? introductionMatch[1].trim() : this.extractFirstParagraph(text);
    sections.explanation = explanationMatch ? explanationMatch[1].trim() : text;
    sections.examples = examplesMatch ? examplesMatch[1].trim() : '';
    sections.summary = summaryMatch ? summaryMatch[1].trim() : '';

    return sections;
  }

  private extractFirstParagraph(text: string): string {
    const paragraphs = text.split('\n\n');
    return paragraphs[0]?.trim() || '';
  }

  private calculateConfidence(context: string, response: string): number {
    if (!context || context.trim().length === 0) {
      return 0.1;
    }

    const uncertaintyPhrases = ['i cannot find', 'not enough information', 'unable to determine', 'uncertain'];
    const lowerResponse = response.toLowerCase();
    for (const phrase of uncertaintyPhrases) {
      if (lowerResponse.includes(phrase)) {
        return 0.3;
      }
    }

    if (context.length > 200) {
      return 0.85;
    }

    return 0.6;
  }

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
}

export const openRouterService = new OpenRouterService();
