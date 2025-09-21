# CodeCollage

Copy.Paste.Remix

## Overview

CodeCollage is a system for ingesting mixed-language code, normalizing it, deduplicating via MinHash/LSH, clustering, and extracting patterns (n-grams, LCS, AST). It stores data in JSONL format and provides a brutalist web UI for exploring code clusters and patterns.

## Features

- **Multi-language code ingestion**: Supports JavaScript, TypeScript, Python, Java, C++, C, Rust, Go, PHP, Ruby, Swift, Kotlin, Scala, C#, HTML, CSS, SQL
- **Advanced deduplication**: Uses MinHash/LSH for efficient similarity detection
- **Pattern extraction**: Extracts n-grams, longest common subsequences, and AST-like patterns
- **Clustering**: Groups similar code snippets using LSH and similarity thresholds
- **Brutalist UI**: Clean black/white interface with yellow accents for browsing clusters→snippets→preview
- **Impossibilitron sector**: Code hallucination and repair based on extracted patterns
- **JSONL storage**: Append-only data format for efficient processing

## Installation

```bash
npm install
npm run build
```

## CLI Usage

The `cc` command provides four main operations:

### Ingest
```bash
cc ingest <paths...> [-v]
```
Ingest code from files or directories. Supports recursive directory scanning.

### Index  
```bash
cc index [-v]
```
Index and deduplicate ingested code, create clusters using MinHash/LSH.

### Synthesize
```bash
cc synth [-v]
```
Extract patterns from indexed code (n-grams, LCS, AST patterns).

### Serve
```bash
cc serve [-p port] [-h host]
```
Start the web UI server (default: localhost:3000).

## Example Workflow

```bash
# 1. Ingest code from a project
cc ingest ./my-project/src

# 2. Index and cluster the code
cc index

# 3. Extract patterns
cc synth

# 4. Start the UI to explore results
cc serve
```

## Data Structure

- `/data/snippets/` - Code snippets in JSONL format
- `/data/clusters/` - Clusters in JSONL format  
- `/data/patterns/` - Extracted patterns in JSONL format
- `/data/metadata/` - Configuration and statistics
- `/impossibilitron/` - Generated/repaired code output

## Architecture

### Core Modules

- **Tokenizer**: Normalizes code by removing comments, strings, and extracting meaningful tokens
- **MinHash/LSH**: Efficient similarity computation and candidate generation
- **Clusterer**: Groups similar code using configurable thresholds
- **Pattern Extractor**: Identifies recurring patterns across languages
- **Storage**: JSONL-based append-only data persistence
- **Impossibilitron**: Pattern-based code generation and repair

### Configuration

Default configuration in `src/core/config.ts`:
- MinHash bands: 20
- MinHash rows per band: 5  
- N-gram size: 3
- Similarity threshold: 0.8
- Cluster threshold: 0.7

## UI Features

The brutalist web interface provides:

- **Stats dashboard**: Overview of snippets, clusters, patterns, and languages
- **Cluster browser**: Grid view of all clusters with size and language info
- **Snippet explorer**: Code snippets within each cluster
- **Code preview**: Syntax-highlighted code view with metadata
- **Navigation**: Breadcrumb-style navigation between views

## Impossibilitron

The Impossibilitron sector can:
- **Hallucinate** new code based on extracted patterns
- **Repair** broken code using pattern-based fixes
- Output generated/repaired code to `/impossibilitron/` directory

## Development

### Building
```bash
npm run build
```

### Testing
```bash
# Test with fixture files
cc ingest fixtures/
cc index -v
cc synth -v
cc serve
```

### Project Structure
```
src/
├── cli/          # Command-line interface
├── core/         # Core algorithms and data structures
├── impossibilitron/  # Code generation/repair
└── ui/           # Web interface (served by CLI)

fixtures/         # Sample code files for testing
data/            # Generated data storage (JSONL)
impossibilitron/ # Generated/repaired code output
```

## License

MIT