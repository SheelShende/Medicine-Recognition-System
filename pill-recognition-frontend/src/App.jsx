import { useState } from 'react';
import axios from 'axios';
import Chatbox from '../components/Chatbox'; 

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
    
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
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
      width: '100vw', // Forces the gradient to touch the edges of the screen
      margin: 0,
      backgroundColor: '#020617', 
      backgroundImage: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 70%)',
      color: '#f8fafc', 
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '4rem 1.5rem',
      overflowX: 'hidden' // Prevents horizontal scrollbars
    }}>
      
      <div style={{ 
        maxWidth: '750px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        
        {/* Header Section - Added hard marginBottom to fix the overlap */}
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

        {/* Scanner Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          marginBottom: '2rem'
        }}>
          
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 1.5rem 0', textAlign: 'center' }}>
            Scanner
          </h2>

          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: '180px',
            border: '2px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            transition: 'all 0.2s ease',
            marginBottom: '1.5rem',
            overflow: 'hidden'
          }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Pill Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '200px', padding: '1rem' }} 
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📸</span>
                <span style={{ fontWeight: '500', color: '#cbd5e1' }}>Click to upload</span> or drag and drop
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
              background: (!selectedFile || isScanning) 
                ? '#1e293b' 
                : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              color: (!selectedFile || isScanning) ? '#64748b' : 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1.05rem',
              fontWeight: '600',
              letterSpacing: '0.5px',
              cursor: (!selectedFile || isScanning) ? 'not-allowed' : 'pointer',
              boxShadow: (!selectedFile || isScanning) ? 'none' : '0 4px 15px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            {isScanning ? (
              <span style={{ animation: 'pulse 1.5s infinite' }}>Analyzing Image...</span>
            ) : 'Scan Medication'}
          </button>
        </div>

        {/* AI Analysis & Chatbox Section */}
        {identifiedDrug && (
          <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 1rem 0' }}>AI Analysis</h2>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                fontSize: '1.05rem',
                fontWeight: '700',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)'
              }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span>
                Identified: {identifiedDrug}
              </div>
            </div>

            <Chatbox drugName={identifiedDrug} />
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}