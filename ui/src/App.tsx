import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ClustersPage from './pages/ClustersPage'
import ClusterDetailPage from './pages/ClusterDetailPage'
import PatternsPage from './pages/PatternsPage'
import ImpossibilitronPage from './pages/ImpossibilitronPage'

interface Stats {
  totalSnippets: number
  totalClusters: number
  totalPatterns: number
  languageBreakdown: Record<string, number>
  avgClusterSize: number
}

function App() {
  const location = useLocation()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path === '/clusters' && location.pathname.startsWith('/clusters'))
  }

  return (
    <div className="app">
      <header className="header">
        <h1>CodeCollage</h1>
        <div className="tagline">Copy.Paste.Remix</div>
        
        <nav className="nav">
          <Link 
            to="/clusters" 
            className={`nav-item ${isActive('/clusters') ? 'active' : ''}`}
          >
            Clusters
          </Link>
          <Link 
            to="/patterns" 
            className={`nav-item ${isActive('/patterns') ? 'active' : ''}`}
          >
            Patterns
          </Link>
          <Link 
            to="/impossibilitron" 
            className={`nav-item ${isActive('/impossibilitron') ? 'active' : ''}`}
          >
            Impossibilitron
          </Link>
        </nav>
      </header>

      <main className="main">
        {stats && (
          <div className="stats-panel">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{stats.totalSnippets}</span>
                <span className="stat-label">Code Snippets</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.totalClusters}</span>
                <span className="stat-label">Clusters</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.totalPatterns}</span>
                <span className="stat-label">Patterns</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.avgClusterSize.toFixed(1)}</span>
                <span className="stat-label">Avg Cluster Size</span>
              </div>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<ClustersPage />} />
          <Route path="/clusters" element={<ClustersPage />} />
          <Route path="/clusters/:id" element={<ClusterDetailPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/impossibilitron" element={<ImpossibilitronPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App