import { useState } from 'react'
import Scanner from '../components/Scanner'
import Chatbox from '../components/Chatbox'
import './index.css'

function App() {
  // This state will hold the drug name after the vision model successfully identifies it
  const [identifiedDrug, setIdentifiedDrug] = useState(null);
  const [medicalContext, setMedicalContext] = useState(null);

  return (
    <div>
      <h1>GenAI Medicine Tracker</h1>
      <p style={{ textAlign: 'center', color: '#94a3b8' }}>
        Upload a pill image to analyze its FDA profile and chat with the medical AI.
      </p>

      <div className="dashboard-container">
        {/* Left Side: The Image Scanner */}
        <div className="ui-card">
          <h2>Scanner</h2>
          <Scanner 
            onScanSuccess={(drugName, context) => {
              setIdentifiedDrug(drugName);
              setMedicalContext(context);
            }} 
          />
        </div>

        {/* Right Side: The GenAI Chat */}
        <div className="ui-card">
          <h2>AI Analysis</h2>
          {identifiedDrug ? (
            <>
              <div style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#047857', 
                borderRadius: '6px', 
                display: 'inline-block',
                marginBottom: '1rem',
                fontWeight: 'bold'
              }}>
                Identified: {identifiedDrug}
              </div>
              <Chatbox drugName={identifiedDrug} />
            </>
          ) : (
            <p style={{ color: '#64748b', marginTop: '1rem' }}>Awaiting image scan...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App