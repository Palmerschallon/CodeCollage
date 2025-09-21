import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

interface ClusterDetail {
  cluster: {
    id: string
    size: number
    similarity: number
    timestamp: string
    centroid: string
  }
  snippets: Array<{
    id: string
    content: string
    language: string
    filepath: string
    lineStart: number
    lineEnd: number
  }>
  patterns: Array<{
    type: string
    content: string
    frequency: number
    confidence: number
  }>
}

function ClusterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [cluster, setCluster] = useState<ClusterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchClusterDetail(id)
    }
  }, [id])

  const fetchClusterDetail = async (clusterId: string) => {
    try {
      const response = await fetch(`/api/clusters/${clusterId}`)
      const data = await response.json()
      setCluster(data)
      if (data.snippets.length > 0) {
        setSelectedSnippet(data.cluster.centroid || data.snippets[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch cluster detail:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading cluster details</div>
  }

  if (!cluster) {
    return <div>Cluster not found</div>
  }

  const selectedSnippetData = cluster.snippets.find(s => s.id === selectedSnippet)

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/clusters" className="btn btn-secondary">← Back to Clusters</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>
          Cluster {cluster.cluster.id.split('-')[1]}
        </h2>
        <div style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
          {cluster.snippets.length} snippets • {(cluster.cluster.similarity * 100).toFixed(1)}% similarity
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Sidebar with snippet list and patterns */}
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
              Code Snippets
            </h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {cluster.snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  onClick={() => setSelectedSnippet(snippet.id)}
                  style={{
                    padding: '0.75rem',
                    border: '2px solid var(--black)',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    background: selectedSnippet === snippet.id ? 'var(--accent)' : 'var(--white)',
                    color: selectedSnippet === snippet.id ? 'var(--white)' : 'var(--black)',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700 }}>
                    {snippet.filepath.split('/').pop()}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {snippet.language} • Lines {snippet.lineStart}-{snippet.lineEnd}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {cluster.patterns.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
                Patterns
              </h3>
              <div className="pattern-list">
                {cluster.patterns
                  .sort((a, b) => b.frequency - a.frequency)
                  .slice(0, 10)
                  .map((pattern, idx) => (
                    <div key={idx} className="pattern-item">
                      <div className="pattern-content">
                        {pattern.content}
                      </div>
                      <div className="pattern-meta">
                        <div>{pattern.type.toUpperCase()}</div>
                        <span className="pattern-frequency">{pattern.frequency}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content area with selected snippet */}
        <div>
          {selectedSnippetData ? (
            <div>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {selectedSnippetData.filepath.split('/').pop()}
                </h3>
                <div style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
                  {selectedSnippetData.language} • Lines {selectedSnippetData.lineStart}-{selectedSnippetData.lineEnd}
                </div>
              </div>
              
              <div className="code-block">
                {selectedSnippetData.content.split('\n').map((line, idx) => (
                  <div key={idx}>
                    <span className="line-number">{selectedSnippetData.lineStart + idx}</span>
                    {line}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--gray-dark)' }}>
                <strong>File:</strong> {selectedSnippetData.filepath}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
              Select a snippet to view its code
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClusterDetailPage