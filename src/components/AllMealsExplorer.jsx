import React, { useState } from 'react';
import { ALL_MEALS, filterMealsBySafety } from '../data/database';

export default function AllMealsExplorer({ userProfile, openMealDetail }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWorkout, setFilterWorkout] = useState('All');

  const categories = ['All', 'Vegan', 'Vegetarian', 'Non-Vegetarian', 'Jain', 'Allergen-Free'];

  // Apply deterministic safety filter first
  const safeMeals = filterMealsBySafety(ALL_MEALS, userProfile);

  // Apply UI filters
  const filteredMeals = safeMeals.filter(m => {
    // Category match
    if (selectedCategory !== 'All') {
      if (!m.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
        return false;
      }
    }

    // Workout type match
    if (filterWorkout !== 'All') {
      if (!m.recommended_post_workout.toLowerCase().includes(filterWorkout.toLowerCase())) {
        return false;
      }
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchIng = m.ingredients && m.ingredients.some(i => i.toLowerCase().includes(q));
      const matchBenefits = m.benefits && m.benefits.toLowerCase().includes(q);
      if (!matchName && !matchIng && !matchBenefits) return false;
    }

    return true;
  });

  return (
    <div style={{ display: 'grid', gap: '20px', marginTop: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            Curated Performance Library
          </span>
          <h2 style={{ fontSize: '26px' }}>
            All 75 Post-Workout Gym Meals
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-secondary)', marginTop: '2px' }}>
            Full database from your multi-sheet library with macro splits and targeted post-workout types.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ minWidth: '260px' }}>
          <input 
            type="text" 
            placeholder="Search meal, protein, or ingredient..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: '12px',
              border: '1.5px solid var(--surface-border)',
              background: 'var(--surface)',
              fontSize: '13.5px'
            }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`btn-outline ${selectedCategory === cat ? 'active' : ''}`}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              background: selectedCategory === cat ? 'var(--brand-deep)' : 'var(--surface)',
              color: selectedCategory === cat ? 'var(--on-deep)' : 'var(--ink)',
              borderColor: selectedCategory === cat ? 'var(--brand-deep)' : 'var(--surface-border)'
            }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'All' ? `All (${safeMeals.length})` : cat}
          </button>
        ))}
      </div>

      {/* Workout Type Secondary Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12.5px' }}>
        <span style={{ fontWeight: 600, color: 'var(--ink-muted)' }}>Workout Type:</span>
        {['All', 'Hypertrophy', 'Strength', 'Leg Day', 'Endurance', 'HIIT', 'Fat Loss', 'Mobility'].map(wt => (
          <button
            key={wt}
            onClick={() => setFilterWorkout(wt)}
            style={{
              background: filterWorkout === wt ? 'var(--accent-lime-soft)' : 'transparent',
              color: filterWorkout === wt ? 'var(--accent-lime-dark)' : 'var(--ink-muted)',
              border: `1px solid ${filterWorkout === wt ? 'var(--accent-lime)' : 'var(--surface-border)'}`,
              borderRadius: '999px',
              padding: '3px 10px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {wt}
          </button>
        ))}
      </div>

      {/* Meals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredMeals.map(meal => (
          <div 
            key={meal.id} 
            className="card card-hover" 
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            onClick={() => openMealDetail(meal)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--ink-secondary)' }}>
                  {meal.category}
                </span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>
                  {meal.id}
                </span>
              </div>

              <h4 style={{ fontSize: '18px', marginTop: '10px', lineHeight: 1.25 }}>
                {meal.name}
              </h4>

              <p style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                {meal.recommended_post_workout}
              </p>

              {/* Macro Bar */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '4px', 
                background: 'var(--bg-subtle)', 
                borderRadius: '12px', 
                padding: '8px 4px',
                textAlign: 'center',
                margin: '12px 0'
              }}>
                <div>
                  <b className="mono" style={{ fontSize: '15px', color: 'var(--accent-lime-dark)' }}>{meal.protein}g</b>
                  <p style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>Protein</p>
                </div>
                <div>
                  <b className="mono" style={{ fontSize: '15px' }}>{meal.carbs}g</b>
                  <p style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>Carbs</p>
                </div>
                <div>
                  <b className="mono" style={{ fontSize: '15px' }}>{meal.fat}g</b>
                  <p style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>Fat</p>
                </div>
                <div>
                  <b className="mono" style={{ fontSize: '15px' }}>{meal.calories}</b>
                  <p style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>kcal</p>
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
                {meal.benefits}
              </p>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-ok" style={{ fontSize: '11px' }}>
                Allergen Verified
              </span>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>
                View Nutrition & Recipe →
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
