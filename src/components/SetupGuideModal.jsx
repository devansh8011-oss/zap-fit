import React from 'react';
import { isFirebaseConfigured } from '../services/firebase';
import { isGroqConfigured } from '../services/groqAI';

export default function SetupGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '22px' }}>Firebase & Groq AI Setup Guide</h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
              Follow these simple steps to connect your own live cloud services
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Current Status Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ 
            background: isFirebaseConfigured ? 'var(--badge-ok-bg)' : 'var(--badge-warn-bg)', 
            color: isFirebaseConfigured ? 'var(--badge-ok)' : 'var(--badge-warn)',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 700 }}>Firebase Database & Auth</div>
            <div>{isFirebaseConfigured ? '✓ Configured & Active' : '● Demo Mode (Credentials Pending in .env)'}</div>
          </div>

          <div style={{ 
            background: isGroqConfigured ? 'var(--badge-ok-bg)' : 'var(--badge-warn-bg)', 
            color: isGroqConfigured ? 'var(--badge-ok)' : 'var(--badge-warn)',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 700 }}>Groq AI Inference</div>
            <div>{isGroqConfigured ? '✓ Active (Llama 3.3)' : '● Fallback Mode (Key Pending in .env)'}</div>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ display: 'grid', gap: '16px', fontSize: '13.5px', lineHeight: 1.5 }}>
          
          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '14px' }}>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
              Step 1: Create Firebase Project & Get Config
            </b>
            <ol style={{ paddingLeft: '18px', color: 'var(--ink-secondary)', display: 'grid', gap: '4px' }}>
              <li>Open <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-orange)' }}>Firebase Console</a> and click <b>Add project</b>.</li>
              <li>Add a Web App (<code>&lt;/&gt;</code> icon) and copy the <code>firebaseConfig</code> values into your <code>.env</code> file.</li>
            </ol>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '14px' }}>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
              Step 2: Enable Authentication (Google & Email)
            </b>
            <ol style={{ paddingLeft: '18px', color: 'var(--ink-secondary)', display: 'grid', gap: '4px' }}>
              <li>In Firebase Console, go to <b>Build &gt; Authentication &gt; Sign-in method</b>.</li>
              <li>Enable <b>Google</b> and <b>Email/Password</b> providers.</li>
            </ol>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '14px' }}>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
              Step 3: Create Firestore Database
            </b>
            <ol style={{ paddingLeft: '18px', color: 'var(--ink-secondary)', display: 'grid', gap: '4px' }}>
              <li>In Firebase Console, go to <b>Build &gt; Firestore Database</b> and click <b>Create database</b>.</li>
              <li>Select <b>Start in test mode</b> for quick exhibition access and click <b>Create</b>.</li>
            </ol>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '14px' }}>
            <b style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
              Step 4: Get a Free Groq API Key
            </b>
            <ol style={{ paddingLeft: '18px', color: 'var(--ink-secondary)', display: 'grid', gap: '4px' }}>
              <li>Go to <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-orange)' }}>Groq Console</a> (Instant & Free).</li>
              <li>Click <b>Create API Key</b>, copy the key (starts with <code>gsk_</code>), and set <code>VITE_GROQ_API_KEY=gsk_...</code> in your <code>.env</code> file.</li>
            </ol>
          </div>

        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose}>
            Got It!
          </button>
        </div>

      </div>
    </div>
  );
}
