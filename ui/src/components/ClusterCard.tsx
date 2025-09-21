import { Link } from 'react-router-dom'

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

interface ClusterCardProps {
  clusterView: ClusterView
}

function ClusterCard({ clusterView }: ClusterCardProps) {
  const { cluster, snippets, patterns, preview } = clusterView
  
  const languages = [...new Set(snippets.map(s => s.language))]
  const topPatterns = patterns
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3)

  return (
    <Link to={`/clusters/${cluster.id}`} className="cluster-card">
      <div className="cluster-header">
        <div className="cluster-title">
          Cluster {cluster.id.split('-')[1]}
        </div>
        <div className="cluster-size">
          {cluster.size} snippets
        </div>
      </div>
      
      <div style={{ padding: '1rem', borderTop: '2px solid var(--black)' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
            Languages
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {languages.map(lang => (
              <span 
                key={lang}
                style={{
                  background: 'var(--black)',
                  color: 'var(--white)',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        {topPatterns.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
              Top Patterns
            </div>
            {topPatterns.map((pattern, idx) => (
              <div 
                key={idx}
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '0.25rem',
                  opacity: 0.8
                }}
              >
                {pattern.content} ({pattern.frequency}x)
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
          Similarity: {(cluster.similarity * 100).toFixed(1)}%
        </div>
      </div>

      <div className="cluster-preview">
        {preview || 'No preview available'}
      </div>
    </Link>
  )
}

export default ClusterCard