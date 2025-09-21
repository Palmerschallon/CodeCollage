# CodeCollage

**Copy.Paste.Remix** - Advanced code ingestion, clustering, and pattern extraction system

CodeCollage ingests mixed-language code, normalizes it, deduplicates via MinHash/LSH, clusters similar code fragments, and extracts meaningful patterns. Features a brutalist web UI for exploring code clusters and an experimental "Impossibilitron" sector for code hallucination and repair.

## Features

- 🔍 **Multi-language code ingestion** - Supports JavaScript, TypeScript, Python, Java, C++, Go, Rust, Ruby, PHP
- 🧬 **Advanced clustering** - MinHash/LSH-based deduplication and similarity clustering
- 🎨 **Pattern extraction** - N-grams, Longest Common Subsequence (LCS), and AST patterns
- 💾 **JSONL storage** - Append-only data format for reliability and incremental processing
- 🎭 **Brutalist UI** - Black/white design with red accents, built with Vite + TypeScript + React
- 🤖 **Impossibilitron** - Experimental code hallucination and repair system
- 🛠️ **CLI-first** - Command-line interface with `ingest`, `index`, `synth`, and `serve` commands

## Quick Start

```bash
# Install dependencies
npm install
cd ui && npm install && cd ..

# Build the project
npm run build

# Ingest code from a directory
npx cc ingest ./examples --recursive

# Build clusters and index
npx cc index

# Extract patterns
npx cc synth --type ngrams

# Start the web UI
npx cc serve --port 3000
```

## CLI Commands

### `cc ingest <path>`
Ingest source code files for analysis.

```bash
# Ingest a single file
cc ingest ./src/app.js

# Ingest a directory recursively
cc ingest ./src --recursive

# Specify file extensions
cc ingest ./project --recursive --extensions .js,.ts,.py
```

### `cc index`
Build clusters from ingested code using MinHash/LSH.

```bash
# Default clustering parameters
cc index

# Custom MinHash parameters
cc index --minhash-bands 25 --minhash-rows 4
```

### `cc synth`
Extract patterns from clustered code.

```bash
# Extract n-gram patterns (default)
cc synth

# Extract specific pattern types
cc synth --type lcs
cc synth --type ast
```

### `cc serve`
Start the web UI server.

```bash
# Start on default port (3000)
cc serve

# Custom port
cc serve --port 8080
```

## Architecture

### Core Components

- **Tokenizer** (`src/core/tokenizer.ts`) - Multi-language code normalization and tokenization
- **MinHash Clusterer** (`src/clustering/minhash.ts`) - LSH-based similarity clustering
- **Pattern Extractor** (`src/patterns/`) - N-gram, LCS, and AST pattern extraction
- **JSONL Storage** (`src/storage/jsonl.ts`) - Append-only data persistence
- **CLI** (`src/cli.ts`) - Command-line interface
- **Web UI** (`ui/`) - React-based visualization interface

### Data Flow

1. **Ingest** → Scan files → Tokenize/normalize → Extract snippets → Store in `data/snippets.jsonl`
2. **Index** → Load snippets → Generate MinHash signatures → Cluster via LSH → Store in `data/clusters.jsonl`
3. **Synth** → Load clusters → Extract patterns → Store in `data/patterns.jsonl`
4. **Serve** → Load all data → Provide API + UI for exploration

### Storage Format

All data is stored in append-only JSONL files in the `./data/` directory:

- `snippets.jsonl` - Individual code snippets with metadata
- `clusters.jsonl` - Similarity clusters of code snippets
- `patterns.jsonl` - Extracted patterns (n-grams, LCS, AST)

## Web UI

The brutalist web interface provides:

- **Clusters View** - Grid of code clusters with similarity metrics
- **Cluster Detail** - Deep dive into individual clusters with snippet preview
- **Patterns View** - Extracted patterns with frequency and confidence scores
- **Impossibilitron** - Experimental code repair and generation (placeholder)

Design principles:
- Black/white color scheme with red accents
- Monospace fonts for code display
- Bold, geometric layout
- No-nonsense, function-first interface

## Impossibilitron Sector

The Impossibilitron is an experimental system for:

- **Code Repair** - Attempt to fix broken or incomplete code
- **Code Generation** - Generate code from natural language prompts
- **Hallucination Detection** - Identify potentially impossible code constructs

> ⚠️ **Warning**: Current implementation is a placeholder. Production systems would integrate with advanced AI/ML models.

## Development

```bash
# Install dependencies
npm install
cd ui && npm install && cd ..

# Development mode (backend + frontend)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

### Project Structure

```
├── src/                    # Backend TypeScript source
│   ├── cli.ts             # CLI entry point
│   ├── commands/          # CLI command implementations
│   ├── core/              # Core types and utilities
│   ├── clustering/        # MinHash/LSH clustering
│   ├── patterns/          # Pattern extraction
│   └── storage/           # JSONL data persistence
├── ui/                    # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── styles/        # CSS styles
│   └── dist/              # Built UI assets
├── tests/                 # Test files
├── examples/              # Sample code for testing
├── data/                  # JSONL data files (created on first run)
└── impossibilitron/       # Experimental outputs (created as needed)
```

## Configuration

### Clustering Parameters

- **MinHash Bands**: Number of LSH bands (default: 20)
- **MinHash Rows**: Rows per band (default: 5)
- **Similarity Threshold**: Minimum similarity for clustering (default: 0.7)
- **Min Cluster Size**: Minimum snippets per cluster (default: 2)

### Supported Languages

- JavaScript (`.js`, `.jsx`)
- TypeScript (`.ts`, `.tsx`)
- Python (`.py`)
- Java (`.java`)
- C++ (`.cpp`)
- C (`.c`)
- Go (`.go`)
- Rust (`.rs`)
- Ruby (`.rb`)
- PHP (`.php`)
- C# (`.cs`)
- Swift (`.swift`)
- Kotlin (`.kt`)

## Contributing

1. Follow the modular architecture - keep components small and focused
2. Use TypeScript for type safety
3. Maintain append-only JSONL storage pattern
4. Add tests for new functionality
5. Document liberal - explain the approach and reasoning

## License

MIT License - Copy, Paste, Remix freely.
