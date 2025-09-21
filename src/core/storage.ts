import { promises as fs } from 'fs';
import { dirname } from 'path';
import { CodeSnippet, CodeCluster, Pattern } from './types.js';

export class JSONLStorage {
  private dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
  }

  /**
   * Initialize data directory structure
   */
  async initialize(): Promise<void> {
    await this.ensureDir(this.dataDir);
    await this.ensureDir(`${this.dataDir}/snippets`);
    await this.ensureDir(`${this.dataDir}/clusters`);
    await this.ensureDir(`${this.dataDir}/patterns`);
    await this.ensureDir(`${this.dataDir}/metadata`);
  }

  /**
   * Append code snippet to JSONL file
   */
  async saveSnippet(snippet: CodeSnippet): Promise<void> {
    const filepath = `${this.dataDir}/snippets/snippets.jsonl`;
    const line = JSON.stringify(snippet) + '\n';
    await this.appendToFile(filepath, line);
  }

  /**
   * Append multiple snippets to JSONL file
   */
  async saveSnippets(snippets: CodeSnippet[]): Promise<void> {
    const filepath = `${this.dataDir}/snippets/snippets.jsonl`;
    const lines = snippets.map(snippet => JSON.stringify(snippet) + '\n').join('');
    await this.appendToFile(filepath, lines);
  }

  /**
   * Load all snippets from JSONL file
   */
  async loadSnippets(): Promise<CodeSnippet[]> {
    const filepath = `${this.dataDir}/snippets/snippets.jsonl`;
    return await this.loadJSONL<CodeSnippet>(filepath);
  }

  /**
   * Save cluster to JSONL file
   */
  async saveCluster(cluster: CodeCluster): Promise<void> {
    const filepath = `${this.dataDir}/clusters/clusters.jsonl`;
    const line = JSON.stringify(cluster) + '\n';
    await this.appendToFile(filepath, line);
  }

  /**
   * Save multiple clusters to JSONL file
   */
  async saveClusters(clusters: CodeCluster[]): Promise<void> {
    const filepath = `${this.dataDir}/clusters/clusters.jsonl`;
    const lines = clusters.map(cluster => JSON.stringify(cluster) + '\n').join('');
    await this.appendToFile(filepath, lines);
  }

  /**
   * Load all clusters from JSONL file
   */
  async loadClusters(): Promise<CodeCluster[]> {
    const filepath = `${this.dataDir}/clusters/clusters.jsonl`;
    return await this.loadJSONL<CodeCluster>(filepath);
  }

  /**
   * Save pattern to JSONL file
   */
  async savePattern(pattern: Pattern): Promise<void> {
    const filepath = `${this.dataDir}/patterns/patterns.jsonl`;
    const line = JSON.stringify(pattern) + '\n';
    await this.appendToFile(filepath, line);
  }

  /**
   * Save multiple patterns to JSONL file
   */
  async savePatterns(patterns: Pattern[]): Promise<void> {
    const filepath = `${this.dataDir}/patterns/patterns.jsonl`;
    const lines = patterns.map(pattern => JSON.stringify(pattern) + '\n').join('');
    await this.appendToFile(filepath, lines);
  }

  /**
   * Load all patterns from JSONL file
   */
  async loadPatterns(): Promise<Pattern[]> {
    const filepath = `${this.dataDir}/patterns/patterns.jsonl`;
    return await this.loadJSONL<Pattern>(filepath);
  }

  /**
   * Save metadata (config, stats, etc.)
   */
  async saveMetadata(key: string, data: any): Promise<void> {
    const filepath = `${this.dataDir}/metadata/${key}.json`;
    await this.ensureDir(dirname(filepath));
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  /**
   * Load metadata
   */
  async loadMetadata(key: string): Promise<any> {
    const filepath = `${this.dataDir}/metadata/${key}.json`;
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get snippet by ID
   */
  async getSnippet(id: string): Promise<CodeSnippet | null> {
    const snippets = await this.loadSnippets();
    return snippets.find(s => s.id === id) || null;
  }

  /**
   * Get cluster by ID
   */
  async getCluster(id: string): Promise<CodeCluster | null> {
    const clusters = await this.loadClusters();
    return clusters.find(c => c.id === id) || null;
  }

  /**
   * Get snippets by cluster ID
   */
  async getSnippetsByCluster(clusterId: string): Promise<CodeSnippet[]> {
    const cluster = await this.getCluster(clusterId);
    if (!cluster) return [];
    
    const snippets = await this.loadSnippets();
    return snippets.filter(s => cluster.snippets.includes(s.id));
  }

  /**
   * Search snippets by language
   */
  async searchByLanguage(language: string): Promise<CodeSnippet[]> {
    const snippets = await this.loadSnippets();
    return snippets.filter(s => s.language === language);
  }

  /**
   * Search patterns by type
   */
  async searchPatternsByType(type: 'ngram' | 'lcs' | 'ast'): Promise<Pattern[]> {
    const patterns = await this.loadPatterns();
    return patterns.filter(p => p.type === type);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    totalSnippets: number;
    totalClusters: number;
    totalPatterns: number;
    languages: string[];
  }> {
    const snippets = await this.loadSnippets();
    const clusters = await this.loadClusters();
    const patterns = await this.loadPatterns();
    
    const languages = [...new Set(snippets.map(s => s.language))];
    
    return {
      totalSnippets: snippets.length,
      totalClusters: clusters.length,
      totalPatterns: patterns.length,
      languages
    };
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll(): Promise<void> {
    const files = [
      `${this.dataDir}/snippets/snippets.jsonl`,
      `${this.dataDir}/clusters/clusters.jsonl`,
      `${this.dataDir}/patterns/patterns.jsonl`
    ];
    
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (error) {
        // File doesn't exist, ignore
      }
    }
  }

  /**
   * Generic JSONL loader
   */
  private async loadJSONL<T>(filepath: string): Promise<T[]> {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      // File doesn't exist yet, return empty array
      return [];
    }
  }

  /**
   * Append content to file
   */
  private async appendToFile(filepath: string, content: string): Promise<void> {
    await this.ensureDir(dirname(filepath));
    await fs.appendFile(filepath, content);
  }

  /**
   * Ensure directory exists
   */
  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory already exists, ignore
    }
  }
}