import React, { useState } from 'react';
import { askAIAssistant } from '../services/groqAI';

export default function AIAssistantModal({ isOpen, onClose, userProfile, workout, pantryItems }) {
  if (!isOpen) return null;

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi ${userProfile.name?.split(' ')[0] || 'there'}! I'm your ZAP FIT AI Nutrition Copilot. I'm actively loaded with your ${workout.type} (${workout.min} min) session and your confirmed kitchen pantry. How can I help you refuel?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "What can I cook with paneer and spinach?",
    "Why high carbs after today's workout?",
    "How much protein do I need right now?",
    "Can you suggest a quick 10-minute high-protein snack?"
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askAIAssistant(query, {
        user: userProfile,
        workout,
        pantry: pantryItems
      });
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm having trouble connecting right now, but remember to prioritize 25-35g protein and complex carbs after intense training!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', display: 'flex', flexDirection: 'column', height: '80vh' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              background: 'var(--brand-deep)', 
              color: 'var(--accent-lime)',
              display: 'grid',
              placeItems: 'center'
            }}>
              ⚡
            </div>
            <div>
              <h3 style={{ fontSize: '18px' }}>ZAP FIT AI Copilot</h3>
              <span style={{ fontSize: '11px', color: 'var(--badge-ok)', fontWeight: 600 }}>
                ● Grounded in your profile & workout
              </span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              style={{
                maxWidth: '85%',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'var(--brand-deep)' : 'var(--bg-subtle)',
                color: m.role === 'user' ? 'var(--on-deep)' : 'var(--ink)',
                padding: '12px 16px',
                borderRadius: '18px',
                borderBottomRightRadius: m.role === 'user' ? '4px' : '18px',
                borderBottomLeftRadius: m.role === 'assistant' ? '4px' : '18px',
                fontSize: '14px',
                lineHeight: 1.45
              }}
            >
              {m.text}
            </div>
          ))}

          {loading && (
            <div style={{ 
              alignSelf: 'flex-start', 
              background: 'var(--bg-subtle)', 
              padding: '10px 14px', 
              borderRadius: '16px', 
              fontSize: '13px',
              color: 'var(--ink-muted)'
            }}>
              Groq AI is thinking...
            </div>
          )}
        </div>

        {/* Quick prompt chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              style={{
                fontSize: '11.5px',
                whiteSpace: 'nowrap',
                background: 'var(--bg-subtle)',
                color: 'var(--ink-secondary)',
                borderRadius: '999px',
                padding: '4px 10px',
                border: '1px solid var(--surface-border)'
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{ display: 'flex', gap: '8px', paddingTop: '10px' }}
        >
          <input 
            type="text" 
            placeholder="Ask about ingredients, substitutes, macros..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1.5px solid var(--surface-border)',
              background: 'var(--surface)',
              fontSize: '14px'
            }}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !input.trim()}
            style={{ padding: '10px 18px' }}
          >
            Send
          </button>
        </form>

      </div>
    </div>
  );
}
