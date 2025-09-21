import { CodeSnippet, Pattern, Config } from './types.js';

export class PatternExtractor {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Extract all types of patterns from code snippets
   */
  extractPatterns(snippets: CodeSnippet[]): Pattern[] {
    const patterns: Pattern[] = [];
    
    // Extract n-grams
    patterns.push(...this.extractNGramPatterns(snippets));
    
    // Extract longest common subsequences
    patterns.push(...this.extractLCSPatterns(snippets));
    
    // Extract simple AST-like patterns
    patterns.push(...this.extractASTPatterns(snippets));
    
    return this.rankPatterns(patterns);
  }

  /**
   * Extract n-gram patterns from token sequences
   */
  private extractNGramPatterns(snippets: CodeSnippet[]): Pattern[] {
    const ngramCounts = new Map<string, { count: number; snippets: Set<string>; languages: Set<string> }>();
    
    for (const snippet of snippets) {
      const ngrams = this.generateNGrams(snippet.tokens, this.config.ngramSize);
      
      for (const ngram of ngrams) {
        const key = ngram.join(' ');
        if (!ngramCounts.has(key)) {
          ngramCounts.set(key, {
            count: 0,
            snippets: new Set(),
            languages: new Set()
          });
        }
        
        const entry = ngramCounts.get(key)!;
        entry.count++;
        entry.snippets.add(snippet.id);
        entry.languages.add(snippet.language);
      }
    }
    
    const patterns: Pattern[] = [];
    for (const [content, data] of ngramCounts.entries()) {
      if (data.count >= 2) { // Only patterns that appear multiple times
        patterns.push({
          id: this.generatePatternId('ngram'),
          type: 'ngram',
          content,
          frequency: data.count,
          snippets: Array.from(data.snippets),
          languages: Array.from(data.languages)
        });
      }
    }
    
    return patterns;
  }

  /**
   * Extract longest common subsequence patterns
   */
  private extractLCSPatterns(snippets: CodeSnippet[]): Pattern[] {
    const patterns: Pattern[] = [];
    const processed = new Set<string>();
    
    for (let i = 0; i < snippets.length; i++) {
      for (let j = i + 1; j < snippets.length; j++) {
        const snippet1 = snippets[i];
        const snippet2 = snippets[j];
        
        const pairKey = `${snippet1.id}-${snippet2.id}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);
        
        const lcs = this.findLCS(snippet1.tokens, snippet2.tokens);
        if (lcs.length >= 3) { // Minimum meaningful LCS length
          patterns.push({
            id: this.generatePatternId('lcs'),
            type: 'lcs',
            content: lcs.join(' '),
            frequency: 2,
            snippets: [snippet1.id, snippet2.id],
            languages: [snippet1.language, snippet2.language]
          });
        }
      }
    }
    
    return patterns;
  }

  /**
   * Extract simple AST-like structural patterns
   */
  private extractASTPatterns(snippets: CodeSnippet[]): Pattern[] {
    const patterns: Pattern[] = [];
    const structureCounts = new Map<string, { count: number; snippets: Set<string>; languages: Set<string> }>();
    
    for (const snippet of snippets) {
      const structures = this.extractStructuralPatterns(snippet.content, snippet.language);
      
      for (const structure of structures) {
        if (!structureCounts.has(structure)) {
          structureCounts.set(structure, {
            count: 0,
            snippets: new Set(),
            languages: new Set()
          });
        }
        
        const entry = structureCounts.get(structure)!;
        entry.count++;
        entry.snippets.add(snippet.id);
        entry.languages.add(snippet.language);
      }
    }
    
    for (const [content, data] of structureCounts.entries()) {
      if (data.count >= 2) {
        patterns.push({
          id: this.generatePatternId('ast'),
          type: 'ast',
          content,
          frequency: data.count,
          snippets: Array.from(data.snippets),
          languages: Array.from(data.languages)
        });
      }
    }
    
    return patterns;
  }

  /**
   * Generate n-grams from token sequence
   */
  private generateNGrams(tokens: string[], n: number): string[][] {
    const ngrams: string[][] = [];
    
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n));
    }
    
    return ngrams;
  }

  /**
   * Find longest common subsequence between two token arrays
   */
  private findLCS(tokens1: string[], tokens2: string[]): string[] {
    const m = tokens1.length;
    const n = tokens2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Build LCS table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (tokens1[i - 1] === tokens2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    // Backtrack to find LCS
    const lcs: string[] = [];
    let i = m, j = n;
    
    while (i > 0 && j > 0) {
      if (tokens1[i - 1] === tokens2[j - 1]) {
        lcs.unshift(tokens1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    
    return lcs;
  }

  /**
   * Extract structural patterns from code content
   */
  private extractStructuralPatterns(content: string, language: string): string[] {
    const patterns: string[] = [];
    
    // Extract function/method signatures
    const functionPatterns = this.extractFunctionPatterns(content, language);
    patterns.push(...functionPatterns);
    
    // Extract control flow patterns
    const controlFlowPatterns = this.extractControlFlowPatterns(content, language);
    patterns.push(...controlFlowPatterns);
    
    // Extract class/object patterns
    const classPatterns = this.extractClassPatterns(content, language);
    patterns.push(...classPatterns);
    
    return patterns;
  }

  /**
   * Extract function signature patterns
   */
  private extractFunctionPatterns(content: string, language: string): string[] {
    const patterns: string[] = [];
    
    if (['javascript', 'typescript'].includes(language)) {
      const functionRegex = /function\s+\w+\s*\([^)]*\)|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g;
      const matches = content.match(functionRegex);
      if (matches) {
        patterns.push(...matches.map(m => m.replace(/\w+/g, 'ID')));
      }
    }
    
    if (language === 'python') {
      const functionRegex = /def\s+\w+\s*\([^)]*\):/g;
      const matches = content.match(functionRegex);
      if (matches) {
        patterns.push(...matches.map(m => m.replace(/\w+/g, 'ID')));
      }
    }
    
    return patterns;
  }

  /**
   * Extract control flow patterns
   */
  private extractControlFlowPatterns(content: string, language: string): string[] {
    const patterns: string[] = [];
    
    // Common control flow structures
    const controlFlowRegex = /\b(if|else|while|for|switch|try|catch|finally)\b\s*\([^)]*\)/g;
    const matches = content.match(controlFlowRegex);
    
    if (matches) {
      patterns.push(...matches.map(m => m.replace(/\([^)]*\)/, '(CONDITION)')));
    }
    
    return patterns;
  }

  /**
   * Extract class/object patterns
   */
  private extractClassPatterns(content: string, language: string): string[] {
    const patterns: string[] = [];
    
    if (['javascript', 'typescript', 'java', 'csharp'].includes(language)) {
      const classRegex = /class\s+\w+(\s+extends\s+\w+)?/g;
      const matches = content.match(classRegex);
      if (matches) {
        patterns.push(...matches.map(m => m.replace(/\w+/g, 'ID')));
      }
    }
    
    return patterns;
  }

  /**
   * Rank patterns by frequency and cross-language usage
   */
  private rankPatterns(patterns: Pattern[]): Pattern[] {
    return patterns.sort((a, b) => {
      // First by frequency
      if (a.frequency !== b.frequency) {
        return b.frequency - a.frequency;
      }
      
      // Then by cross-language usage
      const aLanguages = a.languages.length;
      const bLanguages = b.languages.length;
      if (aLanguages !== bLanguages) {
        return bLanguages - aLanguages;
      }
      
      // Finally by number of snippets
      return b.snippets.length - a.snippets.length;
    });
  }

  /**
   * Generate unique pattern ID
   */
  private generatePatternId(type: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}