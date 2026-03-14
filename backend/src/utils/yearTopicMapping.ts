/**
 * Year to PDF Mapping for Qdrant
 * Maps Year 5-9 to available PDFs in Qdrant
 */

export interface YearPDFMapping {
  year: string;
  subjects: {
    [subject: string]: string[]; // Array of topic names from PDFs
  };
}

export const YEAR_PDF_MAPPING: YearPDFMapping[] = [
  {
    year: 'Year-5',
    subjects: {
      'Maths': [
        'Count and Colour 1',
        'Counting Vegetables',
        'Fruits to Count',
        'Half n Double',
        'KS1 Maths Mat',
        'Maths Card Games for KS1 & KS2',
      ],
      'Biology': [
        'Plants',
        'Animals',
        'Life Cycles',
      ],
    },
  },
  {
    year: 'Year-6',
    subjects: {
      'Maths': [
        '11+ Maths Practice Test 2',
        '227036144 maths ks2',
        'Bitesize KS1 worksheet',
        'Frequency Tables Worksheet',
        'KS1 2003 MAths SAT Guide',
        'KS1 Maths SATs Study Book',
        'KS1 Sats Maths 2018',
        'Ks1 Sats Maths Paper d',
        'Maths Vocab',
        'Powers of 10 Worksheet',
        'Tally Chart Pratcice Test',
      ],
      'Biology': [
        'Plants Reproduction',
        'Classification',
      ],
    },
  },
  {
    year: 'Year-7',
    subjects: {
      'Maths': [
        'Geometry and Shape, Ages 5 7 (Key Stage 1)',
        'KS2 mathematics Paper 2 reasoning 2024',
        'KS2 Maths Test A',
        'Ks2 Maths Test e',
        'KS2 Test A 2008',
        'Year 1 Unit 1 Math Counting to 10',
      ],
      'Biology': [
        'Cells',
        'Digestive System',
        'Photosynthesis',
      ],
    },
  },
  {
    year: 'Year-8',
    subjects: {
      'Maths': [
        'KS2 mathematics Paper 2 reasoning 2024',
        'KS2 Maths Test A',
        'Ks2 Maths Test e',
      ],
      'Biology': [
        'Heart Blood',
        'Plant Transport',
        'Ecology',
      ],
    },
  },
  {
    year: 'Year-9',
    subjects: {
      'Maths': [
        'Yr 9 Powers of 10 and Scaling Numbers',
        'KS2 mathematics Paper 2 reasoning 2024',
      ],
      'Biology': [
        'Nervous System',
        'Inheritance',
        'DNA',
      ],
    },
  },
];

/**
 * Get topics for a specific year and subject from Qdrant PDFs
 */
export function getTopicsForYear(year: string, subject: string): string[] {
  const mapping = YEAR_PDF_MAPPING.find(m => m.year === year);
  
  if (!mapping) {
    console.warn(`No PDF mapping found for year: ${year}`);
    return [];
  }
  
  const subjectTopics = mapping.subjects[subject];
  
  if (!subjectTopics) {
    console.warn(`No PDF mapping found for subject: ${subject} in year: ${year}`);
    return [];
  }
  
  return subjectTopics;
}

/**
 * Map Key Stage to Years
 */
export function keyStageToYears(keyStage: string): string[] {
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
 * Map Year to Key Stage
 */
export function yearToKeyStage(year: string): string {
  const yearNum = parseInt(year.replace('Year-', ''));
  
  if (yearNum >= 1 && yearNum <= 2) return 'KS1';
  if (yearNum >= 3 && yearNum <= 6) return 'KS2';
  if (yearNum >= 7 && yearNum <= 9) return 'KS3';
  if (yearNum >= 10 && yearNum <= 11) return 'KS4';
  if (yearNum >= 12 && yearNum <= 13) return 'KS5';
  
  return 'KS2'; // Default
}
