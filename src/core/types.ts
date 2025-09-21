export interface CodeSnippet {
  id: string;
  content: string;
  language: string;
  filename: string;
  hash: string;
  minHashes: number[];
  tokens: string[];
  patterns: string[];
  clusterId?: string;
  timestamp: number;
}

export interface CodeCluster {
  id: string;
  snippets: string[]; // snippet IDs
  centroid: number[];
  size: number;
  patterns: string[];
  languages: string[];
  timestamp: number;
}

export interface Pattern {
  id: string;
  type: 'ngram' | 'lcs' | 'ast';
  content: string;
  frequency: number;
  snippets: string[];
  languages: string[];
}

export interface LSHBucket {
  signature: string;
  snippets: string[];
}

export interface Config {
  minHashBands: number;
  minHashRows: number;
  ngramSize: number;
  similarityThreshold: number;
  clusterThreshold: number;
}