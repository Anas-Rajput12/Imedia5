/**
 * Free HuggingFace Embeddings
 * Uses HuggingFace Inference API (free tier)
 */

const https = require('https');

class HuggingFaceEmbeddings {
  constructor(options = {}) {
    this.model = options.model || 'sentence-transformers/all-MiniLM-L6-v2';
    this.apiKey = options.apiKey || process.env.HUGGINGFACE_API_KEY;
    this.apiUrl = 'https://router.huggingface.co';
  }

  async embedQuery(text) {
    const embeddings = await this.embedDocuments([text]);
    return embeddings[0];
  }

  async embedDocuments(texts) {
    const results = [];
    
    for (const text of texts) {
      try {
        const embedding = await this._getEmbedding(text);
        results.push(embedding);
      } catch (error) {
        console.error('Embedding error:', error.message);
        // Return zero vector on error
        results.push(new Array(384).fill(0));
      }
    }
    
    return results;
  }

  _getEmbedding(text) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true,
          use_gpu: false,
        },
      });

      const options = {
        hostname: 'router.huggingface.co',
        port: 443,
        path: `/hf-inference/pipeline/feature-extraction/${this.model}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            if (result.error) {
              reject(new Error(result.error));
            } else {
              resolve(result);
            }
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }
}

module.exports = { HuggingFaceEmbeddings };
