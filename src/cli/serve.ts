import { createServer } from 'http';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CodeCollage } from '../core/index.js';

interface ServeOptions {
  port: number;
  host: string;
}

export async function serve(cc: CodeCollage, options: ServeOptions): Promise<void> {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const pathname = url.pathname;

      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // API routes
      if (pathname.startsWith('/api')) {
        await handleAPI(pathname, req, res, cc);
        return;
      }

      // Static files for UI
      if (pathname === '/' || pathname === '/index.html') {
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(await generateIndexHTML());
        return;
      }

      if (pathname === '/style.css') {
        res.setHeader('Content-Type', 'text/css');
        res.writeHead(200);
        res.end(generateCSS());
        return;
      }

      if (pathname === '/app.js') {
        res.setHeader('Content-Type', 'application/javascript');
        res.writeHead(200);
        res.end(await generateAppJS());
        return;
      }

      // 404
      res.writeHead(404);
      res.end('Not Found');
    } catch (error) {
      console.error('Request error:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });

  server.listen(options.port, options.host, () => {
    console.log(`CodeCollage UI available at http://${options.host}:${options.port}`);
  });
}

async function handleAPI(pathname: string, req: any, res: any, cc: CodeCollage): Promise<void> {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (pathname === '/api/data') {
      const data = await cc.getData();
      res.writeHead(200);
      res.end(JSON.stringify(data));
      return;
    }

    if (pathname === '/api/clusters') {
      const { clusters } = await cc.getData();
      res.writeHead(200);
      res.end(JSON.stringify(clusters));
      return;
    }

    if (pathname.startsWith('/api/cluster/')) {
      const clusterId = pathname.split('/').pop();
      const { clusters, snippets } = await cc.getData();
      const cluster = clusters.find(c => c.id === clusterId);
      
      if (!cluster) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Cluster not found' }));
        return;
      }

      const clusterSnippets = snippets.filter(s => cluster.snippets.includes(s.id));
      res.writeHead(200);
      res.end(JSON.stringify({ cluster, snippets: clusterSnippets }));
      return;
    }

    if (pathname.startsWith('/api/snippet/')) {
      const snippetId = pathname.split('/').pop();
      const { snippets } = await cc.getData();
      const snippet = snippets.find(s => s.id === snippetId);
      
      if (!snippet) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Snippet not found' }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify(snippet));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
  } catch (error) {
    console.error('API error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

async function generateIndexHTML(): Promise<string> {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeCollage</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <header>
        <h1>CODECOLLAGE</h1>
        <p>Copy.Paste.Remix</p>
    </header>
    
    <main>
        <section id="stats" class="stats-section">
            <div class="loading">Loading data...</div>
        </section>
        
        <section id="clusters" class="clusters-section">
            <h2>CLUSTERS</h2>
            <div id="cluster-list" class="cluster-list">
                <div class="loading">Loading clusters...</div>
            </div>
        </section>
        
        <section id="snippets" class="snippets-section" style="display: none;">
            <h2>SNIPPETS</h2>
            <div id="snippet-list" class="snippet-list"></div>
        </section>
        
        <section id="preview" class="preview-section" style="display: none;">
            <h2>PREVIEW</h2>
            <div id="snippet-preview" class="snippet-preview"></div>
        </section>
    </main>
    
    <script src="/app.js"></script>
</body>
</html>`;
}

function generateCSS(): string {
  return `/* Brutalist CodeCollage CSS */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Courier New', monospace;
    background: #000;
    color: #fff;
    line-height: 1.4;
}

header {
    background: #fff;
    color: #000;
    padding: 20px;
    border-bottom: 4px solid #000;
}

header h1 {
    font-size: 2rem;
    font-weight: bold;
    letter-spacing: 2px;
}

header p {
    margin-top: 5px;
    font-size: 0.9rem;
}

main {
    padding: 20px;
}

section {
    margin-bottom: 40px;
    border: 2px solid #fff;
    padding: 20px;
}

h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
    border-bottom: 2px solid #fff;
    padding-bottom: 10px;
}

.stats-section {
    background: #333;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.stat-item {
    background: #000;
    border: 2px solid #fff;
    padding: 15px;
    text-align: center;
}

.stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #ff0;
}

.stat-label {
    margin-top: 5px;
    text-transform: uppercase;
    font-size: 0.8rem;
}

.cluster-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.cluster-item {
    background: #fff;
    color: #000;
    border: 3px solid #000;
    padding: 15px;
    cursor: pointer;
    transition: all 0.2s;
}

.cluster-item:hover {
    background: #ff0;
    border-color: #ff0;
}

.cluster-item.active {
    background: #f00;
    color: #fff;
    border-color: #f00;
}

.cluster-id {
    font-weight: bold;
    margin-bottom: 10px;
    font-size: 0.9rem;
}

.cluster-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 0.8rem;
}

.cluster-languages {
    margin-bottom: 10px;
    font-size: 0.8rem;
}

.cluster-patterns {
    font-size: 0.7rem;
    color: #666;
    max-height: 40px;
    overflow: hidden;
}

.snippet-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

.snippet-item {
    background: #333;
    border: 2px solid #666;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.snippet-item:hover {
    border-color: #fff;
    background: #444;
}

.snippet-item.active {
    border-color: #ff0;
    background: #555;
}

.snippet-filename {
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 0.8rem;
    color: #ff0;
}

.snippet-language {
    background: #000;
    color: #fff;
    padding: 2px 8px;
    font-size: 0.7rem;
    display: inline-block;
    margin-bottom: 8px;
}

.snippet-preview-content {
    background: #000;
    color: #0f0;
    padding: 15px;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    overflow-x: auto;
    white-space: pre;
    border: 1px solid #333;
    max-height: 400px;
    overflow-y: auto;
}

.snippet-meta {
    margin-top: 15px;
    padding: 15px;
    background: #222;
    border: 1px solid #444;
}

.meta-item {
    margin-bottom: 10px;
    font-size: 0.8rem;
}

.meta-label {
    color: #ff0;
    font-weight: bold;
}

.back-button {
    background: #f00;
    color: #fff;
    border: none;
    padding: 10px 20px;
    margin-bottom: 20px;
    cursor: pointer;
    font-family: inherit;
    font-weight: bold;
    text-transform: uppercase;
}

.back-button:hover {
    background: #ff0;
    color: #000;
}

.loading {
    text-align: center;
    padding: 40px;
    color: #666;
    font-style: italic;
}

.error {
    background: #f00;
    color: #fff;
    padding: 15px;
    margin: 20px 0;
    border: 2px solid #fff;
}

@media (max-width: 768px) {
    .cluster-list,
    .snippet-list {
        grid-template-columns: 1fr;
    }
    
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}`;
}

async function generateAppJS(): Promise<string> {
  return `// CodeCollage Brutalist UI
class CodeCollageUI {
    constructor() {
        this.data = null;
        this.currentCluster = null;
        this.currentSnippet = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.renderStats();
        this.renderClusters();
    }

    async loadData() {
        try {
            const response = await fetch('/api/data');
            this.data = await response.json();
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showError('Failed to load data');
        }
    }

    renderStats() {
        const statsEl = document.getElementById('stats');
        if (!this.data) return;

        const { stats, clusters, patterns } = this.data;
        
        statsEl.innerHTML = \`
            <h2>STATS</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number">\${stats.totalSnippets}</div>
                    <div class="stat-label">SNIPPETS</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">\${stats.totalClusters}</div>
                    <div class="stat-label">CLUSTERS</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">\${stats.totalPatterns}</div>
                    <div class="stat-label">PATTERNS</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">\${stats.languages.length}</div>
                    <div class="stat-label">LANGUAGES</div>
                </div>
            </div>
        \`;
    }

    renderClusters() {
        const clusterListEl = document.getElementById('cluster-list');
        if (!this.data) return;

        const { clusters } = this.data;
        
        clusterListEl.innerHTML = clusters.map(cluster => \`
            <div class="cluster-item" data-cluster-id="\${cluster.id}">
                <div class="cluster-id">\${cluster.id}</div>
                <div class="cluster-info">
                    <span>Size: \${cluster.size}</span>
                    <span>Patterns: \${cluster.patterns.length}</span>
                </div>
                <div class="cluster-languages">
                    Languages: \${cluster.languages.join(', ')}
                </div>
                <div class="cluster-patterns">
                    \${cluster.patterns.slice(0, 3).join(', ')}
                    \${cluster.patterns.length > 3 ? '...' : ''}
                </div>
            </div>
        \`).join('');

        // Add click handlers
        clusterListEl.querySelectorAll('.cluster-item').forEach(item => {
            item.addEventListener('click', () => {
                const clusterId = item.dataset.clusterId;
                this.selectCluster(clusterId);
            });
        });
    }

    async selectCluster(clusterId) {
        try {
            const response = await fetch(\`/api/cluster/\${clusterId}\`);
            const clusterData = await response.json();
            
            this.currentCluster = clusterData;
            this.renderSnippets(clusterData.snippets);
            
            // Update UI
            document.getElementById('clusters').style.display = 'none';
            document.getElementById('snippets').style.display = 'block';
            
            // Highlight selected cluster
            document.querySelectorAll('.cluster-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(\`[data-cluster-id="\${clusterId}"]\`).classList.add('active');
        } catch (error) {
            console.error('Failed to load cluster:', error);
            this.showError('Failed to load cluster');
        }
    }

    renderSnippets(snippets) {
        const snippetsSection = document.getElementById('snippets');
        const snippetListEl = document.getElementById('snippet-list');
        
        snippetsSection.innerHTML = \`
            <button class="back-button" onclick="ui.showClusters()">← Back to Clusters</button>
            <h2>SNIPPETS (\${snippets.length})</h2>
            <div id="snippet-list" class="snippet-list"></div>
        \`;
        
        const newSnippetListEl = document.getElementById('snippet-list');
        newSnippetListEl.innerHTML = snippets.map(snippet => \`
            <div class="snippet-item" data-snippet-id="\${snippet.id}">
                <div class="snippet-filename">\${this.getFilename(snippet.filename)}</div>
                <div class="snippet-language">\${snippet.language}</div>
                <div class="snippet-info">
                    Tokens: \${snippet.tokens.length} | Hash: \${snippet.hash.substring(0, 8)}...
                </div>
            </div>
        \`).join('');

        // Add click handlers
        newSnippetListEl.querySelectorAll('.snippet-item').forEach(item => {
            item.addEventListener('click', () => {
                const snippetId = item.dataset.snippetId;
                this.selectSnippet(snippetId);
            });
        });
    }

    async selectSnippet(snippetId) {
        try {
            const response = await fetch(\`/api/snippet/\${snippetId}\`);
            const snippet = await response.json();
            
            this.currentSnippet = snippet;
            this.renderSnippetPreview(snippet);
            
            // Update UI
            document.getElementById('snippets').style.display = 'none';
            document.getElementById('preview').style.display = 'block';
            
            // Highlight selected snippet
            document.querySelectorAll('.snippet-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(\`[data-snippet-id="\${snippetId}"]\`).classList.add('active');
        } catch (error) {
            console.error('Failed to load snippet:', error);
            this.showError('Failed to load snippet');
        }
    }

    renderSnippetPreview(snippet) {
        const previewSection = document.getElementById('preview');
        
        previewSection.innerHTML = \`
            <button class="back-button" onclick="ui.showSnippets()">← Back to Snippets</button>
            <h2>PREVIEW</h2>
            <div class="snippet-preview-content">\${this.escapeHtml(snippet.content)}</div>
            <div class="snippet-meta">
                <div class="meta-item">
                    <span class="meta-label">File:</span> \${snippet.filename}
                </div>
                <div class="meta-item">
                    <span class="meta-label">Language:</span> \${snippet.language}
                </div>
                <div class="meta-item">
                    <span class="meta-label">Tokens:</span> \${snippet.tokens.length}
                </div>
                <div class="meta-item">
                    <span class="meta-label">Hash:</span> \${snippet.hash}
                </div>
                <div class="meta-item">
                    <span class="meta-label">Cluster:</span> \${snippet.clusterId || 'None'}
                </div>
            </div>
        \`;
    }

    showClusters() {
        document.getElementById('clusters').style.display = 'block';
        document.getElementById('snippets').style.display = 'none';
        document.getElementById('preview').style.display = 'none';
    }

    showSnippets() {
        document.getElementById('clusters').style.display = 'none';
        document.getElementById('snippets').style.display = 'block';
        document.getElementById('preview').style.display = 'none';
    }

    getFilename(filepath) {
        return filepath.split('/').pop() || filepath;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error';
        errorEl.textContent = message;
        document.body.insertBefore(errorEl, document.body.firstChild);
        
        setTimeout(() => {
            errorEl.remove();
        }, 5000);
    }
}

// Initialize the UI
const ui = new CodeCollageUI();`;
}