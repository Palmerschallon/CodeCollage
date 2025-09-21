import { useState } from 'react'

interface RepairResult {
  original: string
  repaired: string
  confidence: number
  changes: string[]
}

interface GenerateResult {
  prompt: string
  code: string
  language: string
  confidence: number
}

function ImpossibilitronPage() {
  const [activeTab, setActiveTab] = useState<'repair' | 'generate'>('repair')
  
  // Repair state
  const [repairCode, setRepairCode] = useState('')
  const [repairLanguage, setRepairLanguage] = useState('javascript')
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null)
  const [repairLoading, setRepairLoading] = useState(false)
  
  // Generate state
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [generateLanguage, setGenerateLanguage] = useState('javascript')
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null)
  const [generateLoading, setGenerateLoading] = useState(false)

  const handleRepair = async () => {
    if (!repairCode.trim()) return
    
    setRepairLoading(true)
    try {
      const response = await fetch('/api/impossibilitron/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: repairCode, language: repairLanguage })
      })
      const result = await response.json()
      setRepairResult(result)
    } catch (error) {
      console.error('Repair failed:', error)
    } finally {
      setRepairLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) return
    
    setGenerateLoading(true)
    try {
      const response = await fetch('/api/impossibilitron/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatePrompt, language: generateLanguage })
      })
      const result = await response.json()
      setGenerateResult(result)
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setGenerateLoading(false)
    }
  }

  const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust']

  return (
    <div>
      <div className="impossibilitron">
        <h2>Impossibilitron Sector</h2>
        <div className="description">
          Advanced code hallucination and repair system. Warning: May produce impossible or surreal code constructs.
          Results stored in /impossibilitron/ for quarantine analysis.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('repair')}
          style={{
            background: activeTab === 'repair' ? 'var(--accent)' : 'var(--white)',
            color: activeTab === 'repair' ? 'var(--white)' : 'var(--black)',
            border: '2px solid var(--black)',
            borderRight: 'none',
            padding: '1rem 2rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          Code Repair
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          style={{
            background: activeTab === 'generate' ? 'var(--accent)' : 'var(--white)',
            color: activeTab === 'generate' ? 'var(--white)' : 'var(--black)',
            border: '2px solid var(--black)',
            padding: '1rem 2rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          Code Generation
        </button>
      </div>

      {activeTab === 'repair' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
              Input Code
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <select
                value={repairLanguage}
                onChange={(e) => setRepairLanguage(e.target.value)}
                style={{
                  border: '2px solid var(--black)',
                  padding: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--white)',
                  marginBottom: '1rem'
                }}
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <textarea
              value={repairCode}
              onChange={(e) => setRepairCode(e.target.value)}
              placeholder="Paste broken code here for repair..."
              style={{
                width: '100%',
                height: '300px',
                border: '3px solid var(--black)',
                padding: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                background: 'var(--white)',
                resize: 'none'
              }}
            />

            <button
              onClick={handleRepair}
              disabled={repairLoading || !repairCode.trim()}
              className="btn"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {repairLoading ? 'REPAIRING...' : 'IMPOSSIBILITRON REPAIR'}
            </button>
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
              Repaired Code
            </h3>
            
            {repairResult ? (
              <div>
                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
                  Confidence: {(repairResult.confidence * 100).toFixed(1)}%
                </div>
                
                <div className="code-block" style={{ marginBottom: '1rem' }}>
                  {repairResult.repaired}
                </div>
                
                <div>
                  <strong>Changes Applied:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {repairResult.changes.map((change, idx) => (
                      <li key={idx} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ 
                height: '300px', 
                border: '3px solid var(--black)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                color: 'var(--gray-dark)'
              }}>
                Repaired code will appear here...
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
              Generation Prompt
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <select
                value={generateLanguage}
                onChange={(e) => setGenerateLanguage(e.target.value)}
                style={{
                  border: '2px solid var(--black)',
                  padding: '0.5rem',
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--white)',
                  marginBottom: '1rem'
                }}
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <textarea
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              placeholder="Describe the code you want to generate..."
              style={{
                width: '100%',
                height: '300px',
                border: '3px solid var(--black)',
                padding: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                background: 'var(--white)',
                resize: 'none'
              }}
            />

            <button
              onClick={handleGenerate}
              disabled={generateLoading || !generatePrompt.trim()}
              className="btn"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              {generateLoading ? 'GENERATING...' : 'IMPOSSIBILITRON GENERATE'}
            </button>
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
              Generated Code
            </h3>
            
            {generateResult ? (
              <div>
                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
                  Language: {generateResult.language} • Confidence: {(generateResult.confidence * 100).toFixed(1)}%
                </div>
                
                <div className="code-block">
                  {generateResult.code}
                </div>
              </div>
            ) : (
              <div style={{ 
                height: '300px', 
                border: '3px solid var(--black)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                color: 'var(--gray-dark)'
              }}>
                Generated code will appear here...
              </div>
            )}
          </div>
        </div>
      )}
      
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        border: '2px solid var(--accent)', 
        background: 'var(--gray-light)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.875rem'
      }}>
        <strong>⚠️ Impossibilitron Warning:</strong> This is a placeholder implementation. 
        In a production system, this would integrate with advanced AI/ML models for code analysis and generation.
        All outputs are stored in the /impossibilitron/ directory for safety analysis.
      </div>
    </div>
  )
}

export default ImpossibilitronPage