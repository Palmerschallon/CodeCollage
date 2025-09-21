import { CodeSnippet, CodeCluster, Config } from './types.js';
import { MinHashLSH } from './minhash.js';

export class Clusterer {
  private config: Config;
  private lsh: MinHashLSH;

  constructor(config: Config) {
    this.config = config;
    this.lsh = new MinHashLSH(config);
  }

  /**
   * Cluster snippets using LSH and similarity threshold
   */
  clusterSnippets(snippets: CodeSnippet[]): CodeCluster[] {
    const clusters: CodeCluster[] = [];
    const clustered = new Set<string>();
    
    // Add all snippets to LSH
    for (const snippet of snippets) {
      this.lsh.addSnippet(snippet);
    }

    for (const snippet of snippets) {
      if (clustered.has(snippet.id)) continue;

      // Find similar snippets
      const candidates = this.lsh.findCandidates(snippet);
      const similarSnippets = [snippet.id];
      
      for (const candidateId of candidates) {
        if (clustered.has(candidateId)) continue;
        
        const candidate = snippets.find(s => s.id === candidateId);
        if (!candidate) continue;
        
        const similarity = this.lsh.calculateSimilarity(snippet.minHashes, candidate.minHashes);
        if (similarity >= this.config.clusterThreshold) {
          similarSnippets.push(candidateId);
        }
      }

      // Create cluster if we have similar snippets
      if (similarSnippets.length > 1) {
        const cluster = this.createCluster(similarSnippets, snippets);
        clusters.push(cluster);
        
        for (const snippetId of similarSnippets) {
          clustered.add(snippetId);
        }
      }
    }

    // Create singleton clusters for unclustered snippets
    for (const snippet of snippets) {
      if (!clustered.has(snippet.id)) {
        const cluster = this.createCluster([snippet.id], snippets);
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Create a cluster from snippet IDs
   */
  private createCluster(snippetIds: string[], allSnippets: CodeSnippet[]): CodeCluster {
    const clusterSnippets = snippetIds.map(id => 
      allSnippets.find(s => s.id === id)
    ).filter(s => s !== undefined) as CodeSnippet[];

    const languages = [...new Set(clusterSnippets.map(s => s.language))];
    const allPatterns = clusterSnippets.flatMap(s => s.patterns);
    const patterns = [...new Set(allPatterns)];
    
    // Compute centroid as average MinHash signature
    const centroid = this.computeCentroid(clusterSnippets);

    return {
      id: this.generateClusterId(),
      snippets: snippetIds,
      centroid,
      size: snippetIds.length,
      patterns,
      languages,
      timestamp: Date.now()
    };
  }

  /**
   * Compute centroid of cluster as average MinHash signature
   */
  private computeCentroid(snippets: CodeSnippet[]): number[] {
    if (snippets.length === 0) return [];
    
    const signatureLength = snippets[0].minHashes.length;
    const centroid: number[] = new Array(signatureLength).fill(0);
    
    for (const snippet of snippets) {
      for (let i = 0; i < signatureLength; i++) {
        centroid[i] += snippet.minHashes[i];
      }
    }
    
    for (let i = 0; i < signatureLength; i++) {
      centroid[i] /= snippets.length;
    }
    
    return centroid;
  }

  /**
   * Update clusters incrementally when new snippets are added
   */
  updateClusters(newSnippets: CodeSnippet[], existingClusters: CodeCluster[], allSnippets: CodeSnippet[]): CodeCluster[] {
    const updatedClusters = [...existingClusters];
    
    for (const newSnippet of newSnippets) {
      this.lsh.addSnippet(newSnippet);
      
      // Find best matching cluster
      let bestCluster: CodeCluster | null = null;
      let bestSimilarity = 0;
      
      for (const cluster of updatedClusters) {
        const similarity = this.calculateClusterSimilarity(newSnippet, cluster, allSnippets);
        if (similarity > bestSimilarity && similarity >= this.config.clusterThreshold) {
          bestSimilarity = similarity;
          bestCluster = cluster;
        }
      }
      
      if (bestCluster) {
        // Add to existing cluster
        bestCluster.snippets.push(newSnippet.id);
        bestCluster.size++;
        
        // Update cluster properties
        const clusterSnippets = bestCluster.snippets.map(id => 
          allSnippets.find(s => s.id === id)
        ).filter(s => s !== undefined) as CodeSnippet[];
        
        bestCluster.centroid = this.computeCentroid(clusterSnippets);
        bestCluster.languages = [...new Set(clusterSnippets.map(s => s.language))];
        bestCluster.patterns = [...new Set(clusterSnippets.flatMap(s => s.patterns))];
      } else {
        // Create new singleton cluster
        const newCluster = this.createCluster([newSnippet.id], allSnippets);
        updatedClusters.push(newCluster);
      }
    }
    
    return updatedClusters;
  }

  /**
   * Calculate similarity between a snippet and a cluster
   */
  private calculateClusterSimilarity(snippet: CodeSnippet, cluster: CodeCluster, allSnippets: CodeSnippet[]): number {
    // Use centroid distance as similarity measure
    const centroidDistance = this.calculateEuclideanDistance(
      snippet.minHashes.map(h => Number(h)),
      cluster.centroid
    );
    
    // Convert distance to similarity (inverse relationship)
    const maxDistance = Math.sqrt(snippet.minHashes.length);
    return Math.max(0, 1 - (centroidDistance / maxDistance));
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  private calculateEuclideanDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return Infinity;
    
    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      sum += Math.pow(vec1[i] - vec2[i], 2);
    }
    
    return Math.sqrt(sum);
  }

  /**
   * Generate unique cluster ID
   */
  private generateClusterId(): string {
    return `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get clustering statistics
   */
  getStats(clusters: CodeCluster[]): {
    totalClusters: number;
    singletonClusters: number;
    averageClusterSize: number;
    largestClusterSize: number;
  } {
    const singletonClusters = clusters.filter(c => c.size === 1).length;
    const totalSize = clusters.reduce((sum, c) => sum + c.size, 0);
    const largestClusterSize = Math.max(...clusters.map(c => c.size));
    
    return {
      totalClusters: clusters.length,
      singletonClusters,
      averageClusterSize: clusters.length > 0 ? totalSize / clusters.length : 0,
      largestClusterSize
    };
  }
}