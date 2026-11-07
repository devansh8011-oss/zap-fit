import React, { useState } from 'react';
import { SUPPLEMENTS } from '../data/database';

export default function SupplementsGuide() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Supplements', 'Whole Foods', 'Recovery Gear'];

  const filtered = SUPPLEMENTS.filter(s => 
    activeCategory === 'All' ? true : s.category === activeCategory
  );

  return (
    <div style={{ display: 'grid', gap: '20px', marginTop: '16px' }}>
      
      {/* Header */}
      <div className="card card-deep">
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-lime)' }}>
          Sheet 6 Performance Guide
        </span>
        <h2 style={{ fontSize: '26px', color: 'var(--on-deep)', marginTop: '4px' }}>
          Supplements, Performance Whole Foods & Recovery
        </h2>
        <p style={{ color: 'var(--ink-faint)', fontSize: '14px', maxWidth: '65ch', marginTop: '4px' }}>
          Science-backed timing, active nutrient compounds, and exact dosages to pair with your post-workout meals.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`btn-outline ${activeCategory === cat ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: '13px',
              background: activeCategory === cat ? 'var(--brand-deep)' : 'var(--surface)',
              color: activeCategory === cat ? 'var(--on-deep)' : 'var(--ink)',
              borderColor: activeCategory === cat ? 'var(--brand-deep)' : 'var(--surface-border)'
            }}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {filtered.map((item, idx) => (
          <div key={idx} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="badge badge-lime">{item.category}</span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
                {item.optimal_timing}
              </span>
            </div>

            <h3 style={{ fontSize: '18px', marginTop: '6px' }}>{item.name}</h3>

            <div style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '10px', margin: '10px 0', fontSize: '12.5px' }}>
              <span style={{ color: 'var(--ink-muted)' }}>Active Nutrients: </span>
              <b style={{ color: 'var(--ink)' }}>{item.active_nutrients}</b>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
              {item.fitness_benefits}
            </p>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
              <span style={{ color: 'var(--ink-muted)' }}>Recommended Dosage:</span>
              <b className="mono" style={{ color: 'var(--accent-orange)' }}>{item.recommended_dosage}</b>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
