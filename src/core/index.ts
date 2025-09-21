import { promises as fs } from 'fs';
import { join, extname } from 'path';
import crypto from 'crypto';

import { CodeSnippet, CodeCluster, Pattern, Config } from './types.js';
import { DEFAULT_CONFIG } from './config.js';
import { Tokenizer } from './tokenizer.js';
import { MinHashLSH } from './minhash.js';
import { Clusterer } from './clusterer.js';
import { PatternExtractor } from './patterns.js';
import { JSONLStorage } from './storage.js';

export class CodeCollage {
  private config: Config;
  private tokenizer: Tokenizer;
  private clusterer: Clusterer;
  private patternExtractor: PatternExtractor;
  private storage: JSONLStorage;

  constructor(config: Partial<Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tokenizer = new Tokenizer();
    this.clusterer = new Clusterer(this.config);
    this.patternExtractor = new PatternExtractor(this.config);
    this.storage = new JSONLStorage();
  }

  /**
   * Initialize CodeCollage system
   */
  async initialize(): Promise<void> {
    await this.storage.initialize();
    await this.storage.saveMetadata('config', this.config);
  }

  /**
   * Ingest code from files or directories
   */
  async ingest(paths: string[]): Promise<{
    processed: number;
    skipped: number;
    snippets: CodeSnippet[];
  }> {
    const snippets: CodeSnippet[] = [];
    let processed = 0;
    let skipped = 0;

    for (const path of paths) {
      const stats = await fs.stat(path);
      
      if (stats.isDirectory()) {
        const dirResults = await this.ingestDirectory(path);
        snippets.push(...dirResults.snippets);
        processed += dirResults.processed;
        skipped += dirResults.skipped;
      } else if (stats.isFile()) {
        const snippet = await this.ingestFile(path);
        if (snippet) {
          snippets.push(snippet);
          processed++;
        } else {
          skipped++;
        }
      }
    }

    // Save snippets to storage
    if (snippets.length > 0) {
      await this.storage.saveSnippets(snippets);
    }

    return { processed, skipped, snippets };
  }

  /**
   * Index existing snippets (dedupe and cluster)
   */
  async index(): Promise<{
    totalSnippets: number;
    duplicatesRemoved: number;
    clusters: CodeCluster[];
  }> {
    console.log('Loading snippets...');
    const allSnippets = await this.storage.loadSnippets();
    
    console.log('Deduplicating...');
    const { uniqueSnippets, duplicatesRemoved } = await this.deduplicate(allSnippets);
    
    console.log('Clustering...');
    const clusters = this.clusterer.clusterSnippets(uniqueSnippets);
    
    // Update snippet cluster assignments
    for (const cluster of clusters) {
      for (const snippetId of cluster.snippets) {
        const snippet = uniqueSnippets.find(s => s.id === snippetId);
        if (snippet) {
          snippet.clusterId = cluster.id;
        }
      }
    }

    // Save updated data
    await this.storage.saveClusters(clusters);
    if (duplicatesRemoved > 0) {
      // Clear and re-save deduplicated snippets
      await this.storage.clearAll();
      await this.storage.saveSnippets(uniqueSnippets);
      await this.storage.saveClusters(clusters);
    }

    await this.storage.saveMetadata('indexStats', {
      totalSnippets: allSnippets.length,
      uniqueSnippets: uniqueSnippets.length,
      duplicatesRemoved,
      totalClusters: clusters.length,
      timestamp: Date.now()
    });

    return {
      totalSnippets: allSnippets.length,
      duplicatesRemoved,
      clusters
    };
  }

  /**
   * Synthesize patterns from indexed data
   */
  async synthesize(): Promise<{
    patterns: Pattern[];
    stats: any;
  }> {
    console.log('Loading snippets...');
    const snippets = await this.storage.loadSnippets();
    
    console.log('Extracting patterns...');
    const patterns = this.patternExtractor.extractPatterns(snippets);
    
    // Save patterns
    await this.storage.savePatterns(patterns);
    
    const stats = {
      totalPatterns: patterns.length,
      ngramPatterns: patterns.filter(p => p.type === 'ngram').length,
      lcsPatterns: patterns.filter(p => p.type === 'lcs').length,
      astPatterns: patterns.filter(p => p.type === 'ast').length,
      timestamp: Date.now()
    };
    
    await this.storage.saveMetadata('synthesisStats', stats);
    
    return { patterns, stats };
  }

  /**
   * Get all data for serving
   */
  async getData(): Promise<{
    snippets: CodeSnippet[];
    clusters: CodeCluster[];
    patterns: Pattern[];
    stats: any;
  }> {
    const [snippets, clusters, patterns, stats] = await Promise.all([
      this.storage.loadSnippets(),
      this.storage.loadClusters(),
      this.storage.loadPatterns(),
      this.storage.getStats()
    ]);

    return { snippets, clusters, patterns, stats };
  }

  /**
   * Ingest directory recursively
   */
  private async ingestDirectory(dirPath: string): Promise<{
    processed: number;
    skipped: number;
    snippets: CodeSnippet[];
  }> {
    const snippets: CodeSnippet[] = [];
    let processed = 0;
    let skipped = 0;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const dirResults = await this.ingestDirectory(fullPath);
        snippets.push(...dirResults.snippets);
        processed += dirResults.processed;
        skipped += dirResults.skipped;
      } else if (entry.isFile()) {
        const snippet = await this.ingestFile(fullPath);
        if (snippet) {
          snippets.push(snippet);
          processed++;
        } else {
          skipped++;
        }
      }
    }

    return { processed, skipped, snippets };
  }

  /**
   * Ingest single file
   */
  private async ingestFile(filepath: string): Promise<CodeSnippet | null> {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const language = this.tokenizer.detectLanguage(filepath, content);
      
      // Skip if language not supported or file too large
      if (language === 'text' || content.length > 100000) {
        return null;
      }

      const tokens = this.tokenizer.tokenize(content, language);
      const hash = this.generateHash(content);
      const minHashes = new MinHashLSH(this.config).computeMinHash(tokens);
      
      const snippet: CodeSnippet = {
        id: this.generateSnippetId(),
        content,
        language,
        filename: filepath,
        hash,
        minHashes,
        tokens,
        patterns: [], // Will be filled during synthesis
        timestamp: Date.now()
      };

      return snippet;
    } catch (error) {
      console.warn(`Failed to ingest file ${filepath}:`, error);
      return null;
    }
  }

  /**
   * Deduplicate snippets using MinHash LSH
   */
  private async deduplicate(snippets: CodeSnippet[]): Promise<{
    uniqueSnippets: CodeSnippet[];
    duplicatesRemoved: number;
  }> {
    const lsh = new MinHashLSH(this.config);
    const unique = new Map<string, CodeSnippet>();
    const processed = new Set<string>();

    for (const snippet of snippets) {
      if (processed.has(snippet.id)) continue;

      // Check for exact hash duplicates first
      const existingByHash = Array.from(unique.values()).find(s => s.hash === snippet.hash);
      if (existingByHash) {
        processed.add(snippet.id);
        continue;
      }

      // Check for LSH similarity
      lsh.addSnippet(snippet);
      const candidates = lsh.findCandidates(snippet);
      
      let isDuplicate = false;
      for (const candidateId of candidates) {
        const candidate = unique.get(candidateId);
        if (candidate) {
          const similarity = lsh.calculateSimilarity(snippet.minHashes, candidate.minHashes);
          if (similarity >= this.config.similarityThreshold) {
            isDuplicate = true;
            break;
          }
        }
      }

      if (!isDuplicate) {
        unique.set(snippet.id, snippet);
      }
      processed.add(snippet.id);
    }

    const uniqueSnippets = Array.from(unique.values());
    const duplicatesRemoved = snippets.length - uniqueSnippets.length;

    return { uniqueSnippets, duplicatesRemoved };
  }

  /**
   * Generate content hash
   */
  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate unique snippet ID
   */
  private generateSnippetId(): string {
    return `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}