import { useState } from 'react';
import axios from 'axios';

// 1. Helper function to parse the source tags and strip them from the text
const parseBotResponse = (text) => {
  let source = null;
  let cleanText = text;

  if (text.startsWith("")) {
    source = 'fda';
    cleanText = text.replace("", "").trim();
  } else if (text.startsWith("[Source: General AI Knowledge]")) {
    source = 'ai';
    cleanText = text.replace("", "").trim();
  } else if (text.startsWith("")) {
    source = 'hybrid';
    cleanText = text.replace("", "").trim();
  }

  return { source, cleanText };
};

export default function Chatbox({ drugName }) {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userMessage = { role: "user", text: question };
    setChatHistory((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/chat/", {
        drug_name: drugName,
        question: userMessage.text
      });
      
      const rawAnswer = response.data.answer;
      let safeText = "";
      
      if (typeof rawAnswer === 'string') {
        safeText = rawAnswer;
      } else if (Array.isArray(rawAnswer)) {
        safeText = rawAnswer[0]?.text || "Could not read text from AI array.";
      } else {
        safeText = rawAnswer?.content || JSON.stringify(rawAnswer);
      }
      
      const aiMessage = { role: "ai", text: safeText };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage = { role: "ai", text: "Error connecting to the AI. Please try again." };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
      <div style={{ 
        maxHeight: '400px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        paddingRight: '0.5rem'
      }}>
        {chatHistory.length === 0 && (
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center' }}>
            Ask a medical question about {drugName}...
          </p>
        )}
        
        {chatHistory.map((msg, index) => {
          const isBot = msg.role === 'ai';
          const { source, cleanText } = isBot ? parseBotResponse(msg.text) : { source: null, cleanText: msg.text };

          return (
            <div key={index} style={{ 
              alignSelf: isBot ? 'flex-start' : 'flex-end',
              backgroundColor: isBot ? '#1e293b' : '#0ea5e9',
              color: '#f8fafc',
              padding: '1rem',
              borderRadius: '12px',
              maxWidth: '85%',
              lineHeight: '1.5',
              border: isBot ? '1px solid #334155' : 'none',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              
              {/* 2. Dynamic Source Badges Rendered Above Text */}
              {source === 'fda' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 'bold', color: '#34d399', backgroundColor: 'rgba(6, 78, 59, 0.4)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(6, 78, 59, 0.5)', width: 'fit-content' }}>
                  <span>🛡️</span> FDA Verified Record
                </div>
              )}
              
              {source === 'ai' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 'bold', color: '#c084fc', backgroundColor: 'rgba(88, 28, 135, 0.4)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(88, 28, 135, 0.5)', width: 'fit-content' }}>
                  <span>✨</span> AI General Knowledge
                </div>
              )}

              {source === 'hybrid' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 'bold', color: '#60a5fa', backgroundColor: 'rgba(30, 58, 138, 0.4)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(30, 58, 138, 0.5)', width: 'fit-content' }}>
                  <span>🔄</span> FDA + AI Context
                </div>
              )}

              {/* 3. Render the cleaned text safely preserving line breaks */}
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {cleanText}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ 
            alignSelf: 'flex-start', 
            backgroundColor: '#1e293b', 
            padding: '0.75rem 1rem', 
            borderRadius: '12px',
            color: '#94a3b8',
            border: '1px solid #334155'
          }}>
            Gemini is typing...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
        <input 
          type="text" 
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="e.g., What are the side effects?"
          style={{ 
            flex: 1,
            padding: '0.75rem', 
            background: '#0f172a', 
            border: '1px solid #475569',
            borderRadius: '8px',
            color: '#f8fafc',
            outline: 'none'
          }}
        />
        <button 
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: (loading || !question.trim()) ? '#475569' : '#0284c7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (loading || !question.trim()) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.2s'
          }}
        >
          Ask
        </button>
      </div>
    </div>
  );
}