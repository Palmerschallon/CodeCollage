import * as crypto from 'crypto';

/**
 * Simple tokenizer and normalizer for multi-language code
 */
export class CodeTokenizer {
  private static readonly KEYWORDS = new Set([
    // Common keywords across languages
    'function', 'class', 'interface', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
    'return', 'import', 'export', 'from', 'as', 'default', 'async', 'await', 'try', 'catch',
    'finally', 'throw', 'new', 'this', 'super', 'extends', 'implements', 'public', 'private',
    'protected', 'static', 'abstract', 'final', 'def', 'lambda', 'yield', 'with', 'as',
    'pass', 'break', 'continue', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False'
  ]);

  private static readonly OPERATORS = /[+\-*/%=<>!&|^~?:;,.\[\]{}()]/g;
  private static readonly WHITESPACE = /\s+/g;
  private static readonly STRINGS = /"[^"]*"|'[^']*'|`[^`]*`/g;
  private static readonly COMMENTS = /\/\/.*$|\/\*[\s\S]*?\*\/|#.*$/gm;
  private static readonly NUMBERS = /\b\d+\.?\d*\b/g;

  /**
   * Tokenize code into meaningful tokens
   */
  static tokenize(code: string, language: string): string[] {
    // Remove comments and strings for basic tokenization
    let normalized = code
      .replace(this.COMMENTS, ' ')
      .replace(this.STRINGS, 'STRING')
      .replace(this.NUMBERS, 'NUMBER');

    // Split on operators and whitespace
    const tokens = normalized
      .split(this.OPERATORS)
      .join(' ')
      .split(this.WHITESPACE)
      .filter(token => token.trim().length > 0)
      .map(token => token.toLowerCase());

    return tokens;
  }

  /**
   * Normalize code by removing formatting and standardizing structure
   */
  static normalize(code: string, language: string): string {
    // Basic normalization - remove comments, extra whitespace, standardize formatting
    let normalized = code
      .replace(this.COMMENTS, '')
      .replace(this.STRINGS, 'STR')
      .replace(this.NUMBERS, 'NUM')
      .replace(this.WHITESPACE, ' ')
      .trim();

    // Language-specific normalization
    switch (language) {
      case 'javascript':
      case 'typescript':
        normalized = this.normalizeJavaScript(normalized);
        break;
      case 'python':
        normalized = this.normalizePython(normalized);
        break;
      default:
        // Generic normalization
        break;
    }

    return normalized;
  }

  /**
   * Generate content hash for deduplication
   */
  static hash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  /**
   * Extract n-grams from tokenized code
   */
  static extractNGrams(tokens: string[], n: number = 3): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
  }

  /**
   * Simple JavaScript/TypeScript normalization
   */
  private static normalizeJavaScript(code: string): string {
    return code
      .replace(/\bconst\b|\blet\b|\bvar\b/g, 'VAR')
      .replace(/\bfunction\b/g, 'FUNC')
      .replace(/\bclass\b/g, 'CLASS')
      .replace(/\basync\b/g, 'ASYNC')
      .replace(/\bawait\b/g, 'AWAIT');
  }

  /**
   * Simple Python normalization
   */
  private static normalizePython(code: string): string {
    return code
      .replace(/\bdef\b/g, 'FUNC')
      .replace(/\bclass\b/g, 'CLASS')
      .replace(/\basync\b/g, 'ASYNC')
      .replace(/\bawait\b/g, 'AWAIT')
      .replace(/\blambda\b/g, 'LAMBDA');
  }

  /**
   * Detect programming language from file extension
   */
  static detectLanguage(filepath: string): string {
    const ext = filepath.toLowerCase().split('.').pop() || '';
    const langMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'php': 'php',
      'cs': 'csharp',
      'swift': 'swift',
      'kt': 'kotlin'
    };
    return langMap[ext] || 'unknown';
  }
}