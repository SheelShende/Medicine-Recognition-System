import { useState, useEffect } from 'react';
import axios from 'axios';

// 1. The new Streaming component that creates the typewriter effect
const StreamingText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let currentIndex = 0;
    // 15ms delay creates a smooth, fast streaming effect similar to Gemini/ChatGPT
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, currentIndex));
      currentIndex++;
      if (currentIndex > text.length) {
        clearInterval(intervalId);
      }
    }, 15);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [text]);

  return <>{displayedText}</>;
};

// 2. Helper function for source badges
const parseBotResponse = (text) => {
  let source = null;
  let cleanText = text;

  if (text.startsWith("")) {
    source = 'fda';
    cleanText = text.replace("", "").trim();
  } else if (text.startsWith("")) {
    source = 'ai';
    cleanText = text.replace("", "").trim();
  } else if (text.startsWith("[Source: Hybrid FDA + AI]")) {
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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '450px', 
      marginTop: '1.5rem',
      background: 'rgba(15, 23, 42, 0.4)', 
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
      overflow: 'hidden'
    }}>
      
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.25rem',
        padding: '1.5rem',
        scrollBehavior: 'smooth'
      }}>
        {chatHistory.length === 0 && (
          <div style={{ 
            margin: 'auto', 
            textAlign: 'center', 
            color: '#64748b', 
            fontSize: '0.95rem',
            background: 'rgba(255,255,255,0.03)',
            padding: '1rem 1.5rem',
            borderRadius: '100px',
            border: '1px solid rgba(255,255,255,0.02)'
          }}>
            Ask a medical question about <span style={{color: '#e2e8f0', fontWeight: '500'}}>{drugName}</span>
          </div>
        )}
        
        {chatHistory.map((msg, index) => {
          const isBot = msg.role === 'ai';
          const { source, cleanText } = isBot ? parseBotResponse(msg.text) : { source: null, cleanText: msg.text };

          return (
            <div key={index} style={{ 
              alignSelf: isBot ? 'flex-start' : 'flex-end',
              background: isBot ? 'rgba(30, 41, 59, 0.7)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              backdropFilter: isBot ? 'blur(10px)' : 'none',
              color: isBot ? '#e2e8f0' : '#ffffff',
              padding: '1rem 1.25rem',
              borderRadius: isBot ? '20px 20px 20px 4px' : '20px 20px 4px 20px',
              maxWidth: '80%',
              lineHeight: '1.6',
              fontSize: '0.95rem',
              border: isBot ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
              boxShadow: isBot ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
              animation: 'chatBubbleFade 0.4s ease-out' // Smooth entry for the bubble itself
            }}>
              
              {source === 'fda' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#10b981', width: 'fit-content' }}>
                  <span style={{ fontSize: '0.9rem'}}>🛡️</span> FDA VERIFIED
                </div>
              )}
              
              {source === 'ai' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#a855f7', width: 'fit-content' }}>
                  <span style={{ fontSize: '0.9rem'}}>✨</span> AI KNOWLEDGE
                </div>
              )}

              {source === 'hybrid' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', color: '#60a5fa', width: 'fit-content' }}>
                  <span style={{ fontSize: '0.9rem'}}>🔄</span> FDA + AI CONTEXT
                </div>
              )}

              <div style={{ whiteSpace: 'pre-wrap', fontWeight: isBot ? '400' : '500' }}>
                {/* 3. Apply the streaming effect only to the AI's cleaned text */}
                {isBot ? <StreamingText text={cleanText} /> : cleanText}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ 
            alignSelf: 'flex-start', 
            background: 'rgba(30, 41, 59, 0.5)', 
            padding: '1rem 1.25rem', 
            borderRadius: '20px 20px 20px 4px',
            color: '#94a3b8',
            fontSize: '0.9rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'chatBubbleFade 0.3s ease-out'
          }}>
            <span style={{ animation: 'pulse 1.5s infinite' }}>Analyzing data...</span>
          </div>
        )}
      </div>

      <div style={{ 
        padding: '1rem', 
        background: 'rgba(15, 23, 42, 0.8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)' 
      }}>
        <div style={{
          display: 'flex',
          background: '#0f172a',
          borderRadius: '9999px', 
          padding: '0.35rem 0.35rem 0.35rem 1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        }}>
          <input 
            type="text" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Ask about side effects, dosage, etc..."
            style={{ 
              flex: 1,
              background: 'transparent', 
              border: 'none',
              color: '#f8fafc',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
          <button 
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            style={{
              padding: '0.6rem 1.5rem',
              background: (loading || !question.trim()) ? '#334155' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: (loading || !question.trim()) ? '#94a3b8' : 'white',
              border: 'none',
              borderRadius: '9999px',
              cursor: (loading || !question.trim()) ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              letterSpacing: '0.5px',
              transition: 'all 0.2s ease',
              boxShadow: (loading || !question.trim()) ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            Send
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes chatBubbleFade {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}