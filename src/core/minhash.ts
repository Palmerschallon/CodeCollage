import { CodeSnippet, LSHBucket, Config } from './types.js';

export class MinHashLSH {
  private config: Config;
  private hashFunctions: ((x: string) => number)[];
  private buckets: Map<string, LSHBucket> = new Map();

  constructor(config: Config) {
    this.config = config;
    this.hashFunctions = this.generateHashFunctions(config.minHashBands * config.minHashRows);
  }

  /**
   * Generate hash functions for MinHash
   */
  private generateHashFunctions(count: number): ((x: string) => number)[] {
    const functions: ((x: string) => number)[] = [];
    
    for (let i = 0; i < count; i++) {
      const a = Math.floor(Math.random() * 1000000) + 1;
      const b = Math.floor(Math.random() * 1000000);
      const p = 2147483647; // Large prime number
      
      functions.push((x: string) => {
        let hash = 0;
        for (let j = 0; j < x.length; j++) {
          hash = ((hash * 31) + x.charCodeAt(j)) % p;
        }
        return (a * hash + b) % p;
      });
    }
    
    return functions;
  }

  /**
   * Compute MinHash signature for a set of tokens
   */
  computeMinHash(tokens: string[]): number[] {
    const signature: number[] = [];
    const tokenSet = new Set(tokens);
    
    for (const hashFunc of this.hashFunctions) {
      let minHash = Infinity;
      for (const token of tokenSet) {
        const hash = hashFunc(token);
        if (hash < minHash) {
          minHash = hash;
        }
      }
      signature.push(minHash === Infinity ? 0 : minHash);
    }
    
    return signature;
  }

  /**
   * Compute LSH signature from MinHash signature
   */
  computeLSHSignature(minHashSignature: number[]): string[] {
    const bands: string[] = [];
    const rowsPerBand = this.config.minHashRows;
    
    for (let i = 0; i < this.config.minHashBands; i++) {
      const bandStart = i * rowsPerBand;
      const bandEnd = Math.min(bandStart + rowsPerBand, minHashSignature.length);
      const band = minHashSignature.slice(bandStart, bandEnd);
      bands.push(band.join(','));
    }
    
    return bands;
  }

  /**
   * Add a snippet to LSH buckets
   */
  addSnippet(snippet: CodeSnippet): void {
    const lshSignature = this.computeLSHSignature(snippet.minHashes);
    
    for (const bandSignature of lshSignature) {
      if (!this.buckets.has(bandSignature)) {
        this.buckets.set(bandSignature, {
          signature: bandSignature,
          snippets: []
        });
      }
      
      const bucket = this.buckets.get(bandSignature)!;
      if (!bucket.snippets.includes(snippet.id)) {
        bucket.snippets.push(snippet.id);
      }
    }
  }

  /**
   * Find candidate similar snippets using LSH
   */
  findCandidates(snippet: CodeSnippet): string[] {
    const candidates = new Set<string>();
    const lshSignature = this.computeLSHSignature(snippet.minHashes);
    
    for (const bandSignature of lshSignature) {
      const bucket = this.buckets.get(bandSignature);
      if (bucket) {
        for (const candidateId of bucket.snippets) {
          if (candidateId !== snippet.id) {
            candidates.add(candidateId);
          }
        }
      }
    }
    
    return Array.from(candidates);
  }

  /**
   * Calculate Jaccard similarity between two MinHash signatures
   */
  calculateSimilarity(signature1: number[], signature2: number[]): number {
    if (signature1.length !== signature2.length) {
      throw new Error('Signatures must have the same length');
    }
    
    let matches = 0;
    for (let i = 0; i < signature1.length; i++) {
      if (signature1[i] === signature2[i]) {
        matches++;
      }
    }
    
    return matches / signature1.length;
  }

  /**
   * Remove snippet from all buckets
   */
  removeSnippet(snippetId: string): void {
    for (const bucket of this.buckets.values()) {
      const index = bucket.snippets.indexOf(snippetId);
      if (index > -1) {
        bucket.snippets.splice(index, 1);
      }
    }
    
    // Clean up empty buckets
    for (const [signature, bucket] of this.buckets.entries()) {
      if (bucket.snippets.length === 0) {
        this.buckets.delete(signature);
      }
    }
  }

  /**
   * Get statistics about the LSH structure
   */
  getStats(): { buckets: number; totalItems: number; averageBucketSize: number } {
    const totalItems = Array.from(this.buckets.values())
      .reduce((sum, bucket) => sum + bucket.snippets.length, 0);
    
    return {
      buckets: this.buckets.size,
      totalItems,
      averageBucketSize: this.buckets.size > 0 ? totalItems / this.buckets.size : 0
    };
  }
}