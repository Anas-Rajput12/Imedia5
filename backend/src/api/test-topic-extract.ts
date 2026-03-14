/**
 * Quick fix for topic names - extract from content instead of filename
 */

const testContent = `Page 40 1 square, 4 sides, 4 vertices; rectangle, 4 sides, 4 vertices`;

// Test extracting topic from content
const lines = testContent.split('\n').filter(l => l.trim().length > 0);
console.log('Lines:', lines);

// Look for meaningful text
for (const line of lines.slice(0, 5)) {
  console.log('Line:', line);
  // Remove page numbers and metadata
  const clean = line.replace(/^\s*\d+\s*/, '').trim();
  console.log('Clean:', clean);
}
