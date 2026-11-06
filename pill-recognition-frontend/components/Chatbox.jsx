import { useState } from 'react';
import axios from 'axios';

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
      
      // --- BUG FIX: Safely parse LangChain's array output ---
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
        maxHeight: '300px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem',
        paddingRight: '0.5rem'
      }}>
        {chatHistory.length === 0 && (
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
            Ask a medical question about {drugName}...
          </p>
        )}
        
        {chatHistory.map((msg, index) => (
          <div key={index} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.role === 'user' ? '#0ea5e9' : '#334155',
            color: '#f8fafc',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            maxWidth: '85%',
            lineHeight: '1.4'
          }}>
            {msg.text}
          </div>
        ))}

        {loading && (
          <div style={{ 
            alignSelf: 'flex-start', 
            backgroundColor: '#334155', 
            padding: '0.75rem 1rem', 
            borderRadius: '12px',
            color: '#94a3b8',
            animation: 'pulse 1.5s infinite' 
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