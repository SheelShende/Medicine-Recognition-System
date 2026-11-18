import { useState } from 'react';
import axios from 'axios';
import Chatbox from '../components/Chatbox'; 
import imageCompression from 'browser-image-compression';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [identifiedDrug, setIdentifiedDrug] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIdentifiedDrug(""); 
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;
    setIsScanning(true);

    try {
      // Re-applying the compression we successfully built earlier
      const options = {
        maxSizeMB: 0.5,          
        maxWidthOrHeight: 1024,  
        useWebWorker: true       
      };
      
      const compressedFile = await imageCompression(selectedFile, options);
      
      const formData = new FormData();
      // Crucial: Keeping the selectedFile.name prevents the Blob crash
      formData.append("file", compressedFile, selectedFile.name);

      const response = await axios.post("http://localhost:8000/scan-pill/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setIdentifiedDrug(response.data.identified_drug || response.data.drug_name);
    } catch (error) {
      console.error("Scanning failed:", error);
      alert("Failed to scan medication. Make sure the backend is running.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      width: '100vw', 
      margin: 0,
      backgroundColor: '#020617', 
      backgroundImage: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 70%)',
      color: '#f8fafc', 
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '4rem 2rem',
      overflowX: 'hidden' 
    }}>
      
      {/* Dynamic Container: 750px wide initially, expands to 1100px when chat is active */}
      <div style={{ 
        maxWidth: identifiedDrug ? '1100px' : '750px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'max-width 0.5s ease-in-out'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            margin: '0 0 1rem 0',
            background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: '1.2'
          }}>
            GenAI Medicine Tracker
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0, lineHeight: '1.5' }}>
            Upload a pill image to analyze its FDA profile and chat with the medical AI.
          </p>
        </div>

        {/* Dashboard Grid Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: identifiedDrug ? '350px 1fr' : '1fr', 
          gap: '2.5rem',
          alignItems: 'start',
          transition: 'all 0.5s ease-in-out'
        }}>
          
          {/* LEFT COLUMN: Scanner Card */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', margin: '0 0 1.25rem 0', textAlign: 'center' }}>
              Upload Image
            </h2>

            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '220px', // Hard-lock the height of the container
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              marginBottom: '1.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              
              {previewUrl ? (
                <>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      maxHeight: '180px', // Keep the image strictly constrained
                      objectFit: 'contain', // Ensure the whole pill/box is visible without cropping
                      padding: '1rem',
                      opacity: isScanning ? 0.5 : 1 
                    }} 
                  />
                  {/* The HUD Laser Animation */}
                  {isScanning && <div className="scanner-laser" />}
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📸</span>
                  <span style={{ fontWeight: '500', color: '#cbd5e1' }}>Click to upload</span>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>PNG, JPG up to 5MB</div>
                </div>
              )}
            </label>

            <button 
              onClick={handleScan}
              disabled={!selectedFile || isScanning}
              style={{
                width: '100%',
                padding: '1rem',
                background: (!selectedFile || isScanning) ? '#1e293b' : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                color: (!selectedFile || isScanning) ? '#64748b' : 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: (!selectedFile || isScanning) ? 'not-allowed' : 'pointer',
                boxShadow: (!selectedFile || isScanning) ? 'none' : '0 4px 15px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {isScanning ? 'Analyzing Details...' : 'Scan Medication'}
            </button>
          </div>

          {/* RIGHT COLUMN: AI Analysis & Chatbox (or Idle Feature Cards) */}
          <div style={{ height: '100%' }}>
            
            {identifiedDrug ? (
              <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '9999px',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>✓</span> {identifiedDrug}
                  </div>
                  <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>Active Medical Profile</span>
                </div>
                <Chatbox drugName={identifiedDrug} />
              </div>
            ) : (
              /* IDLE STATE: 3 Feature Cards to fill empty space */
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem', 
                animation: 'fadeIn 0.5s ease-in-out' 
              }}>
                <FeatureCard icon="👁️" title="Multimodal Vision" desc="Zero-shot identification of loose pills and blister packs via Gemini AI." />
                <FeatureCard icon="🏛️" title="openFDA Grounding" desc="Cross-references the identified generic name with government databases." />
                <FeatureCard icon="💬" title="Interactive Medical Chat" desc="Ask follow-up questions regarding dosage, warnings, and side effects." />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateX(10px); }
            to { opacity: 1; transform: translateX(0); }
          }
          /* High-Tech Laser Sweep Animation */
          .scanner-laser {
            position: absolute;
            left: 0;
            width: 100%;
            height: 3px;
            background: #60a5fa;
            box-shadow: 0 0 15px 5px rgba(96, 165, 250, 0.5);
            animation: sweep 2s ease-in-out infinite;
            z-index: 10;
          }
          @keyframes sweep {
            0% { top: 0%; }
            50% { top: 98%; }
            100% { top: 0%; }
          }
        `}
      </style>
    </div>
  );
}

// Reusable micro-component for the idle state
function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem'
    }}>
      <div style={{ fontSize: '2rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem', borderRadius: '12px' }}>
        {icon}
      </div>
      <div>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: '#e2e8f0' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.4' }}>{desc}</p>
      </div>
    </div>
  );
}