import { SUPPORTED_LANGUAGES } from './config.js';

export class Tokenizer {
  /**
   * Normalize and tokenize code based on language
   */
  tokenize(content: string, language: string): string[] {
    const normalizedContent = this.normalize(content, language);
    return this.extractTokens(normalizedContent, language);
  }

  /**
   * Normalize code by removing comments, extra whitespace, etc.
   */
  private normalize(content: string, language: string): string {
    let normalized = content;

    // Remove single-line comments
    if (['javascript', 'typescript', 'java', 'cpp', 'c', 'rust', 'go', 'swift', 'kotlin', 'scala', 'csharp'].includes(language)) {
      normalized = normalized.replace(/\/\/.*$/gm, '');
    }
    if (['python', 'ruby'].includes(language)) {
      normalized = normalized.replace(/#.*$/gm, '');
    }
    if (['sql'].includes(language)) {
      normalized = normalized.replace(/--.*$/gm, '');
    }

    // Remove multi-line comments
    if (['javascript', 'typescript', 'java', 'cpp', 'c', 'rust', 'go', 'swift', 'kotlin', 'scala', 'csharp', 'css'].includes(language)) {
      normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    if (['html'].includes(language)) {
      normalized = normalized.replace(/<!--[\s\S]*?-->/g, '');
    }

    // Normalize whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // Remove string literals for pattern matching
    normalized = this.removeStringLiterals(normalized, language);

    return normalized;
  }

  /**
   * Remove string literals to focus on code structure
   */
  private removeStringLiterals(content: string, language: string): string {
    if (['javascript', 'typescript', 'java', 'cpp', 'c', 'rust', 'go', 'swift', 'kotlin', 'scala', 'csharp'].includes(language)) {
      // Remove double-quoted strings
      content = content.replace(/"(?:[^"\\]|\\.)*"/g, '""');
      // Remove single-quoted strings
      content = content.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    }
    if (['python', 'ruby'].includes(language)) {
      content = content.replace(/"(?:[^"\\]|\\.)*"/g, '""');
      content = content.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    }

    return content;
  }

  /**
   * Extract meaningful tokens from normalized code
   */
  private extractTokens(content: string, language: string): string[] {
    const tokens: string[] = [];
    
    // Language-specific keywords and operators
    const patterns = this.getLanguagePatterns(language);
    
    // Split by common delimiters
    const rawTokens = content.split(/[^\w\$\._]+/).filter(token => token.length > 0);
    
    for (const token of rawTokens) {
      // Skip very short tokens
      if (token.length < 2) continue;
      
      // Skip pure numbers
      if (/^\d+$/.test(token)) continue;
      
      tokens.push(token.toLowerCase());
    }

    return tokens;
  }

  /**
   * Get language-specific patterns for better tokenization
   */
  private getLanguagePatterns(language: string): RegExp[] {
    const commonPatterns = [
      /\b(if|else|while|for|function|class|return|import|export)\b/g,
      /[{}()\[\];,]/g,
      /[+\-*\/=<>!&|]/g
    ];

    switch (language) {
      case 'javascript':
      case 'typescript':
        return [
          ...commonPatterns,
          /\b(const|let|var|async|await|Promise)\b/g
        ];
      case 'python':
        return [
          ...commonPatterns,
          /\b(def|class|import|from|try|except|with|lambda)\b/g
        ];
      case 'java':
        return [
          ...commonPatterns,
          /\b(public|private|protected|static|final|abstract)\b/g
        ];
      default:
        return commonPatterns;
    }
  }

  /**
   * Detect language from filename or content
   */
  detectLanguage(filename: string, content?: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    const extensions: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'cc': 'cpp',
      'c': 'c',
      'rs': 'rust',
      'go': 'go',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'cs': 'csharp',
      'html': 'html',
      'css': 'css',
      'sql': 'sql'
    };

    return extensions[ext || ''] || 'text';
  }
}