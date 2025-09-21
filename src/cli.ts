#!/usr/bin/env node

import { Command } from 'commander';
import { ingestCommand } from './commands/ingest.js';
import { indexCommand } from './commands/index.js';
import { synthCommand } from './commands/synth.js';
import { serveCommand } from './commands/serve.js';

const program = new Command();

program
  .name('cc')
  .description('CodeCollage: Copy.Paste.Remix - Code analysis and clustering')
  .version('0.1.0');

program
  .command('ingest')
  .description('Ingest source code files for analysis')
  .argument('<path>', 'Path to code directory or file')
  .option('-r, --recursive', 'Recursively scan directories')
  .option('-e, --extensions <exts>', 'File extensions to include (comma-separated)', '.js,.ts,.py,.java,.cpp,.c,.go,.rs,.rb,.php')
  .action(ingestCommand);

program
  .command('index')
  .description('Index ingested code and build clusters')
  .option('-m, --minhash-bands <bands>', 'MinHash LSH bands', '20')
  .option('-r, --minhash-rows <rows>', 'MinHash LSH rows per band', '5')
  .action(indexCommand);

program
  .command('synth')
  .description('Synthesize patterns and extract insights')
  .option('-t, --type <type>', 'Pattern type: ngrams, lcs, ast', 'ngrams')
  .action(synthCommand);

program
  .command('serve')
  .description('Start the web UI server')
  .option('-p, --port <port>', 'Server port', '3000')
  .action(serveCommand);

program.parse();