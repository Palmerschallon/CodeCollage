import * as fs from 'fs/promises';
import * as path from 'path';
import { CodeSnippet } from '../core/types.js';

/**
 * Simple append-only JSONL storage for CodeCollage data
 */
export class JSONLStorage {
  private dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
  }

  async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async appendSnippet(snippet: CodeSnippet): Promise<void> {
    await this.ensureDataDir();
    const filepath = path.join(this.dataDir, 'snippets.jsonl');
    const line = JSON.stringify(snippet) + '\n';
    await fs.appendFile(filepath, line);
  }

  async appendCluster(cluster: any): Promise<void> {
    await this.ensureDataDir();
    const filepath = path.join(this.dataDir, 'clusters.jsonl');
    const line = JSON.stringify(cluster) + '\n';
    await fs.appendFile(filepath, line);
  }

  async appendPattern(pattern: any): Promise<void> {
    await this.ensureDataDir();
    const filepath = path.join(this.dataDir, 'patterns.jsonl');
    const line = JSON.stringify(pattern) + '\n';
    await fs.appendFile(filepath, line);
  }

  async readSnippets(): Promise<CodeSnippet[]> {
    try {
      const filepath = path.join(this.dataDir, 'snippets.jsonl');
      const content = await fs.readFile(filepath, 'utf-8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }

  async readClusters(): Promise<any[]> {
    try {
      const filepath = path.join(this.dataDir, 'clusters.jsonl');
      const content = await fs.readFile(filepath, 'utf-8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }

  async readPatterns(): Promise<any[]> {
    try {
      const filepath = path.join(this.dataDir, 'patterns.jsonl');
      const content = await fs.readFile(filepath, 'utf-8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }

  async getLatestSnippets(limit: number = 100): Promise<CodeSnippet[]> {
    const snippets = await this.readSnippets();
    return snippets.slice(-limit).reverse();
  }

  async getSnippetById(id: string): Promise<CodeSnippet | null> {
    const snippets = await this.readSnippets();
    return snippets.find(s => s.id === id) || null;
  }
}