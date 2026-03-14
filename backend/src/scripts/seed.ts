/**
 * Database Seed Script
 * Creates tables and populates database with curriculum topics for Years 5-9
 * Subjects: Maths, Science, English (Homework)
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { CurriculumTopic } from '../models/curriculumTopic';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Initialize database
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const topicRepo = AppDataSource.getRepository(CurriculumTopic);

    // Comprehensive curriculum topics for Years 5-9
    const topics: Partial<CurriculumTopic>[] = [
      // ==================== MATHS YEAR 5 ====================
      {
        topic_id: 'maths_y5_place_value',
        topic_name: 'Place Value',
        subject: 'maths',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Understanding place value in numbers up to 1 million',
        learning_objectives: [
          'Read and write numbers to 1 million',
          'Understand value of each digit',
          'Compare and order numbers',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: 'Place value is the value of each digit in a number based on its position.',
          examples: ['In 456,789: 4=100,000, 5=10,000, 6=1,000, 7=100, 8=10, 9=1'],
          rules: ['Each position is 10 times the value of the position to its right'],
        },
      },
      {
        topic_id: 'maths_y5_addition_subtraction',
        topic_name: 'Addition and Subtraction',
        subject: 'maths',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Adding and subtracting whole numbers with up to 6 digits',
        learning_objectives: [
          'Add numbers with up to 6 digits',
          'Subtract numbers with up to 6 digits',
          'Solve multi-step problems',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Addition combines numbers. Subtraction finds the difference.',
          examples: ['123,456 + 78,901 = 202,357', '500,000 - 123,456 = 376,544'],
          rules: ['Line up digits by place value', 'Borrow when subtracting'],
        },
      },
      {
        topic_id: 'maths_y5_multiplication_division',
        topic_name: 'Multiplication and Division',
        subject: 'maths',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Multiplying and dividing by single and two-digit numbers',
        learning_objectives: [
          'Multiply 4-digit by 1-digit numbers',
          'Divide 4-digit by 1-digit numbers',
          'Understand factors and multiples',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Multiplication is repeated addition. Division is splitting into equal parts.',
          examples: ['1,234 × 5 = 6,170', '4,500 ÷ 5 = 900'],
          rules: ['Use column method for multiplication', 'Use bus stop method for division'],
        },
      },
      {
        topic_id: 'maths_y5_fractions_intro',
        topic_name: 'Fractions Introduction',
        subject: 'maths',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Understanding and comparing fractions',
        learning_objectives: [
          'Identify equivalent fractions',
          'Compare and order fractions',
          'Add and subtract fractions with same denominator',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'A fraction represents a part of a whole.',
          examples: ['1/2 = 2/4 = 3/6', '3/8 + 2/8 = 5/8'],
          rules: ['Multiply or divide top and bottom by same number for equivalents'],
        },
      },
      {
        topic_id: 'maths_y5_decimals',
        topic_name: 'Decimals',
        subject: 'maths',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Understanding decimals to 3 decimal places',
        learning_objectives: [
          'Read and write decimals',
          'Compare and order decimals',
          'Add and subtract decimals',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Decimals are another way to write fractions.',
          examples: ['0.5 = 1/2', '0.25 = 1/4', '2.5 + 1.75 = 4.25'],
          rules: ['Line up decimal points when adding or subtracting'],
        },
      },
      {
        topic_id: 'maths_y5_geometry_2d',
        topic_name: '2D Shapes',
        subject: 'maths',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Properties of 2D shapes including polygons',
        learning_objectives: [
          'Identify regular and irregular polygons',
          'Understand symmetry',
          'Calculate perimeter',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: '2D shapes are flat shapes with length and width.',
          examples: ['Square: 4 equal sides, 4 right angles', 'Pentagon: 5 sides'],
          rules: ['Perimeter = sum of all sides'],
        },
      },

      // ==================== MATHS YEAR 6 ====================
      {
        topic_id: 'maths_y6_large_numbers',
        topic_name: 'Large Numbers',
        subject: 'maths',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'Working with numbers up to 10 million and beyond',
        learning_objectives: [
          'Read and write numbers to 10 million',
          'Round numbers to nearest 10, 100, 1000',
          'Use negative numbers',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: 'Large numbers extend the place value system.',
          examples: ['10,000,000 = ten million', '-5 is less than -2'],
          rules: ['Rounding: look at digit to the right'],
        },
      },
      {
        topic_id: 'maths_y6_fractions_operations',
        topic_name: 'Fractions Operations',
        subject: 'maths',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'Adding, subtracting, multiplying fractions',
        learning_objectives: [
          'Add and subtract fractions with different denominators',
          'Multiply fractions by whole numbers',
          'Find fractions of amounts',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Fractions can be added, subtracted, and multiplied.',
          examples: ['1/3 + 1/4 = 7/12', '3/4 of 20 = 15'],
          rules: ['Find common denominator for addition/subtraction'],
        },
      },
      {
        topic_id: 'maths_y6_ratio_proportion',
        topic_name: 'Ratio and Proportion',
        subject: 'maths',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'Understanding ratio and proportion',
        learning_objectives: [
          'Solve ratio problems',
          'Understand proportion',
          'Use scale factors',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Ratio compares quantities. Proportion shows parts of a whole.',
          examples: ['Ratio 2:3 means 2 parts to 3 parts'],
          rules: ['Simplify ratios by dividing both numbers'],
        },
      },
      {
        topic_id: 'maths_y6_algebra_intro',
        topic_name: 'Algebra Introduction',
        subject: 'maths',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'Introduction to algebraic expressions',
        learning_objectives: [
          'Use letters to represent numbers',
          'Write simple expressions',
          'Find pairs of numbers in equations',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Algebra uses letters (variables) to represent unknown numbers.',
          examples: ['n + 5 = 12, so n = 7', '2a means 2 × a'],
          rules: ['Do the same to both sides to solve'],
        },
      },
      {
        topic_id: 'maths_y6_area_volume',
        topic_name: 'Area and Volume',
        subject: 'maths',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'Calculating area and volume',
        learning_objectives: [
          'Calculate area of rectangles and triangles',
          'Calculate volume of cubes and cuboids',
          'Estimate area of irregular shapes',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Area is the space inside a 2D shape. Volume is space inside a 3D shape.',
          examples: ['Rectangle area = length × width', 'Cube volume = side³'],
          rules: ['Area in cm², Volume in cm³'],
        },
      },

      // ==================== MATHS YEAR 7 ====================
      {
        topic_id: 'maths_y7_algebra_basics',
        topic_name: 'Algebra Basics',
        subject: 'maths',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Introduction to algebraic expressions and equations',
        learning_objectives: [
          'Simplify algebraic expressions',
          'Solve linear equations',
          'Substitute values into formulas',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: 'Algebra uses letters to represent numbers in equations.',
          examples: ['2x + 3 = 7', '3a - 5 = 10'],
          rules: ['Do the same to both sides', 'Collect like terms'],
        },
      },
      {
        topic_id: 'maths_y7_fractions',
        topic_name: 'Fractions, Decimals, Percentages',
        subject: 'maths',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Working with fractions, decimals, and percentages',
        learning_objectives: [
          'Convert between fractions, decimals, percentages',
          'Calculate percentages of amounts',
          'Order fractions, decimals, percentages',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Fractions, decimals, and percentages are different ways to show parts.',
          examples: ['1/2 = 0.5 = 50%', '3/4 = 0.75 = 75%'],
          rules: ['To convert: fraction → divide, decimal → ×100 for %'],
        },
      },
      {
        topic_id: 'maths_y7_negative_numbers',
        topic_name: 'Negative Numbers',
        subject: 'maths',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Understanding and calculating with negative numbers',
        learning_objectives: [
          'Order negative numbers',
          'Add and subtract negative numbers',
          'Multiply and divide negative numbers',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: 'Negative numbers are less than zero.',
          examples: ['-5 + 3 = -2', '-3 × -4 = 12', '10 - (-5) = 15'],
          rules: ['Same signs = positive, Different signs = negative'],
        },
      },
      {
        topic_id: 'maths_y7_ratio',
        topic_name: 'Ratio and Proportion',
        subject: 'maths',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Advanced ratio and proportion problems',
        learning_objectives: [
          'Simplify ratios',
          'Divide quantities in a ratio',
          'Solve proportion problems',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Ratio compares quantities. Proportion shows equality of ratios.',
          examples: ['Simplify 12:8 = 3:2', 'Divide £50 in ratio 2:3 = £20 and £30'],
          rules: ['Total parts = sum of ratio numbers'],
        },
      },
      {
        topic_id: 'maths_y7_angles',
        topic_name: 'Angles and Parallel Lines',
        subject: 'maths',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Understanding angles and parallel line properties',
        learning_objectives: [
          'Measure and draw angles',
          'Understand angle facts',
          'Use parallel line rules',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Angles measure turn. Parallel lines never meet.',
          examples: ['Angles on straight line = 180°', 'Angles in triangle = 180°'],
          rules: ['Corresponding, Alternate, Co-interior angles'],
        },
      },

      // ==================== MATHS YEAR 8 ====================
      {
        topic_id: 'maths_y8_angles',
        topic_name: 'Angles and Geometry',
        subject: 'maths',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Understanding angles, shapes, and geometric properties',
        learning_objectives: [
          'Measure and draw angles',
          'Calculate angles in triangles and quadrilaterals',
          'Understand angle properties',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Angles measure the turn between two lines.',
          examples: ['Right angle = 90°', 'Straight line = 180°'],
          rules: ['Angles in a triangle sum to 180°', 'Angles on a straight line sum to 180°'],
        },
      },
      {
        topic_id: 'maths_y8_algebra_expanding',
        topic_name: 'Expanding Brackets',
        subject: 'maths',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Expanding single and double brackets',
        learning_objectives: [
          'Expand single brackets',
          'Expand double brackets',
          'Factorise expressions',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Expanding means multiplying out brackets.',
          examples: ['3(x + 2) = 3x + 6', '(x + 3)(x + 2) = x² + 5x + 6'],
          rules: ['Multiply everything inside by outside'],
        },
      },
      {
        topic_id: 'maths_y8_pythagoras',
        topic_name: 'Pythagoras Theorem',
        subject: 'maths',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Using Pythagoras theorem in right-angled triangles',
        learning_objectives: [
          'Understand Pythagoras theorem',
          'Calculate hypotenuse',
          'Calculate shorter sides',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'In a right-angled triangle: a² + b² = c²',
          examples: ['If a=3, b=4, then c=5', 'If c=13, a=5, then b=12'],
          rules: ['c is always the hypotenuse (longest side)'],
        },
      },
      {
        topic_id: 'maths_y8_trigonometry',
        topic_name: 'Trigonometry Introduction',
        subject: 'maths',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Introduction to SOH CAH TOA',
        learning_objectives: [
          'Label triangle sides (opp, adj, hyp)',
          'Use sin, cos, tan ratios',
          'Calculate missing sides',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Trigonometry links angles and sides in right-angled triangles.',
          examples: ['sin = opp/hyp', 'cos = adj/hyp', 'tan = opp/adj'],
          rules: ['SOH CAH TOA'],
        },
      },
      {
        topic_id: 'maths_y8_probability',
        topic_name: 'Probability',
        subject: 'maths',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Understanding and calculating probability',
        learning_objectives: [
          'Understand probability scale',
          'Calculate theoretical probability',
          'Use probability diagrams',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: 'Probability measures how likely an event is (0 to 1).',
          examples: ['P(heads) = 1/2', 'P(rolling 6) = 1/6'],
          rules: ['Probability = favorable outcomes / total outcomes'],
        },
      },

      // ==================== MATHS YEAR 9 ====================
      {
        topic_id: 'maths_y9_algebra_advanced',
        topic_name: 'Advanced Algebra',
        subject: 'maths',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'Solving complex algebraic equations',
        learning_objectives: [
          'Solve equations with brackets',
          'Solve equations with unknowns on both sides',
          'Rearrange formulas',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Advanced algebra involves complex equations and formulas.',
          examples: ['2(x + 3) = 5x - 6', 'Make x the subject: y = 3x + 2'],
          rules: ['Balance the equation', 'Inverse operations'],
        },
      },
      {
        topic_id: 'maths_y9_sequences',
        topic_name: 'Sequences',
        subject: 'maths',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'Linear and quadratic sequences',
        learning_objectives: [
          'Find nth term of linear sequences',
          'Recognize quadratic sequences',
          'Generate sequences from rules',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'A sequence is a list of numbers following a rule.',
          examples: ['2, 5, 8, 11... nth term = 3n - 1', '1, 4, 9, 16... square numbers'],
          rules: ['Find the difference between terms'],
        },
      },
      {
        topic_id: 'maths_y9_graphs',
        topic_name: 'Graphs',
        subject: 'maths',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'Plotting and interpreting graphs',
        learning_objectives: [
          'Plot linear graphs',
          'Understand y = mx + c',
          'Interpret real-life graphs',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Graphs show relationships between variables.',
          examples: ['y = 2x + 1', 'Gradient = m, y-intercept = c'],
          rules: ['Gradient = change in y / change in x'],
        },
      },
      {
        topic_id: 'maths_y9_circle',
        topic_name: 'Circle Theorems',
        subject: 'maths',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'Properties of circles and circle theorems',
        learning_objectives: [
          'Calculate circumference and area',
          'Understand circle parts',
          'Apply circle theorems',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Circles have special properties and formulas.',
          examples: ['Circumference = πd', 'Area = πr²'],
          rules: ['Angle in semicircle = 90°', 'Angles in same segment are equal'],
        },
      },

      // ==================== SCIENCE YEAR 5 ====================
      {
        topic_id: 'science_y5_living_things',
        topic_name: 'Living Things',
        subject: 'science',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Classification of living things',
        learning_objectives: [
          'Identify characteristics of living things',
          'Group animals and plants',
          'Understand food chains',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: 'Living things grow, reproduce, and respond to their environment.',
          examples: ['Mammals, birds, fish, reptiles, amphibians'],
          rules: ['MRS GREN: Movement, Respiration, Growth, Reproduction, Excretion, Nutrition'],
        },
      },
      {
        topic_id: 'science_y5_materials',
        topic_name: 'Materials and Changes',
        subject: 'science',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Properties and changes of materials',
        learning_objectives: [
          'Compare materials by properties',
          'Understand reversible and irreversible changes',
          'Know about dissolving',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Materials have different properties that make them useful.',
          examples: ['Metal conducts heat', 'Plastic is waterproof'],
          rules: ['Reversible: melting, freezing. Irreversible: burning, rusting'],
        },
      },
      {
        topic_id: 'science_y5_earth_space',
        topic_name: 'Earth and Space',
        subject: 'science',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Earth, sun, and moon',
        learning_objectives: [
          'Understand Earth\'s rotation',
          'Explain day and night',
          'Know about the solar system',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: 'Earth rotates on its axis and orbits the sun.',
          examples: ['Earth rotates once every 24 hours', 'Moon orbits Earth every 28 days'],
          rules: ['Day = side facing sun, Night = side away from sun'],
        },
      },
      {
        topic_id: 'science_y5_forces',
        topic_name: 'Forces',
        subject: 'science',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Understanding forces and motion',
        learning_objectives: [
          'Identify different forces',
          'Understand gravity',
          'Know about air and water resistance',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'A force is a push or pull.',
          examples: ['Gravity pulls objects down', 'Friction slows motion'],
          rules: ['Balanced forces = no change, Unbalanced = acceleration'],
        },
      },

      // ==================== SCIENCE YEAR 6 ====================
      {
        topic_id: 'science_y6_circulatory',
        topic_name: 'Circulatory System',
        subject: 'science',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'Heart, blood, and circulation',
        learning_objectives: [
          'Understand heart function',
          'Know blood components',
          'Explain circulation',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'The circulatory system transports blood around the body.',
          examples: ['Heart pumps blood', 'Red blood cells carry oxygen'],
          rules: ['Heart rate increases during exercise'],
        },
      },
      {
        topic_id: 'science_y6_evolution',
        topic_name: 'Evolution and Inheritance',
        subject: 'science',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'How species change over time',
        learning_objectives: [
          'Understand evolution',
          'Know about fossils',
          'Explain adaptation',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Evolution is how living things change over time.',
          examples: ['Darwin\'s finches', 'Camouflage in animals'],
          rules: ['Natural selection: best adapted survive'],
        },
      },
      {
        topic_id: 'science_y6_electricity',
        topic_name: 'Electricity',
        subject: 'science',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'Electrical circuits and components',
        learning_objectives: [
          'Draw circuit diagrams',
          'Understand series and parallel circuits',
          'Know conductors and insulators',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Electricity flows in a complete circuit.',
          examples: ['Series: one path', 'Parallel: multiple paths'],
          rules: ['Current same in series, splits in parallel'],
        },
      },

      // ==================== SCIENCE YEAR 7 ====================
      {
        topic_id: 'science_y7_cells',
        topic_name: 'Cells and Organisation',
        subject: 'science',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Introduction to cells, tissues, and organs',
        learning_objectives: [
          'Identify plant and animal cells',
          'Understand cell structure',
          'Describe levels of organisation',
        ],
        estimated_duration_mins: 16,
        content: {
          definition: 'Cells are the basic building blocks of life.',
          examples: ['Animal cells', 'Plant cells', 'Bacterial cells'],
          rules: ['All living things are made of cells', 'Cells have specialized functions'],
        },
      },
      {
        topic_id: 'science_y7_particles',
        topic_name: 'Particles',
        subject: 'science',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Particle model of matter',
        learning_objectives: [
          'Understand solids, liquids, gases',
          'Explain changes of state',
          'Know about diffusion',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: 'All matter is made of tiny particles.',
          examples: ['Ice → Water → Steam', 'Perfume diffuses through air'],
          rules: ['Solids: fixed shape, Liquids: flow, Gases: spread out'],
        },
      },
      {
        topic_id: 'science_y7_energy',
        topic_name: 'Energy',
        subject: 'science',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Energy stores and transfers',
        learning_objectives: [
          'Identify energy stores',
          'Understand energy transfers',
          'Know conservation of energy',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Energy cannot be created or destroyed, only transferred.',
          examples: ['Chemical → Kinetic in muscles', 'Electrical → Light in bulb'],
          rules: ['Energy is conserved'],
        },
      },
      {
        topic_id: 'science_y7_reproduction',
        topic_name: 'Human Reproduction',
        subject: 'science',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Human reproductive systems',
        learning_objectives: [
          'Understand reproductive organs',
          'Know about puberty',
          'Explain fertilisation',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Reproduction creates new organisms.',
          examples: ['Sperm + Egg → Zygote', 'Pregnancy lasts 9 months'],
          rules: ['Fertilisation happens in fallopian tubes'],
        },
      },

      // ==================== SCIENCE YEAR 8 ====================
      {
        topic_id: 'science_y8_digestion',
        topic_name: 'Digestion',
        subject: 'science',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Digestive system and nutrition',
        learning_objectives: [
          'Understand digestive organs',
          'Know about enzymes',
          'Explain healthy diet',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Digestion breaks down food for absorption.',
          examples: ['Mouth → Oesophagus → Stomach → Small intestine'],
          rules: ['Enzymes speed up digestion'],
        },
      },
      {
        topic_id: 'science_y8_breathing',
        topic_name: 'Breathing and Respiration',
        subject: 'science',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Respiratory system and cellular respiration',
        learning_objectives: [
          'Understand lungs and breathing',
          'Know about gas exchange',
          'Explain aerobic respiration',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Respiration releases energy from glucose.',
          examples: ['Glucose + Oxygen → CO₂ + Water + Energy'],
          rules: ['Gas exchange in alveoli'],
        },
      },
      {
        topic_id: 'science_y8_periodic_table',
        topic_name: 'Periodic Table',
        subject: 'science',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Elements, compounds, and the periodic table',
        learning_objectives: [
          'Understand elements and compounds',
          'Navigate the periodic table',
          'Know groups and periods',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Elements are pure substances. Compounds are chemically bonded elements.',
          examples: ['H₂O is water', 'CO₂ is carbon dioxide'],
          rules: ['Groups = columns, Periods = rows'],
        },
      },
      {
        topic_id: 'science_y8_waves',
        topic_name: 'Waves and Sound',
        subject: 'science',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Wave properties and sound',
        learning_objectives: [
          'Understand wave properties',
          'Know how sound travels',
          'Explain pitch and loudness',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: 'Waves transfer energy without transferring matter.',
          examples: ['Sound needs a medium', 'Higher frequency = higher pitch'],
          rules: ['Amplitude = loudness, Frequency = pitch'],
        },
      },

      // ==================== SCIENCE YEAR 9 ====================
      {
        topic_id: 'science_y9_photosynthesis',
        topic_name: 'Photosynthesis',
        subject: 'science',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'How plants make food',
        learning_objectives: [
          'Understand photosynthesis equation',
          'Know limiting factors',
          'Explain plant adaptations',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Photosynthesis is how plants make glucose using light energy.',
          examples: ['6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂'],
          rules: ['Light, CO₂, temperature are limiting factors'],
        },
      },
      {
        topic_id: 'science_y9_chemical_reactions',
        topic_name: 'Chemical Reactions',
        subject: 'science',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'Types of chemical reactions',
        learning_objectives: [
          'Write word equations',
          'Balance symbol equations',
          'Understand reaction types',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Chemical reactions form new substances.',
          examples: ['Acid + Base → Salt + Water', 'Metal + Acid → Salt + Hydrogen'],
          rules: ['Mass is conserved'],
        },
      },
      {
        topic_id: 'science_y9_forces_motion',
        topic_name: 'Forces and Motion',
        subject: 'science',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'Advanced forces and Newton\'s laws',
        learning_objectives: [
          'Calculate speed and acceleration',
          'Understand Newton\'s laws',
          'Interpret motion graphs',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Forces cause changes in motion.',
          examples: ['F = ma', 'Speed = distance/time'],
          rules: ['Every action has equal opposite reaction'],
        },
      },
      {
        topic_id: 'science_y9_electricity_advanced',
        topic_name: 'Electricity Advanced',
        subject: 'science',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'Advanced electrical concepts',
        learning_objectives: [
          'Calculate resistance',
          'Understand V = IR',
          'Calculate power',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Electricity involves flow of charge.',
          examples: ['V = IR', 'P = IV'],
          rules: ['Resistance increases with length, decreases with thickness'],
        },
      },

      // ==================== ENGLISH (HOMEWORK) YEAR 5 ====================
      {
        topic_id: 'english_y5_reading_comprehension',
        topic_name: 'Reading Comprehension',
        subject: 'english',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Understanding and analyzing texts',
        learning_objectives: [
          'Retrieve information from texts',
          'Make inferences',
          'Understand vocabulary in context',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Comprehension means understanding what you read.',
          examples: ['Finding key details', 'Understanding character feelings'],
          rules: ['Read carefully, highlight key words'],
        },
      },
      {
        topic_id: 'english_y5_writing_narrative',
        topic_name: 'Narrative Writing',
        subject: 'english',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Writing stories with structure',
        learning_objectives: [
          'Plan story structure',
          'Use paragraphs',
          'Include dialogue',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Narrative writing tells a story.',
          examples: ['Beginning, Middle, End', 'Use speech marks for dialogue'],
          rules: ['Show not tell'],
        },
      },
      {
        topic_id: 'english_y5_grammar',
        topic_name: 'Grammar and Punctuation',
        subject: 'english',
        year_level: 5,
        exam_board: 'GCSE',
        description: 'Correct grammar and punctuation',
        learning_objectives: [
          'Use correct punctuation',
          'Understand sentence types',
          'Know parts of speech',
        ],
        estimated_duration_mins: 15,
        content: {
          definition: 'Grammar is the rules of language.',
          examples: ['Nouns, verbs, adjectives', 'Full stops, commas, speech marks'],
          rules: ['Capitalize proper nouns', 'Use paragraphs for new speakers'],
        },
      },

      // ==================== ENGLISH (HOMEWORK) YEAR 6 ====================
      {
        topic_id: 'english_y6_poetry',
        topic_name: 'Poetry',
        subject: 'english',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'Reading and writing poetry',
        learning_objectives: [
          'Identify poetic devices',
          'Analyze poems',
          'Write original poems',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Poetry uses rhythm, rhyme, and imagery.',
          examples: ['Metaphor, simile, alliteration', 'Haiku, acrostic, free verse'],
          rules: ['Poems don\'t always need to rhyme'],
        },
      },
      {
        topic_id: 'english_y6_persuasive',
        topic_name: 'Persuasive Writing',
        subject: 'english',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'Writing to persuade and argue',
        learning_objectives: [
          'Use persuasive techniques',
          'Structure arguments',
          'Use rhetorical questions',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Persuasive writing convinces the reader.',
          examples: ['FOREST techniques', 'Rhetorical questions'],
          rules: ['State opinion, give reasons, counter arguments'],
        },
      },
      {
        topic_id: 'english_y6_shakespeare',
        topic_name: 'Shakespeare Introduction',
        subject: 'english',
        year_level: 6,
        exam_board: 'GCSE',
        description: 'Introduction to Shakespeare',
        learning_objectives: [
          'Know about Shakespeare\'s life',
          'Understand Elizabethan theatre',
          'Read simplified extracts',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Shakespeare wrote plays and poems 400 years ago.',
          examples: ['Romeo and Juliet', 'A Midsummer Night\'s Dream'],
          rules: ['Theatre had no scenery, boys played women'],
        },
      },

      // ==================== ENGLISH (HOMEWORK) YEAR 7 ====================
      {
        topic_id: 'english_y7_analysis',
        topic_name: 'Text Analysis',
        subject: 'english',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Analyzing literature',
        learning_objectives: [
          'Use PEE/PEEL structure',
          'Analyze language techniques',
          'Explore themes',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Analysis explains how writers create effects.',
          examples: ['Point, Evidence, Explain', 'Metaphor creates imagery'],
          rules: ['Quote + Analysis = deeper understanding'],
        },
      },
      {
        topic_id: 'english_y7_creative',
        topic_name: 'Creative Writing',
        subject: 'english',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Advanced creative writing techniques',
        learning_objectives: [
          'Use sophisticated vocabulary',
          'Vary sentence structures',
          'Create atmosphere',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Creative writing uses imagination and skill.',
          examples: ['Show not tell', 'Sensory details'],
          rules: ['Plan before writing', 'Edit and improve'],
        },
      },
      {
        topic_id: 'english_y7_media',
        topic_name: 'Media Language',
        subject: 'english',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Analyzing media texts',
        learning_objectives: [
          'Understand bias',
          'Analyze headlines',
          'Identify persuasive techniques',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Media texts try to influence readers.',
          examples: ['Headlines grab attention', 'Images support message'],
          rules: ['Consider purpose and audience'],
        },
      },

      // ==================== ENGLISH (HOMEWORK) YEAR 8 ====================
      {
        topic_id: 'english_y8_gothic',
        topic_name: 'Gothic Literature',
        subject: 'english',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Gothic conventions and analysis',
        learning_objectives: [
          'Identify gothic features',
          'Analyze atmosphere',
          'Write gothic descriptions',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Gothic literature creates fear and suspense.',
          examples: ['Dark settings', 'Supernatural elements', 'Mystery'],
          rules: ['Use pathetic fallacy', 'Build tension'],
        },
      },
      {
        topic_id: 'english_y8_rhetoric',
        topic_name: 'Rhetoric and Oratory',
        subject: 'english',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Speech writing and delivery',
        learning_objectives: [
          'Use rhetorical devices',
          'Structure speeches',
          'Understand audience',
        ],
        estimated_duration_mins: 20,
        content: {
          definition: 'Rhetoric is the art of persuasive speaking.',
          examples: ['Rule of three', 'Emotive language', 'Direct address'],
          rules: ['Know your audience', 'Practice delivery'],
        },
      },
      {
        topic_id: 'english_y8_nineteenth_century',
        topic_name: '19th Century Literature',
        subject: 'english',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Reading Victorian literature',
        learning_objectives: [
          'Understand Victorian context',
          'Analyze 19th century language',
          'Explore social issues',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: '19th century literature reflects Victorian society.',
          examples: ['Charles Dickens', 'Charlotte Brontë'],
          rules: ['Language was more formal'],
        },
      },

      // ==================== ENGLISH (HOMEWORK) YEAR 9 ====================
      {
        topic_id: 'english_y9_gcse_prep',
        topic_name: 'GCSE Preparation',
        subject: 'english',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'Preparing for GCSE English',
        learning_objectives: [
          'Understand GCSE requirements',
          'Practice exam techniques',
          'Develop analytical skills',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'GCSE English tests reading and writing skills.',
          examples: ['Unseen texts', 'Creative writing', 'Analytical essays'],
          rules: ['Plan answers', 'Use technical terms', 'Manage time'],
        },
      },
      {
        topic_id: 'english_y9_modern_drama',
        topic_name: 'Modern Drama',
        subject: 'english',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'Analyzing modern plays',
        learning_objectives: [
          'Understand dramatic techniques',
          'Analyze character development',
          'Explore themes',
        ],
        estimated_duration_mins: 25,
        content: {
          definition: 'Drama is written to be performed.',
          examples: ['Stage directions', 'Dialogue', 'Conflict'],
          rules: ['Consider audience impact'],
        },
      },
      {
        topic_id: 'english_y9_language_change',
        topic_name: 'Language Change',
        subject: 'english',
        year_level: 9,
        exam_board: 'GCSE',
        description: 'How English has evolved',
        learning_objectives: [
          'Understand historical change',
          'Analyze old texts',
          'Know about dialects',
        ],
        estimated_duration_mins: 18,
        content: {
          definition: 'Language changes over time and place.',
          examples: ['Old English vs Modern English', 'Regional dialects'],
          rules: ['Influenced by technology, culture, contact'],
        },
      },
    ];

    console.log(`📋 Total topics to seed: ${topics.length}`);

    // Insert topics
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const topic of topics) {
      const existing = await topicRepo.findOne({ where: { topic_id: topic.topic_id } });
      
      if (!existing) {
        const newTopic = topicRepo.create(topic);
        await topicRepo.save(newTopic);
        created++;
        console.log(`✅ Created: ${topic.topic_name} (Year ${topic.year_level} ${topic.subject})`);
      } else {
        // Update existing topic
        Object.assign(existing, topic);
        await topicRepo.save(existing);
        updated++;
        console.log(`🔄 Updated: ${topic.topic_name} (Year ${topic.year_level} ${topic.subject})`);
      }
    }

    const totalCount = await topicRepo.count();
    
    console.log('\n📊 Seed Summary:');
    console.log(`   ✅ Created: ${created} topics`);
    console.log(`   🔄 Updated: ${updated} topics`);
    console.log(`   📈 Total in database: ${totalCount} topics`);
    console.log(`\n📚 Subjects covered: Maths, Science, English`);
    console.log(`🎓 Year groups: 5, 6, 7, 8, 9`);

    // Close connection
    await AppDataSource.destroy();
    console.log('\n✅ Seed completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
