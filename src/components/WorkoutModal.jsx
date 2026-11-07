import React, { useState } from 'react';
import { WORKOUT_STRATEGIES } from '../data/database';

export default function WorkoutModal({ isOpen, onClose, currentWorkout, onSaveWorkout }) {
  if (!isOpen) return null;

  const [type, setType] = useState(currentWorkout?.type || 'Hypertrophy / Muscle Building');
  const [focus, setFocus] = useState(currentWorkout?.focus || 'Upper Body Push');
  const [min, setMin] = useState(currentWorkout?.min || 60);
  const [intensity, setIntensity] = useState(currentWorkout?.int || 'High');

  // Match strategy from Sheet 7
  const strategy = WORKOUT_STRATEGIES.find(s => 
    s.workout_type.toLowerCase().includes(type.toLowerCase()) || 
    type.toLowerCase().includes(s.workout_type.toLowerCase())
  ) || WORKOUT_STRATEGIES[1];

  const handleSave = () => {
    onSaveWorkout({
      type,
      focus,
      min: Number(min),
      int: intensity,
      timestamp: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px' }}>Log Workout Session</h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
              ZAP FIT AI recalibrates your macro targets based on training intensity
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Workout Type Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'block', marginBottom: '8px' }}>
            Training Category
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {WORKOUT_STRATEGIES.map(s => (
              <button
                key={s.workout_type}
                className={`btn-outline ${type === s.workout_type ? 'active' : ''}`}
                style={{
                  padding: '8px 10px',
                  fontSize: '12.5px',
                  textAlign: 'center',
                  justifyContent: 'center',
                  background: type === s.workout_type ? 'var(--brand-deep)' : 'var(--surface)',
                  color: type === s.workout_type ? 'var(--on-deep)' : 'var(--ink)',
                  borderColor: type === s.workout_type ? 'var(--brand-deep)' : 'var(--surface-border)'
                }}
                onClick={() => setType(s.workout_type)}
              >
                {s.workout_type.split('/')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Preview Card (From Sheet 7 of Excel) */}
        <div style={{ background: 'var(--bg-subtle)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-orange)' }}>
              TARGET MACRO RATIO (SHEET 7)
            </span>
            <span className="mono" style={{ fontSize: '12px', fontWeight: 700 }}>
              {strategy.optimal_macro_ratio}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', margin: 0 }}>
            <b>Primary Goal:</b> {strategy.primary_goal}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
            <b>Key Nutrients:</b> {strategy.key_nutrients}
          </p>
        </div>

        {/* Focus & Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>
              Target Focus
            </label>
            <input 
              type="text" 
              value={focus}
              onChange={e => setFocus(e.target.value)}
              placeholder="e.g. Upper body, Squats, 8km run"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1.5px solid var(--surface-border)',
                background: 'var(--surface)'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                Duration
              </label>
              <span className="mono" style={{ fontSize: '13px', fontWeight: 700 }}>{min} mins</span>
            </div>
            <input 
              type="range" 
              min="15" 
              max="150" 
              step="5"
              value={min}
              onChange={e => setMin(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent-lime-dark)' }}
            />
          </div>
        </div>

        {/* Intensity */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>
            Training Intensity
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Light / Recovery', 'Moderate', 'High', 'Max Effort'].map(lvl => (
              <button
                key={lvl}
                className="btn-outline"
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  fontSize: '12px',
                  justifyContent: 'center',
                  background: intensity === lvl ? 'var(--brand-deep)' : 'var(--surface)',
                  color: intensity === lvl ? 'var(--on-deep)' : 'var(--ink)',
                  borderColor: intensity === lvl ? 'var(--brand-deep)' : 'var(--surface-border)'
                }}
                onClick={() => setIntensity(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Save CTA */}
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSave}>
          Update AI Recommendations
        </button>
      </div>
    </div>
  );
}
