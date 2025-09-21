import { useState, useEffect } from 'react'
import ClusterCard from '../components/ClusterCard'

interface ClusterView {
  cluster: {
    id: string
    size: number
    similarity: number
    timestamp: string
  }
  snippets: Array<{
    id: string
    language: string
    filepath: string
  }>
  patterns: Array<{
    type: string
    content: string
    frequency: number
  }>
  preview: string
}

function ClustersPage() {
  const [clusters, setClusters] = useState<ClusterView[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClusters()
  }, [])

  const fetchClusters = async () => {
    try {
      const response = await fetch('/api/clusters')
      const data = await response.json()
      setClusters(data)
    } catch (error) {
      console.error('Failed to fetch clusters:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClusters = clusters.filter(cluster => {
    const languages = cluster.snippets.map(s => s.language).join(' ')
    const patterns = cluster.patterns.map(p => p.content).join(' ')
    const searchText = `${languages} ${patterns} ${cluster.preview}`.toLowerCase()
    return searchText.includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return <div className="loading">Loading clusters</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>
          Code Clusters
        </h2>
        <div style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
          {filteredClusters.length} / {clusters.length} clusters
        </div>
      </div>

      <input
        type="text"
        placeholder="Search clusters by language, patterns, or content..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />

      {filteredClusters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
          {searchTerm ? 'No clusters match your search.' : 'No clusters found. Run "cc ingest" and "cc index" first.'}
        </div>
      ) : (
        <div className="cluster-grid">
          {filteredClusters.map((clusterView) => (
            <ClusterCard key={clusterView.cluster.id} clusterView={clusterView} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ClustersPage