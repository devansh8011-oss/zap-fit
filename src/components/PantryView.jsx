import React, { useState } from 'react';
import { PANTRY_COMMON_ITEMS, ALL_MEALS, filterMealsBySafety } from '../data/database';

export default function PantryView({
  userProfile,
  pantryItems,
  onUpdatePantry,
  openMealDetail
}) {
  const [newIngredient, setNewIngredient] = useState('');
  const [useSoon, setUseSoon] = useState(new Set(['Spinach', 'Paneer']));

  // Toggle ingredient existence in pantry
  const toggleItem = (item) => {
    let updated;
    if (pantryItems.includes(item)) {
      updated = pantryItems.filter(i => i !== item);
    } else {
      updated = [...pantryItems, item];
    }
    onUpdatePantry(updated);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newIngredient.trim()) return;
    const item = newIngredient.trim();
    if (!pantryItems.includes(item)) {
      onUpdatePantry([...pantryItems, item]);
    }
    setNewIngredient('');
  };

  const toggleUseSoon = (item) => {
    const next = new Set(useSoon);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setUseSoon(next);
  };

  // Find meals from the 75-meal database matching available pantry items
  const safeMeals = filterMealsBySafety(ALL_MEALS, userProfile);
  
  const pantryRankedMeals = safeMeals.map(meal => {
    const mealIngs = meal.ingredients || [];
    const matched = mealIngs.filter(ing => 
      pantryItems.some(p => ing.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(ing.toLowerCase()))
    );
    const missing = mealIngs.filter(ing => !matched.includes(ing));
    const usesExpiring = mealIngs.some(ing => 
      Array.from(useSoon).some(u => ing.toLowerCase().includes(u.toLowerCase()))
    );

    return {
      ...meal,
      matchedCount: matched.length,
      totalCount: mealIngs.length,
      missing,
      usesExpiring,
      percentage: mealIngs.length > 0 ? Math.round((matched.length / mealIngs.length) * 100) : 50
    };
  }).filter(m => m.matchedCount > 0);

  // Sort: highest matched count and uses expiring first
  pantryRankedMeals.sort((a, b) => {
    if (a.usesExpiring && !b.usesExpiring) return -1;
    if (!a.usesExpiring && b.usesExpiring) return 1;
    return b.percentage - a.percentage;
  });

  return (
    <div style={{ display: 'grid', gap: '24px', marginTop: '16px' }}>
      
      {/* Header Banner */}
      <div className="card card-deep">
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-lime)' }}>
          Pantry Match Intelligence
        </span>
        <h2 style={{ fontSize: '26px', color: 'var(--on-deep)', marginTop: '4px' }}>
          Cook with what is already in your kitchen.
        </h2>
        <p style={{ color: 'var(--ink-faint)', fontSize: '14px', maxWidth: '65ch', marginTop: '4px' }}>
          Confirm raw staples in your fridge and pantry. Chef Didi handles all boiling, fresh batters, and cooking from scratch in your kitchen.
        </p>

        {useSoon.size > 0 && (
          <div style={{ 
            marginTop: '14px', 
            background: 'rgba(255, 255, 255, 0.08)', 
            padding: '10px 14px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}>
            <span>🌱</span>
            <span>Prioritizing items marked <b>Use Soon</b>: {Array.from(useSoon).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Pantry Manager */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Your Confirmed Kitchen Inventory</h3>

        {/* Add custom item form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input 
            type="text" 
            placeholder="Add an ingredient (e.g. Greek yogurt, Chia seeds)..."
            value={newIngredient}
            onChange={e => setNewIngredient(e.target.value)}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1.5px solid var(--surface-border)',
              background: 'var(--surface)'
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '9px 16px' }}>
            + Add
          </button>
        </form>

        {/* Common items selector chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {PANTRY_COMMON_ITEMS.map(item => {
            const hasItem = pantryItems.includes(item);
            const isExpiring = useSoon.has(item);

            return (
              <div 
                key={item} 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  background: hasItem ? 'var(--bg-subtle)' : 'var(--surface)',
                  border: `1.5px solid ${hasItem ? 'var(--accent-lime-dark)' : 'var(--surface-border)'}`,
                  borderRadius: '999px',
                  padding: '4px 6px 4px 10px',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: hasItem ? 600 : 400
                }}
              >
                <span 
                  onClick={() => toggleItem(item)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>{hasItem ? '✓' : '+'}</span>
                  <span>{item}</span>
                </span>

                {hasItem && (
                  <button 
                    onClick={() => toggleUseSoon(item)}
                    style={{ 
                      fontSize: '10.5px', 
                      background: isExpiring ? 'var(--accent-orange)' : 'var(--surface-border)', 
                      color: isExpiring ? '#fff' : 'var(--ink-muted)',
                      borderRadius: '999px',
                      padding: '2px 7px',
                      fontWeight: 700
                    }}
                    title="Mark as expiring soon to prioritize in recipe matching"
                  >
                    {isExpiring ? 'Use Soon' : 'Mark'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Matched Meals from the 75-meal library */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '20px' }}>
            Meals You Can Cook Now ({pantryRankedMeals.length} found)
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
            Ranked by % ingredients confirmed at home
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {pantryRankedMeals.slice(0, 9).map(meal => (
            <div 
              key={meal.id} 
              className="card card-hover" 
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              onClick={() => openMealDetail(meal)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <span className="badge badge-lime">
                    {meal.matchedCount}/{meal.totalCount} Ingredients ({meal.percentage}%)
                  </span>
                  {meal.usesExpiring && (
                    <span className="badge badge-warn">🌱 Uses Expiring</span>
                  )}
                </div>

                <h4 style={{ fontSize: '17px', marginTop: '10px', lineHeight: 1.25 }}>
                  {meal.name}
                </h4>

                <div style={{ display: 'flex', gap: '12px', fontSize: '13px', marginTop: '6px', color: 'var(--ink-secondary)' }}>
                  <span><b>{meal.protein}g</b> Protein</span>
                  <span><b>{meal.carbs}g</b> Carbs</span>
                  <span><b>{meal.calories}</b> kcal</span>
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginTop: '8px' }}>
                  <b>Ingredients:</b> {meal.ingredients?.slice(0, 4).join(', ')}...
                </p>

                {meal.missing.length > 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--accent-orange)', marginTop: '4px' }}>
                    Missing: {meal.missing.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{meal.category}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-lime-dark)' }}>
                  View Recipe →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
