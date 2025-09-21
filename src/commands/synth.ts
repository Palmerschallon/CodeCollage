import { Pattern, SynthOptions } from '../core/types.js';
import { CodeTokenizer } from '../core/tokenizer.js';
import { JSONLStorage } from '../storage/jsonl.js';

export async function synthCommand(options: { type?: string }): Promise<void> {
  console.log('🧬 Synthesizing patterns from clusters...');
  
  const storage = new JSONLStorage();
  const snippets = await storage.readSnippets();
  const clusters = await storage.readClusters();
  
  if (clusters.length === 0) {
    console.log('❌ No clusters found. Run "cc index" first.');
    process.exit(1);
  }
  
  const synthOptions: SynthOptions = {
    type: (options.type as 'ngrams' | 'lcs' | 'ast') || 'ngrams',
    minFrequency: 3,
    maxResults: 100
  };
  
  console.log(`🔍 Extracting ${synthOptions.type} patterns...`);
  
  const snippetMap = new Map(snippets.map(s => [s.id, s]));
  const patterns: Pattern[] = [];
  
  for (const cluster of clusters) {
    const clusterSnippets = cluster.snippets
      .map((id: string) => snippetMap.get(id))
      .filter((s: any) => s !== undefined);
    
    switch (synthOptions.type) {
      case 'ngrams':
        patterns.push(...extractNGramPatterns(clusterSnippets, cluster.id));
        break;
      case 'lcs':
        patterns.push(...extractLCSPatterns(clusterSnippets, cluster.id));
        break;
      case 'ast':
        patterns.push(...extractASTPatterns(clusterSnippets, cluster.id));
        break;
    }
  }
  
  // Filter and rank patterns
  const filteredPatterns = patterns
    .filter(p => p.frequency >= (synthOptions.minFrequency || 3))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, synthOptions.maxResults);
  
  // Save patterns
  for (const pattern of filteredPatterns) {
    await storage.appendPattern(pattern);
  }
  
  console.log(`\n🎨 Pattern Summary (${synthOptions.type}):`);
  filteredPatterns.slice(0, 10).forEach((pattern, idx) => {
    console.log(`  ${idx + 1}. "${pattern.content}" (freq: ${pattern.frequency}, conf: ${pattern.confidence.toFixed(3)})`);
  });
  
  console.log(`\n✅ Pattern extraction complete! Found ${filteredPatterns.length} patterns`);
  console.log(`📊 Results saved to ./data/patterns.jsonl`);
}

function extractNGramPatterns(snippets: any[], clusterId: string): Pattern[] {
  const ngramCounts = new Map<string, { count: number; snippets: Set<string> }>();
  
  for (const snippet of snippets) {
    const tokens = CodeTokenizer.tokenize(snippet.content, snippet.language);
    const ngrams = CodeTokenizer.extractNGrams(tokens, 3);
    
    for (const ngram of ngrams) {
      if (!ngramCounts.has(ngram)) {
        ngramCounts.set(ngram, { count: 0, snippets: new Set() });
      }
      const entry = ngramCounts.get(ngram)!;
      entry.count++;
      entry.snippets.add(snippet.id);
    }
  }
  
  return Array.from(ngramCounts.entries()).map(([content, data]) => ({
    type: 'ngram' as const,
    content,
    frequency: data.count,
    snippets: Array.from(data.snippets),
    confidence: data.snippets.size / snippets.length
  }));
}

function extractLCSPatterns(snippets: any[], clusterId: string): Pattern[] {
  const patterns: Pattern[] = [];
  
  // Find longest common subsequences between pairs of snippets
  for (let i = 0; i < snippets.length; i++) {
    for (let j = i + 1; j < snippets.length; j++) {
      const lcs = findLCS(snippets[i].normalized, snippets[j].normalized);
      if (lcs.length > 10) { // Minimum length threshold
        patterns.push({
          type: 'lcs',
          content: lcs,
          frequency: 2, // At least 2 snippets share this
          snippets: [snippets[i].id, snippets[j].id],
          confidence: 0.8
        });
      }
    }
  }
  
  return patterns;
}

function extractASTPatterns(snippets: any[], clusterId: string): Pattern[] {
  // Simplified AST pattern extraction
  // In a real implementation, you'd use language-specific parsers
  const patterns: Pattern[] = [];
  const structurePatterns = new Map<string, { count: number; snippets: Set<string> }>();
  
  for (const snippet of snippets) {
    const structure = extractSimpleStructure(snippet.content);
    
    if (!structurePatterns.has(structure)) {
      structurePatterns.set(structure, { count: 0, snippets: new Set() });
    }
    const entry = structurePatterns.get(structure)!;
    entry.count++;
    entry.snippets.add(snippet.id);
  }
  
  return Array.from(structurePatterns.entries()).map(([content, data]) => ({
    type: 'ast' as const,
    content,
    frequency: data.count,
    snippets: Array.from(data.snippets),
    confidence: data.snippets.size / snippets.length
  }));
}

function findLCS(str1: string, str2: string): string {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Reconstruct LCS
  let result = '';
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (str1[i - 1] === str2[j - 1]) {
      result = str1[i - 1] + result;
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return result;
}

function extractSimpleStructure(code: string): string {
  // Extract basic structural patterns
  const lines = code.split('\n').map(line => line.trim());
  const structure: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('function') || line.startsWith('def')) {
      structure.push('FUNCTION');
    } else if (line.startsWith('class')) {
      structure.push('CLASS');
    } else if (line.startsWith('if')) {
      structure.push('IF');
    } else if (line.startsWith('for') || line.startsWith('while')) {
      structure.push('LOOP');
    } else if (line.includes('return')) {
      structure.push('RETURN');
    } else if (line === '{' || line === '}') {
      structure.push(line);
    }
  }
  
  return structure.join(' ');
}