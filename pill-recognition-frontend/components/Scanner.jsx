import { useState } from 'react';
import axios from 'axios';

export default function Scanner({ onScanSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send the image to your FastAPI backend
      const response = await axios.post("http://localhost:8000/scan-pill/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.data.status === "success") {
        // Pass the identified drug and FDA data back up to App.jsx
        onScanSuccess(response.data.identified_drug, response.data.medical_context);
      } else {
        setError("Could not identify the medication. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Ensure the FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        style={{ 
          padding: '0.5rem', 
          background: '#334155', 
          borderRadius: '8px', 
          color: '#f8fafc',
          border: '1px solid #475569'
        }}
      />
      <button 
        onClick={handleUpload} 
        disabled={loading}
        style={{
          padding: '0.75rem',
          backgroundColor: loading ? '#475569' : '#0284c7',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          transition: 'background 0.2s'
        }}
      >
        {loading ? 'Analyzing Image (MobileNetV2)...' : 'Scan Medication'}
      </button>
      
      {error && <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
    </div>
  );
}