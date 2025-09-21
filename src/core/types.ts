// Core types for CodeCollage

export interface CodeSnippet {
  id: string;
  content: string;
  language: string;
  filepath: string;
  lineStart: number;
  lineEnd: number;
  hash: string;
  tokens: string[];
  normalized: string;
  timestamp: string;
}

export interface CodeCluster {
  id: string;
  snippets: string[]; // snippet IDs
  centroid: string; // representative snippet ID
  size: number;
  similarity: number;
  patterns: Pattern[];
  timestamp: string;
}

export interface Pattern {
  type: 'ngram' | 'lcs' | 'ast';
  content: string;
  frequency: number;
  snippets: string[]; // snippet IDs containing this pattern
  confidence: number;
}

export interface MinHashSignature {
  signature: number[];
  bands: number[][];
  snippetId: string;
}

export interface ClusteringConfig {
  minhashBands: number;
  minhashRows: number;
  similarityThreshold: number;
  minClusterSize: number;
}

export interface IngestOptions {
  recursive: boolean;
  extensions: string[];
  exclude?: string[];
}

export interface SynthOptions {
  type: 'ngrams' | 'lcs' | 'ast';
  minFrequency?: number;
  maxResults?: number;
}

export interface UIClusterView {
  cluster: CodeCluster;
  snippets: CodeSnippet[];
  patterns: Pattern[];
  preview: string;
}