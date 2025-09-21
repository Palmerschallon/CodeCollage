import { CodeSnippet, CodeCluster, MinHashSignature, ClusteringConfig } from '../core/types.js';
import { CodeTokenizer } from '../core/tokenizer.js';

/**
 * MinHash/LSH implementation for code deduplication and clustering
 */
export class MinHashClusterer {
  private config: ClusteringConfig;
  private hashFunctions: Array<(x: string) => number>;

  constructor(config: ClusteringConfig) {
    this.config = config;
    this.hashFunctions = this.generateHashFunctions(config.minhashBands * config.minhashRows);
  }

  /**
   * Generate hash functions for MinHash
   */
  private generateHashFunctions(count: number): Array<(x: string) => number> {
    const functions: Array<(x: string) => number> = [];
    
    for (let i = 0; i < count; i++) {
      const a = Math.floor(Math.random() * 1000000) + 1;
      const b = Math.floor(Math.random() * 1000000);
      const p = 2147483647; // Large prime
      
      functions.push((x: string) => {
        let hash = 0;
        for (let j = 0; j < x.length; j++) {
          hash = ((hash * 31) + x.charCodeAt(j)) % p;
        }
        return ((a * hash + b) % p);
      });
    }
    
    return functions;
  }

  /**
   * Generate MinHash signature for a code snippet
   */
  generateSignature(snippet: CodeSnippet): MinHashSignature {
    const tokens = CodeTokenizer.tokenize(snippet.content, snippet.language);
    const shingles = this.generateShingles(tokens, 3);
    
    const signature: number[] = new Array(this.hashFunctions.length).fill(Infinity);
    
    for (const shingle of shingles) {
      for (let i = 0; i < this.hashFunctions.length; i++) {
        const hash = this.hashFunctions[i](shingle);
        signature[i] = Math.min(signature[i], hash);
      }
    }
    
    // Organize into bands
    const bands: number[][] = [];
    const rowsPerBand = this.config.minhashRows;
    
    for (let i = 0; i < this.config.minhashBands; i++) {
      const start = i * rowsPerBand;
      const end = start + rowsPerBand;
      bands.push(signature.slice(start, end));
    }
    
    return {
      signature,
      bands,
      snippetId: snippet.id
    };
  }

  /**
   * Generate shingles (n-grams) from tokens
   */
  private generateShingles(tokens: string[], size: number): string[] {
    const shingles: string[] = [];
    for (let i = 0; i <= tokens.length - size; i++) {
      shingles.push(tokens.slice(i, i + size).join(' '));
    }
    return shingles;
  }

  /**
   * Calculate Jaccard similarity between two signatures
   */
  calculateSimilarity(sig1: MinHashSignature, sig2: MinHashSignature): number {
    let matches = 0;
    for (let i = 0; i < sig1.signature.length; i++) {
      if (sig1.signature[i] === sig2.signature[i]) {
        matches++;
      }
    }
    return matches / sig1.signature.length;
  }

  /**
   * Find candidate pairs using LSH bands
   */
  findCandidatePairs(signatures: MinHashSignature[]): Set<string> {
    const bandBuckets = new Map<string, string[]>();
    const candidates = new Set<string>();
    
    // Hash each band and group signatures
    for (const sig of signatures) {
      for (let bandIdx = 0; bandIdx < sig.bands.length; bandIdx++) {
        const bandHash = this.hashBand(sig.bands[bandIdx]);
        const bucketKey = `${bandIdx}-${bandHash}`;
        
        if (!bandBuckets.has(bucketKey)) {
          bandBuckets.set(bucketKey, []);
        }
        bandBuckets.get(bucketKey)!.push(sig.snippetId);
      }
    }
    
    // Generate candidate pairs from buckets with multiple signatures
    for (const bucket of bandBuckets.values()) {
      if (bucket.length > 1) {
        for (let i = 0; i < bucket.length; i++) {
          for (let j = i + 1; j < bucket.length; j++) {
            const pair = [bucket[i], bucket[j]].sort().join(',');
            candidates.add(pair);
          }
        }
      }
    }
    
    return candidates;
  }

  /**
   * Hash a band for LSH bucketing
   */
  private hashBand(band: number[]): string {
    return band.join(',');
  }

  /**
   * Cluster snippets using MinHash/LSH
   */
  async clusterSnippets(snippets: CodeSnippet[]): Promise<CodeCluster[]> {
    // Generate signatures
    const signatures = snippets.map(snippet => this.generateSignature(snippet));
    const sigMap = new Map(signatures.map(sig => [sig.snippetId, sig]));
    
    // Find candidate pairs
    const candidatePairs = this.findCandidatePairs(signatures);
    
    // Calculate similarities and build similarity graph
    const similarityGraph = new Map<string, Set<string>>();
    
    for (const snippetId of snippets.map(s => s.id)) {
      similarityGraph.set(snippetId, new Set());
    }
    
    for (const pairStr of candidatePairs) {
      const [id1, id2] = pairStr.split(',');
      const sig1 = sigMap.get(id1)!;
      const sig2 = sigMap.get(id2)!;
      
      const similarity = this.calculateSimilarity(sig1, sig2);
      
      if (similarity >= this.config.similarityThreshold) {
        similarityGraph.get(id1)!.add(id2);
        similarityGraph.get(id2)!.add(id1);
      }
    }
    
    // Find connected components (clusters)
    const visited = new Set<string>();
    const clusters: CodeCluster[] = [];
    
    for (const snippetId of snippets.map(s => s.id)) {
      if (!visited.has(snippetId)) {
        const cluster = this.findConnectedComponent(snippetId, similarityGraph, visited);
        
        if (cluster.length >= this.config.minClusterSize) {
          const centroid = this.findCentroid(cluster, signatures);
          
          clusters.push({
            id: `cluster-${clusters.length}`,
            snippets: cluster,
            centroid,
            size: cluster.length,
            similarity: this.calculateClusterSimilarity(cluster, sigMap),
            patterns: [], // Will be filled by pattern extraction
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return clusters;
  }

  /**
   * Find connected component in similarity graph
   */
  private findConnectedComponent(
    startId: string,
    graph: Map<string, Set<string>>,
    visited: Set<string>
  ): string[] {
    const component: string[] = [];
    const stack = [startId];
    
    while (stack.length > 0) {
      const id = stack.pop()!;
      
      if (!visited.has(id)) {
        visited.add(id);
        component.push(id);
        
        for (const neighbor of graph.get(id) || []) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
          }
        }
      }
    }
    
    return component;
  }

  /**
   * Find centroid (most representative snippet) of a cluster
   */
  private findCentroid(cluster: string[], signatures: MinHashSignature[]): string {
    const sigMap = new Map(signatures.map(sig => [sig.snippetId, sig]));
    let bestCentroid = cluster[0];
    let maxAvgSimilarity = 0;
    
    for (const candidateId of cluster) {
      const candidateSig = sigMap.get(candidateId)!;
      let totalSimilarity = 0;
      
      for (const otherId of cluster) {
        if (candidateId !== otherId) {
          const otherSig = sigMap.get(otherId)!;
          totalSimilarity += this.calculateSimilarity(candidateSig, otherSig);
        }
      }
      
      const avgSimilarity = totalSimilarity / (cluster.length - 1);
      if (avgSimilarity > maxAvgSimilarity) {
        maxAvgSimilarity = avgSimilarity;
        bestCentroid = candidateId;
      }
    }
    
    return bestCentroid;
  }

  /**
   * Calculate average similarity within a cluster
   */
  private calculateClusterSimilarity(cluster: string[], sigMap: Map<string, MinHashSignature>): number {
    if (cluster.length < 2) return 1.0;
    
    let totalSimilarity = 0;
    let pairCount = 0;
    
    for (let i = 0; i < cluster.length; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        const sig1 = sigMap.get(cluster[i])!;
        const sig2 = sigMap.get(cluster[j])!;
        totalSimilarity += this.calculateSimilarity(sig1, sig2);
        pairCount++;
      }
    }
    
    return totalSimilarity / pairCount;
  }
}