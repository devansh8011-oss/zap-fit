import React from 'react';
import { isFirebaseConfigured, logout } from '../services/firebase';

export default function Navbar({
  theme,
  toggleTheme,
  currentTab,
  setCurrentTab,
  user,
  userProfile,
  openAuthModal,
  openSetupGuide,
  openWorkoutModal,
  openAIModal
}) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <div 
          className="brand-logo" 
          style={{ cursor: 'pointer' }}
          onClick={() => setCurrentTab('recommendation')}
        >
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="brand-name">ZAP FIT</span>
              <span className="brand-badge">AI Nutrition</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '-2px' }}>
              Post-Workout Meal Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <button 
            className={`nav-btn ${currentTab === 'recommendation' ? 'active' : ''}`}
            onClick={() => setCurrentTab('recommendation')}
          >
            <span>🎯</span>
            <span>AI Match</span>
          </button>

          <button 
            className={`nav-btn ${currentTab === 'all-meals' ? 'active' : ''}`}
            onClick={() => setCurrentTab('all-meals')}
          >
            <span>🥗</span>
            <span>75 Gym Meals</span>
          </button>

          <button 
            className={`nav-btn ${currentTab === 'pantry' ? 'active' : ''}`}
            onClick={() => setCurrentTab('pantry')}
          >
            <span>🥑</span>
            <span>Pantry Match</span>
          </button>

          <button 
            className={`nav-btn ${currentTab === 'supplements' ? 'active' : ''}`}
            onClick={() => setCurrentTab('supplements')}
          >
            <span>💊</span>
            <span>Supplements</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Quick AI Assistant Button */}
          <button 
            className="btn-outline"
            style={{ padding: '7px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={openAIModal}
            title="Ask ZAP FIT AI Nutrition Copilot"
          >
            <span style={{ color: 'var(--accent-orange)' }}>✨</span>
            <span style={{ fontWeight: 600 }}>Ask AI</span>
          </button>

          {/* Database & Cloud Config Indicator */}
          <button 
            onClick={openSetupGuide}
            className={`badge ${isFirebaseConfigured ? 'badge-ok' : 'badge-warn'}`}
            style={{ cursor: 'pointer', padding: '6px 10px', border: 'none' }}
            title="Click to view Firebase & Groq connection guide"
          >
            <span style={{ 
              width: '7px', 
              height: '7px', 
              borderRadius: '50%', 
              backgroundColor: isFirebaseConfigured ? 'var(--badge-ok)' : 'var(--badge-warn)',
              display: 'inline-block' 
            }} />
            <span>{isFirebaseConfigured ? 'Firebase Connected' : 'Demo Mode (Setup)'}</span>
          </button>

          {/* Theme Switcher Toggle (Light default, Black/Dark mode option) */}
          <button 
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              // Moon Icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            ) : (
              // Sun Icon
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            )}
          </button>

          {/* User Profile / Auth Pill */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'var(--surface)', 
                  border: '1px solid var(--surface-border)',
                  padding: '4px 10px 4px 6px',
                  borderRadius: '999px',
                  cursor: 'pointer'
                }}
                onClick={openAuthModal}
              >
                <div style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-lime)',
                  color: '#121E06',
                  fontWeight: 800,
                  fontSize: '12px',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {user.displayName ? user.displayName.split(' ')[0] : 'Athlete'}
                </span>
              </div>
              <button 
                className="icon-btn" 
                style={{ width: '32px', height: '32px' }}
                onClick={logout} 
                title="Sign out"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={openAuthModal} style={{ padding: '8px 16px', fontSize: '13px' }}>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
