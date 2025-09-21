import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { JSONLStorage } from '../storage/jsonl.js';
import { UIClusterView } from '../core/types.js';

export async function serveCommand(options: { port?: string }): Promise<void> {
  const port = parseInt(options.port || '3000');
  const app = express();
  const storage = new JSONLStorage();

  app.use(cors());
  app.use(express.json());

  // Serve static UI files
  const uiPath = path.join(process.cwd(), 'ui', 'dist');
  app.use(express.static(uiPath));

  // API Routes
  app.get('/api/clusters', async (req, res) => {
    try {
      const clusters = await storage.readClusters();
      const snippets = await storage.readSnippets();
      const patterns = await storage.readPatterns();
      
      const snippetMap = new Map(snippets.map(s => [s.id, s]));
      const patternMap = new Map(patterns.map(p => [p.content, p]));
      
      const clusterViews: UIClusterView[] = clusters.map(cluster => {
        const clusterSnippets = cluster.snippets
          .map((id: string) => snippetMap.get(id))
          .filter((s: any) => s !== undefined);
        
        const clusterPatterns = patterns.filter(p => 
          p.snippets.some((sid: string) => cluster.snippets.includes(sid))
        );
        
        const preview = clusterSnippets[0]?.content.substring(0, 200) + '...' || '';
        
        return {
          cluster,
          snippets: clusterSnippets,
          patterns: clusterPatterns,
          preview
        };
      });
      
      res.json(clusterViews);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load clusters' });
    }
  });

  app.get('/api/clusters/:id', async (req, res) => {
    try {
      const clusters = await storage.readClusters();
      const cluster = clusters.find(c => c.id === req.params.id);
      
      if (!cluster) {
        return res.status(404).json({ error: 'Cluster not found' });
      }
      
      const snippets = await storage.readSnippets();
      const patterns = await storage.readPatterns();
      
      const snippetMap = new Map(snippets.map(s => [s.id, s]));
      const clusterSnippets = cluster.snippets
        .map((id: string) => snippetMap.get(id))
        .filter((s: any) => s !== undefined);
      
      const clusterPatterns = patterns.filter(p => 
        p.snippets.some((sid: string) => cluster.snippets.includes(sid))
      );
      
      res.json({
        cluster,
        snippets: clusterSnippets,
        patterns: clusterPatterns,
        preview: clusterSnippets[0]?.content || ''
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load cluster details' });
    }
  });

  app.get('/api/snippets/:id', async (req, res) => {
    try {
      const snippet = await storage.getSnippetById(req.params.id);
      if (!snippet) {
        return res.status(404).json({ error: 'Snippet not found' });
      }
      res.json(snippet);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load snippet' });
    }
  });

  app.get('/api/patterns', async (req, res) => {
    try {
      const patterns = await storage.readPatterns();
      const type = req.query.type as string;
      
      let filteredPatterns = patterns;
      if (type) {
        filteredPatterns = patterns.filter(p => p.type === type);
      }
      
      // Sort by frequency and confidence
      filteredPatterns.sort((a, b) => {
        const scoreA = a.frequency * a.confidence;
        const scoreB = b.frequency * b.confidence;
        return scoreB - scoreA;
      });
      
      res.json(filteredPatterns.slice(0, 100));
    } catch (error) {
      res.status(500).json({ error: 'Failed to load patterns' });
    }
  });

  app.get('/api/stats', async (req, res) => {
    try {
      const snippets = await storage.readSnippets();
      const clusters = await storage.readClusters();
      const patterns = await storage.readPatterns();
      
      const languageStats = new Map<string, number>();
      for (const snippet of snippets) {
        languageStats.set(snippet.language, (languageStats.get(snippet.language) || 0) + 1);
      }
      
      res.json({
        totalSnippets: snippets.length,
        totalClusters: clusters.length,
        totalPatterns: patterns.length,
        languageBreakdown: Object.fromEntries(languageStats),
        avgClusterSize: clusters.length > 0 ? 
          clusters.reduce((sum, c) => sum + c.size, 0) / clusters.length : 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load stats' });
    }
  });

  // Impossibilitron routes (placeholder for code hallucination/repair)
  app.post('/api/impossibilitron/repair', async (req, res) => {
    try {
      const { code, language } = req.body;
      
      // Placeholder for code repair functionality
      // In a real implementation, this would use AI/ML models
      const repairedCode = `// IMPOSSIBILITRON REPAIR\n${code}\n// END REPAIR`;
      
      res.json({
        original: code,
        repaired: repairedCode,
        confidence: 0.85,
        changes: ['Added comments', 'Potential syntax fixes']
      });
    } catch (error) {
      res.status(500).json({ error: 'Impossibilitron repair failed' });
    }
  });

  app.post('/api/impossibilitron/generate', async (req, res) => {
    try {
      const { prompt, language } = req.body;
      
      // Placeholder for code generation
      const generatedCode = `// Generated by IMPOSSIBILITRON\n// Prompt: ${prompt}\n\nfunction generatedFunction() {\n  // TODO: Implement based on prompt\n  return null;\n}`;
      
      res.json({
        prompt,
        code: generatedCode,
        language: language || 'javascript',
        confidence: 0.75
      });
    } catch (error) {
      res.status(500).json({ error: 'Impossibilitron generation failed' });
    }
  });

  // Catch-all route to serve UI
  app.get('*', (req, res) => {
    res.sendFile(path.join(uiPath, 'index.html'));
  });

  app.listen(port, () => {
    console.log(`🚀 CodeCollage server running on http://localhost:${port}`);
    console.log(`📊 UI available at http://localhost:${port}`);
    console.log(`🔌 API available at http://localhost:${port}/api`);
  });
}