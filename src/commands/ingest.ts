import * as fs from 'fs/promises';
import * as path from 'path';
import { CodeSnippet, IngestOptions } from '../core/types.js';
import { CodeTokenizer } from '../core/tokenizer.js';
import { JSONLStorage } from '../storage/jsonl.js';

export async function ingestCommand(
  inputPath: string,
  options: { recursive?: boolean; extensions?: string }
): Promise<void> {
  console.log(`🔍 Ingesting code from: ${inputPath}`);
  
  const storage = new JSONLStorage();
  const extensions = options.extensions?.split(',') || ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.rb', '.php'];
  
  const ingestOptions: IngestOptions = {
    recursive: options.recursive || false,
    extensions
  };

  try {
    const files = await findCodeFiles(inputPath, ingestOptions);
    console.log(`📁 Found ${files.length} code files`);

    let snippetCount = 0;
    for (const file of files) {
      try {
        const snippets = await extractSnippets(file);
        for (const snippet of snippets) {
          await storage.appendSnippet(snippet);
          snippetCount++;
        }
        
        if (snippetCount % 10 === 0) {
          process.stdout.write(`\r⚡ Processed ${snippetCount} snippets...`);
        }
      } catch (error) {
        console.warn(`⚠️  Warning: Could not process ${file}: ${error}`);
      }
    }

    console.log(`\n✅ Ingestion complete! Processed ${snippetCount} code snippets`);
    console.log(`📊 Data stored in ./data/snippets.jsonl`);

  } catch (error) {
    console.error(`❌ Error during ingestion: ${error}`);
    process.exit(1);
  }
}

async function findCodeFiles(inputPath: string, options: IngestOptions): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const stat = await fs.stat(inputPath);
    
    if (stat.isFile()) {
      const ext = path.extname(inputPath);
      if (options.extensions.includes(ext)) {
        files.push(inputPath);
      }
    } else if (stat.isDirectory()) {
      await walkDirectory(inputPath, files, options);
    }
  } catch (error) {
    throw new Error(`Cannot access path: ${inputPath}`);
  }
  
  return files;
}

async function walkDirectory(dir: string, files: string[], options: IngestOptions): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip common directories to ignore
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '__pycache__', '.vscode'].includes(entry.name)) {
        continue;
      }
      
      if (options.recursive) {
        await walkDirectory(fullPath, files, options);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (options.extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
}

async function extractSnippets(filepath: string): Promise<CodeSnippet[]> {
  const content = await fs.readFile(filepath, 'utf-8');
  const language = CodeTokenizer.detectLanguage(filepath);
  
  // Simple function/class extraction based on language
  const snippets: CodeSnippet[] = [];
  const lines = content.split('\n');
  
  // Extract functions and classes
  let currentSnippet: { start: number; content: string[] } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect start of function/class/method
    if (isFunctionStart(trimmed, language)) {
      if (currentSnippet) {
        // Finish previous snippet
        snippets.push(createSnippet(currentSnippet, filepath, language, i));
      }
      
      currentSnippet = {
        start: i + 1,
        content: [line]
      };
    } else if (currentSnippet) {
      currentSnippet.content.push(line);
      
      // Check for end of function (simple heuristic)
      if (isFunctionEnd(trimmed, language, currentSnippet.content)) {
        snippets.push(createSnippet(currentSnippet, filepath, language, i + 1));
        currentSnippet = null;
      }
    }
  }
  
  // Handle last snippet if file ends without explicit end
  if (currentSnippet) {
    snippets.push(createSnippet(currentSnippet, filepath, language, lines.length));
  }
  
  // If no functions found, create one snippet for entire file (if small enough)
  if (snippets.length === 0 && lines.length <= 50) {
    snippets.push({
      id: generateId(),
      content,
      language,
      filepath,
      lineStart: 1,
      lineEnd: lines.length,
      hash: CodeTokenizer.hash(content),
      tokens: CodeTokenizer.tokenize(content, language),
      normalized: CodeTokenizer.normalize(content, language),
      timestamp: new Date().toISOString()
    });
  }
  
  return snippets.filter(s => s.content.trim().length > 20); // Filter very small snippets
}

function isFunctionStart(line: string, language: string): boolean {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return /^(export\s+)?(async\s+)?function\s+\w+|^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\(|^class\s+\w+|^\s*(public|private|protected)?\s*(async\s+)?\w+\s*\(/
        .test(line);
    case 'python':
      return /^def\s+\w+|^class\s+\w+/.test(line);
    case 'java':
    case 'csharp':
      return /^(public|private|protected)?\s*(static\s+)?(class|interface|enum)\s+\w+|^(public|private|protected)?\s*(static\s+)?\w+\s+\w+\s*\(/.test(line);
    default:
      return /function|def|class|proc|sub/.test(line);
  }
}

function isFunctionEnd(line: string, language: string, content: string[]): boolean {
  const indentLevel = getIndentLevel(content[0]);
  const currentIndent = getIndentLevel(line);
  
  switch (language) {
    case 'python':
      // In Python, function ends when indentation returns to original level or less
      return line.trim() !== '' && currentIndent <= indentLevel && content.length > 3;
    default:
      // For brace languages, look for closing brace at same or less indentation
      return line.trim() === '}' && currentIndent <= indentLevel;
  }
}

function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function createSnippet(
  snippet: { start: number; content: string[] },
  filepath: string,
  language: string,
  endLine: number
): CodeSnippet {
  const content = snippet.content.join('\n');
  
  return {
    id: generateId(),
    content,
    language,
    filepath,
    lineStart: snippet.start,
    lineEnd: endLine,
    hash: CodeTokenizer.hash(content),
    tokens: CodeTokenizer.tokenize(content, language),
    normalized: CodeTokenizer.normalize(content, language),
    timestamp: new Date().toISOString()
  };
}

function generateId(): string {
  return `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}