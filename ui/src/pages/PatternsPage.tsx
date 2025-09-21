import { useState, useEffect } from 'react'

interface Pattern {
  type: 'ngram' | 'lcs' | 'ast'
  content: string
  frequency: number
  snippets: string[]
  confidence: number
}

function PatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPatterns()
  }, [filterType])

  const fetchPatterns = async () => {
    try {
      const url = filterType === 'all' ? '/api/patterns' : `/api/patterns?type=${filterType}`
      const response = await fetch(url)
      const data = await response.json()
      setPatterns(data)
    } catch (error) {
      console.error('Failed to fetch patterns:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatterns = patterns.filter(pattern => {
    return pattern.content.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const patternTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'ngram', label: 'N-Grams' },
    { value: 'lcs', label: 'LCS' },
    { value: 'ast', label: 'AST' }
  ]

  if (loading) {
    return <div className="loading">Loading patterns</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>
          Code Patterns
        </h2>
        <div style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
          {filteredPatterns.length} / {patterns.length} patterns
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search patterns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
          style={{ flex: 1 }}
        />
        
        <div style={{ display: 'flex', gap: '0' }}>
          {patternTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              style={{
                background: filterType === type.value ? 'var(--accent)' : 'var(--white)',
                color: filterType === type.value ? 'var(--white)' : 'var(--black)',
                border: '2px solid var(--black)',
                borderRight: 'none',
                padding: '0.75rem 1rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.1s ease'
              }}
            >
              {type.label}
            </button>
          ))}
          <div style={{ borderRight: '2px solid var(--black)' }}></div>
        </div>
      </div>

      {filteredPatterns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
          {searchTerm ? 'No patterns match your search.' : 'No patterns found. Run "cc synth" first.'}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', border: '2px solid var(--black)', background: 'var(--gray-light)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>
                {filteredPatterns.reduce((sum, p) => sum + p.frequency, 0)}
              </div>
              <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Occurrences
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '2px solid var(--black)', background: 'var(--gray-light)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>
                {(filteredPatterns.reduce((sum, p) => sum + p.confidence, 0) / filteredPatterns.length * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Avg Confidence
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', border: '2px solid var(--black)', background: 'var(--gray-light)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>
                {Math.max(...filteredPatterns.map(p => p.frequency))}
              </div>
              <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Max Frequency
              </div>
            </div>
          </div>

          <div className="pattern-list">
            {filteredPatterns.map((pattern, idx) => (
              <div key={idx} className="pattern-item">
                <div style={{ flex: 1 }}>
                  <div className="pattern-content">
                    {pattern.content}
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--gray-dark)' }}>
                    Found in {pattern.snippets.length} snippets • Confidence: {(pattern.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="pattern-meta">
                  <div style={{ textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {pattern.type}
                  </div>
                  <span className="pattern-frequency">{pattern.frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PatternsPage