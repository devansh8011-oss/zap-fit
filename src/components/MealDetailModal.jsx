import React from 'react';

export default function MealDetailModal({ meal, isOpen, onClose, userProfile, pantryItems, onLogMeal }) {
  if (!isOpen || !meal) return null;

  const mealIngs = meal.ingredients || [];
  const inPantry = mealIngs.filter(ing => 
    pantryItems.some(p => ing.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(ing.toLowerCase()))
  );
  const missing = mealIngs.filter(ing => !inPantry.includes(ing));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-lime">{meal.category}</span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>{meal.id}</span>
            </div>
            <h2 style={{ fontSize: '24px', lineHeight: 1.15 }}>{meal.name}</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-muted)', marginTop: '2px' }}>
              Target: {meal.recommended_post_workout}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Nutritional Breakdown Box */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '8px', 
          background: 'var(--bg-subtle)', 
          borderRadius: '16px', 
          padding: '16px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <span className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-lime-dark)' }}>{meal.protein}g</span>
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Protein</p>
          </div>
          <div>
            <span className="mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-orange)' }}>{meal.carbs}g</span>
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Carbs</p>
          </div>
          <div>
            <span className="mono" style={{ fontSize: '22px', fontWeight: 800 }}>{meal.fat}g</span>
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Fat</p>
          </div>
          <div>
            <span className="mono" style={{ fontSize: '22px', fontWeight: 800 }}>{meal.calories}</span>
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>kcal</p>
          </div>
        </div>

        {/* Micronutrients & Benefits */}
        <div style={{ marginBottom: '18px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '8px' }}>
            Fitness & Physiological Benefits
          </h4>
          <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--ink-secondary)' }}>
            {meal.benefits}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)', alignSelf: 'center' }}>Key Minerals:</span>
            {(meal.micronutrients || []).map((m, i) => (
              <span key={i} className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--ink)' }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Safety & Allergens */}
        <div style={{ 
          background: meal.allergens_present?.length ? 'var(--badge-warn-bg)' : 'var(--badge-ok-bg)', 
          color: meal.allergens_present?.length ? 'var(--badge-warn)' : 'var(--badge-ok)',
          borderRadius: '12px',
          padding: '12px 14px',
          fontSize: '13px',
          marginBottom: '18px'
        }}>
          <b>Allergen Status: </b>
          {meal.allergens_present?.length 
            ? `Contains: ${meal.allergens_present.join(', ')}`
            : `100% Free of top allergens (Clean)`}
        </div>

        {/* Ingredients & Kitchen Pantry Checklist */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)' }}>
              Ingredients Required ({inPantry.length}/{mealIngs.length} in your pantry)
            </h4>
          </div>

          <div style={{ display: 'grid', gap: '6px' }}>
            {mealIngs.map((ing, i) => {
              const have = inPantry.includes(ing);
              return (
                <div 
                  key={i} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: have ? 'var(--bg-subtle)' : 'var(--surface)',
                    border: '1px solid var(--surface-border)',
                    fontSize: '13.5px'
                  }}
                >
                  <span style={{ fontWeight: have ? 600 : 400 }}>{ing}</span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: have ? 'var(--badge-ok)' : 'var(--accent-orange)' 
                  }}>
                    {have ? '✓ In your kitchen' : '🛒 Need to buy'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-primary" 
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => {
              onLogMeal(meal);
              onClose();
            }}
          >
            ✓ Log as Eaten (+{meal.protein}g P)
          </button>
          <button className="btn-outline" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
