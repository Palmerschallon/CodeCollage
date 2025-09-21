import { ClusteringConfig } from '../core/types.js';
import { MinHashClusterer } from '../clustering/minhash.js';
import { JSONLStorage } from '../storage/jsonl.js';

export async function indexCommand(options: { minhashBands?: string; minhashRows?: string }): Promise<void> {
  console.log('🔗 Building clusters from ingested code...');
  
  const storage = new JSONLStorage();
  
  // Load snippets
  const snippets = await storage.readSnippets();
  if (snippets.length === 0) {
    console.log('❌ No snippets found. Run "cc ingest" first.');
    process.exit(1);
  }
  
  console.log(`📊 Found ${snippets.length} code snippets`);
  
  // Configure clustering
  const config: ClusteringConfig = {
    minhashBands: parseInt(options.minhashBands || '20'),
    minhashRows: parseInt(options.minhashRows || '5'),
    similarityThreshold: 0.7,
    minClusterSize: 2
  };
  
  console.log(`⚙️  Clustering config: ${config.minhashBands} bands, ${config.minhashRows} rows, threshold ${config.similarityThreshold}`);
  
  // Create clusterer and process
  const clusterer = new MinHashClusterer(config);
  
  console.log('🔄 Generating MinHash signatures...');
  const clusters = await clusterer.clusterSnippets(snippets);
  
  console.log(`🎯 Found ${clusters.length} clusters`);
  
  // Save clusters
  for (const cluster of clusters) {
    await storage.appendCluster(cluster);
  }
  
  // Print cluster summary
  console.log('\n📈 Cluster Summary:');
  clusters.forEach((cluster, idx) => {
    console.log(`  Cluster ${idx + 1}: ${cluster.size} snippets (similarity: ${cluster.similarity.toFixed(3)})`);
  });
  
  console.log(`\n✅ Clustering complete! Results saved to ./data/clusters.jsonl`);
}