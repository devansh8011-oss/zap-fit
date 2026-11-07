import React, { useState } from 'react';
import { signInWithGoogle, signInEmail, signUpEmail, isFirebaseConfigured } from '../services/firebase';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, openSetupGuide }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const user = await signInWithGoogle();
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      setError('');
      let user;
      if (mode === 'signup') {
        user = await signUpEmail(email, password, name);
      } else {
        user = await signInEmail(email, password);
      }
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = (persona) => {
    const demoUser = persona === 'aarav' ? {
      uid: 'demo-aarav',
      displayName: 'Aarav Sharma',
      email: 'aarav@gym.fit',
      goal: 'Build muscle',
      diet: 'Vegetarian',
      allergies: ['Peanuts'],
      photoURL: null
    } : {
      uid: 'demo-maya',
      displayName: 'Maya Patel',
      email: 'maya@runners.fit',
      goal: 'Improve endurance',
      diet: 'Eggetarian',
      allergies: [],
      photoURL: null
    };

    onAuthSuccess(demoUser);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '22px' }}>
              {mode === 'signin' ? 'Sign In to ZAP FIT' : 'Create Athlete Profile'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '2px' }}>
              Your preferences sync to Firestore & feed directly into Groq AI
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--badge-crit-bg)', 
            color: 'var(--badge-crit)', 
            padding: '10px 14px', 
            borderRadius: '10px', 
            fontSize: '13px', 
            marginBottom: '16px' 
          }}>
            {error}
          </div>
        )}

        {/* 1. Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '11px 16px',
            borderRadius: '12px',
            border: '1.5px solid var(--surface-border)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: '14.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginBottom: '16px'
          }}
        >
          {/* Google Color G logo */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          margin: '16px 0', 
          gap: '12px',
          color: 'var(--ink-faint)', 
          fontSize: '12px' 
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
          <span>OR CONTINUE WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        {/* 2. Email / Password Form */}
        <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: '12px' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>Full Name</label>
              <input
                type="text"
                placeholder="Aarav Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid var(--surface-border)', background: 'var(--surface)', marginTop: '4px' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>Email address</label>
            <input
              type="email"
              placeholder="athlete@gym.fit"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid var(--surface-border)', background: 'var(--surface)', marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid var(--surface-border)', background: 'var(--surface)', marginTop: '4px' }}
            />
          </div>

          <button
            type="submit"
            className="btn-deep"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
          >
            {loading ? 'Authenticating...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px' }}>
          {mode === 'signin' ? (
            <p style={{ color: 'var(--ink-muted)' }}>
              Don't have an account?{' '}
              <button 
                onClick={() => setMode('signup')} 
                style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'underline' }}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p style={{ color: 'var(--ink-muted)' }}>
              Already registered?{' '}
              <button 
                onClick={() => setMode('signin')} 
                style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'underline' }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* 3. Exhibition Demo Personas */}
        <div style={{ 
          marginTop: '20px', 
          paddingTop: '16px', 
          borderTop: '1px dashed var(--line)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            Exhibition Demo Personas (1-Click)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            <button
              className="btn-outline"
              style={{ fontSize: '12px', padding: '6px 8px', justifyContent: 'center' }}
              onClick={() => handleDemoSignIn('aarav')}
            >
              Demo: Aarav (Veg / Strength)
            </button>
            <button
              className="btn-outline"
              style={{ fontSize: '12px', padding: '6px 8px', justifyContent: 'center' }}
              onClick={() => handleDemoSignIn('maya')}
            >
              Demo: Maya (Egg / Run)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
