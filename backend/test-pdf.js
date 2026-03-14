// Quick test - just PDF parsing and embedding
const pdfLib = require('pdf-parse');
const pdfParse = pdfLib.PDFParse || pdfLib.default || pdfLib;
const fs = require('fs');
const path = require('path');

async function quickTest() {
  console.log('=== Quick PDF Test ===\n');
  
  const testFile = path.join(__dirname, 'data', 'KS1-Awesome-websites.pdf');
  console.log('File:', testFile);
  
  if (!fs.existsSync(testFile)) {
    console.log('❌ File not found!');
    return;
  }
  
  console.log('✓ File exists\n');
  console.log('1. Reading PDF...');
  const buffer = fs.readFileSync(testFile);
  console.log(`   Size: ${buffer.length} bytes`);
  
  console.log('\n2. Parsing PDF...');
  try {
    const data = await pdfParse(buffer);
    console.log(`   ✓ Pages: ${data.numpages}`);
    console.log(`   ✓ Text length: ${data.text.length} chars`);
    console.log(`   ✓ First 200 chars: ${data.text.substring(0, 200)}...`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

quickTest();
