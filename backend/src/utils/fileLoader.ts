import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface FileContent {
  text: string;
  metadata: {
    fileName: string;
    filePath: string;
    fileType: 'PDF' | 'DOCX' | 'PPTX' | 'TXT';
    fileSize: number;
    extractedAt: Date;
  };
}

export class FileLoader {
  private dataDir: string;

  constructor() {
    this.dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  }

  /**
   * Load and extract text from a file
   */
  async loadFile(filePath: string): Promise<FileContent> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.dataDir, filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    const fileType = this.getFileType(absolutePath);
    const stats = fs.statSync(absolutePath);

    let text: string;

    switch (fileType) {
      case 'PDF':
        text = await this.extractFromPDF(absolutePath);
        break;
      case 'DOCX':
        text = await this.extractFromDOCX(absolutePath);
        break;
      case 'PPTX':
        text = await this.extractFromPPTX(absolutePath);
        break;
      case 'TXT':
        text = await this.extractFromTXT(absolutePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    return {
      text,
      metadata: {
        fileName: path.basename(absolutePath),
        filePath: absolutePath,
        fileType,
        fileSize: stats.size,
        extractedAt: new Date(),
      },
    };
  }

  /**
   * Extract text from PDF
   */
  private async extractFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error: any) {
      console.error(`PDF error (${path.basename(filePath)}): ${error.message}`);
      throw new Error(`Failed to extract text from PDF: ${filePath}`);
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractFromDOCX(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } catch (error: any) {
      console.error(`DOCX error (${path.basename(filePath)}): ${error.message}`);
      throw new Error(`Failed to extract text from DOCX: ${filePath}`);
    }
  }

  /**
   * Extract text from PPTX (treat as ZIP and extract text files)
   * Note: For better PPTX extraction, consider using a dedicated library
   */
  private async extractFromPPTX(filePath: string): Promise<string> {
    try {
      // PPTX is a ZIP file, we'll use a simple approach
      // For production, consider using a library like 'node-pptx-parser'
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Error extracting text from PPTX:', error);
      throw new Error(`Failed to extract text from PPTX: ${filePath}`);
    }
  }

  /**
   * Extract text from TXT
   */
  private async extractFromTXT(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading TXT file:', error);
      throw new Error(`Failed to read TXT file: ${filePath}`);
    }
  }

  /**
   * Get file type from extension
   */
  private getFileType(filePath: string): 'PDF' | 'DOCX' | 'PPTX' | 'TXT' {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.pdf':
        return 'PDF';
      case '.docx':
        return 'DOCX';
      case '.pptx':
        return 'PPTX';
      case '.txt':
        return 'TXT';
      default:
        throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  /**
   * Load all files from a directory recursively
   */
  async loadDirectory(
    dirPath: string,
    options: { recursive?: boolean; extensions?: string[] } = {}
  ): Promise<FileContent[]> {
    const { recursive = true, extensions } = options;
    const files: FileContent[] = [];

    const absolutePath = path.isAbsolute(dirPath)
      ? dirPath
      : path.join(this.dataDir, dirPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Directory not found: ${absolutePath}`);
    }

    const entries = fs.readdirSync(absolutePath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(absolutePath, entry.name);

      if (entry.isDirectory() && recursive) {
        const subFiles = await this.loadDirectory(fullPath, options);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!extensions || extensions.includes(ext)) {
          try {
            const relativePath = path.relative(this.dataDir, fullPath);
            const content = await this.loadFile(relativePath);
            files.push(content);
          } catch (error) {
            console.warn(`Skipping file ${fullPath}: ${error}`);
          }
        }
      }
    }

    return files;
  }

  /**
   * Extract subject from file path
   */
  extractSubject(filePath: string): string {
    const parts = filePath.split(path.sep);

    // Look for subject keywords in path
    const subjectKeywords = ['Math', 'Maths', 'Biology', 'Chemistry', 'Physics', 'English'];

    for (const part of parts) {
      for (const keyword of subjectKeywords) {
        if (part.toLowerCase().includes(keyword.toLowerCase())) {
          // Normalize to standard subject names
          if (part.toLowerCase().includes('math')) {
            return 'Maths';
          }
          return keyword;
        }
      }
    }

    // Default to first directory name if no keyword found
    return parts[0] || 'General';
  }

  /**
   * Extract key stage from file path
   */
  extractKeyStage(filePath: string): string {
    const parts = filePath.split(path.sep);

    // Look for key stage patterns in path
    const ksPatterns = ['KS1', 'KS2', 'KS3', 'KS4', 'KS5', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11'];

    for (const part of parts) {
      for (const pattern of ksPatterns) {
        if (part.toLowerCase().includes(pattern.toLowerCase())) {
          return pattern.replace(' ', '-');
        }
      }
    }

    // Extract from filename patterns like "Year-5-Maths.pdf" or "year5.pdf"
    const fileName = path.basename(filePath);
    const yearMatch = fileName.match(/year[\s_-]?(\d+)/i);
    if (yearMatch) {
      const yearNum = parseInt(yearMatch[1]);
      if (yearNum >= 1 && yearNum <= 11) {
        return `Year-${yearNum}`;
      }
    }

    // Default based on UK education structure
    return 'KS4';
  }

  /**
   * Extract year from PDF content (looks for "Year 5", "Year 6", etc. in text)
   */
  extractYearFromContent(text: string): string | null {
    // Look for patterns like "Year 5", "Year 6", etc.
    const yearPatterns = [
      /Year\s*(\d+)/gi,
      /Year\s*([IVX]+)/gi,  // Roman numerals
      /Grade\s*(\d+)/gi,
      /Key\s*Stage\s*(\d+)/gi,
    ];

    for (const pattern of yearPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const value = match[1];
        
        // Handle Roman numerals
        if (/^[IVX]+$/.test(value)) {
          const romanMap: Record<string, string> = {
            'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
            'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10', 'XI': '11'
          };
          if (romanMap[value]) {
            return `Year-${romanMap[value]}`;
          }
        } else {
          const yearNum = parseInt(value);
          if (yearNum >= 1 && yearNum <= 11) {
            return `Year-${yearNum}`;
          }
        }
      }
    }

    return null;
  }

  /**
   * Map Key Stage to Year range
   */
  keyStageToYears(keyStage: string): string[] {
    const mapping: Record<string, string[]> = {
      'KS1': ['Year-1', 'Year-2'],
      'KS2': ['Year-3', 'Year-4', 'Year-5', 'Year-6'],
      'KS3': ['Year-7', 'Year-8', 'Year-9'],
      'KS4': ['Year-10', 'Year-11'],
      'KS5': ['Year-12', 'Year-13'],
    };
    return mapping[keyStage] || [];
  }

  /**
   * Extract topic from filename
   */
  extractTopic(fileName: string): string {
    // Remove extension
    const name = path.basename(fileName, path.extname(fileName));

    // Convert to title case and replace separators
    const topic = name
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize first letter of each word
    return topic
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

// Export singleton instance
export const fileLoader = new FileLoader();
