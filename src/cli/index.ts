#!/usr/bin/env node

import { Command } from 'commander';
import { CodeCollage } from '../core/index.js';
import { serve } from './serve.js';

const program = new Command();

program
  .name('cc')
  .description('CodeCollage: ingest mixed-lang code, normalize, dedupe via MinHash/LSH, cluster, and extract patterns')
  .version('0.1.0');

program
  .command('ingest')
  .description('Ingest code from files or directories')
  .argument('<paths...>', 'paths to files or directories to ingest')
  .option('-v, --verbose', 'verbose output')
  .action(async (paths, options) => {
    try {
      const cc = new CodeCollage();
      await cc.initialize();
      
      console.log('🔄 Ingesting code...');
      const result = await cc.ingest(paths);
      
      console.log(`✅ Ingestion complete:`);
      console.log(`   - Processed: ${result.processed} files`);
      console.log(`   - Skipped: ${result.skipped} files`);
      console.log(`   - Snippets created: ${result.snippets.length}`);
      
      if (options.verbose) {
        const languages = [...new Set(result.snippets.map(s => s.language))];
        console.log(`   - Languages detected: ${languages.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Ingestion failed:', error);
      process.exit(1);
    }
  });

program
  .command('index')
  .description('Index and deduplicate ingested code, create clusters')
  .option('-v, --verbose', 'verbose output')
  .action(async (options) => {
    try {
      const cc = new CodeCollage();
      await cc.initialize();
      
      console.log('🔄 Indexing and clustering...');
      const result = await cc.index();
      
      console.log(`✅ Indexing complete:`);
      console.log(`   - Total snippets: ${result.totalSnippets}`);
      console.log(`   - Duplicates removed: ${result.duplicatesRemoved}`);
      console.log(`   - Clusters created: ${result.clusters.length}`);
      
      if (options.verbose) {
        const singletons = result.clusters.filter(c => c.size === 1).length;
        const largest = Math.max(...result.clusters.map(c => c.size));
        console.log(`   - Singleton clusters: ${singletons}`);
        console.log(`   - Largest cluster size: ${largest}`);
      }
    } catch (error) {
      console.error('❌ Indexing failed:', error);
      process.exit(1);
    }
  });

program
  .command('synth')
  .description('Synthesize patterns from indexed code')
  .option('-v, --verbose', 'verbose output')
  .action(async (options) => {
    try {
      const cc = new CodeCollage();
      await cc.initialize();
      
      console.log('🔄 Synthesizing patterns...');
      const result = await cc.synthesize();
      
      console.log(`✅ Pattern synthesis complete:`);
      console.log(`   - Total patterns: ${result.patterns.length}`);
      console.log(`   - N-gram patterns: ${result.stats.ngramPatterns}`);
      console.log(`   - LCS patterns: ${result.stats.lcsPatterns}`);
      console.log(`   - AST patterns: ${result.stats.astPatterns}`);
      
      if (options.verbose) {
        const top5 = result.patterns.slice(0, 5);
        console.log('\\n   Top patterns:');
        for (const pattern of top5) {
          console.log(`     - ${pattern.type}: "${pattern.content}" (freq: ${pattern.frequency})`);
        }
      }
    } catch (error) {
      console.error('❌ Pattern synthesis failed:', error);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Serve the CodeCollage UI')
  .option('-p, --port <port>', 'port to serve on', '3000')
  .option('-h, --host <host>', 'host to bind to', 'localhost')
  .action(async (options) => {
    try {
      const cc = new CodeCollage();
      await cc.initialize();
      
      console.log(`🚀 Starting CodeCollage server on http://${options.host}:${options.port}`);
      await serve(cc, {
        port: parseInt(options.port),
        host: options.host
      });
    } catch (error) {
      console.error('❌ Server failed to start:', error);
      process.exit(1);
    }
  });

program.parse();