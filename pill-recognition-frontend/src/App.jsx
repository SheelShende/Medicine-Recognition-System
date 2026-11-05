import { useState } from 'react'
import Scanner from '../components/Scanner'
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
            <p>Ready to chat about {identifiedDrug}</p>
          ) : (
            <p style={{ color: '#64748b' }}>Awaiting image scan...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App