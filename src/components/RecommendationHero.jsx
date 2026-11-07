import React from 'react';

export default function RecommendationHero({
  workout,
  userProfile,
  recommendation,
  loadingAI,
  openWorkoutModal,
  openMealDetail,
  onLogMeal
}) {
  const meal = recommendation?.topMeal;
  const matchScore = meal?.matchScore || 94;
  const isGroq = recommendation?.source?.includes('Groq');

  // Compute ring gradient angle based on score
  const ringGradient = `conic-gradient(var(--accent-lime) ${matchScore * 3.6}deg, rgba(255, 255, 255, 0.15) 0deg)`;

  return (
    <div style={{ display: 'grid', gap: '24px', marginTop: '16px' }}>
      {/* Top Banner: Workout Session Context & Macro Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* Workout Context Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)' }}>
                Active Training Context
              </span>
              <span className="badge badge-lime">Logged Session</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: 'var(--accent-lime-soft)', 
                color: 'var(--accent-lime-dark)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '20px'
              }}>
                💪
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{workout.type}</h3>
                <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
                  {workout.focus} · <span className="mono" style={{ fontWeight: 600 }}>{workout.min} mins</span> · {workout.int} Intensity
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button className="btn-outline" style={{ fontSize: '12.5px', padding: '6px 14px' }} onClick={openWorkoutModal}>
              ✏️ Log / Change Workout
            </button>
          </div>
        </div>

        {/* Daily Nutrition Tracker Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)' }}>
              Today's Nutrition Tracker
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted)' }}>
              Goal: {userProfile.goal}
            </span>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            {/* Protein bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>Protein</span>
                <span className="mono">{userProfile.currentProtein} / {userProfile.dailyTargetProtein} g</span>
              </div>
              <div className="bar-track">
                <div 
                  className="bar-fill" 
                  style={{ width: `${Math.min(100, (userProfile.currentProtein / userProfile.dailyTargetProtein) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Carbs bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>Carbohydrates</span>
                <span className="mono">{userProfile.currentCarbs} / {userProfile.dailyTargetCarbs} g</span>
              </div>
              <div className="bar-track">
                <div 
                  className="bar-fill" 
                  style={{ 
                    width: `${Math.min(100, (userProfile.currentCarbs / userProfile.dailyTargetCarbs) * 100)}%`,
                    backgroundColor: 'var(--accent-orange)'
                  }} 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: 'var(--ink-muted)' }}>
            <span>Remaining today: <b className="mono" style={{ color: 'var(--ink)' }}>{userProfile.dailyTargetProtein - userProfile.currentProtein}g P</b></span>
            <span>Meals logged: <b className="mono" style={{ color: 'var(--ink)' }}>{userProfile.mealsCount} of 4</b></span>
          </div>
        </div>

      </div>

      {/* Main AI Meal Recommendation Hero Card */}
      {loadingAI ? (
        <div className="card card-deep" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⚡</div>
          <h3 style={{ fontSize: '22px', marginTop: '14px', color: 'var(--on-deep)' }}>
            Groq AI is analyzing your workout & pantry...
          </h3>
          <p style={{ color: 'var(--ink-faint)', fontSize: '14px', marginTop: '6px' }}>
            Matching against 75 gym meals, post-workout glycogen refill targets, and leucine thresholds.
          </p>
        </div>
      ) : meal ? (
        <div className="card card-deep" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-lime">
                  ⚡ TOP AI RECOMMENDATION
                </span>
                <span style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>
                  {recommendation?.source || 'Groq AI'}
                </span>
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', lineHeight: 1.1, color: 'var(--on-deep)' }}>
                {meal.name}
              </h2>
              <p style={{ color: 'var(--accent-lime)', fontSize: '14.5px', fontWeight: 600, marginTop: '4px' }}>
                {meal.summaryHeadline || `Optimized for ${workout.type} recovery`}
              </p>
            </div>

            {/* Circular Match Percentage Pill */}
            <div className="match-ring" style={{ background: ringGradient }}>
              <div className="match-ring-inner">
                <span style={{ fontSize: '18px', color: 'var(--accent-lime)' }}>{matchScore}%</span>
                <span style={{ fontSize: '8px', letterSpacing: '0.08em', color: 'var(--ink-faint)' }}>MATCH</span>
              </div>
            </div>
          </div>

          {/* Plate Visual & Macro Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '24px', 
            alignItems: 'center',
            margin: '24px 0' 
          }}>
            {/* Visual Plate */}
            <div style={{ 
              maxWidth: '240px', 
              margin: '0 auto', 
              position: 'relative' 
            }}>
              <div className="plate-art" style={{
                background: 'radial-gradient(circle at 50% 50%, #E9D9B5 0 58%, #FFFFFF 59% 68%, #DCE0D6 69% 70%, transparent 71%)',
                padding: '16px'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #F6F1E4 0 25%, #3E7B3A 26% 50%, #D2492F 51% 75%, transparent 76%)'
                }} />
              </div>
            </div>

            {/* Nutrition Breakdown Grid */}
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '8px', 
                background: 'rgba(255, 255, 255, 0.07)', 
                borderRadius: '16px', 
                padding: '14px',
                textAlign: 'center'
              }}>
                <div>
                  <span className="mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-lime)' }}>{meal.protein}g</span>
                  <p style={{ fontSize: '11px', color: 'var(--ink-faint)', marginTop: '2px' }}>Protein</p>
                </div>
                <div>
                  <span className="mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-orange)' }}>{meal.carbs}g</span>
                  <p style={{ fontSize: '11px', color: 'var(--ink-faint)', marginTop: '2px' }}>Carbs</p>
                </div>
                <div>
                  <span className="mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--on-deep)' }}>{meal.fat}g</span>
                  <p style={{ fontSize: '11px', color: 'var(--ink-faint)', marginTop: '2px' }}>Fat</p>
                </div>
                <div>
                  <span className="mono" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--on-deep)' }}>{meal.calories}</span>
                  <p style={{ fontSize: '11px', color: 'var(--ink-faint)', marginTop: '2px' }}>Calories</p>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--on-deep)' }}>
                  Diet: {meal.category}
                </span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--on-deep)' }}>
                  {meal.recommended_post_workout}
                </span>
                <span className="badge badge-ok">
                  🛡️ Allergen Safe: Zero {userProfile.allergies.join(', ') || 'Conflicts'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Explainability Section */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '16px', 
            padding: '18px',
            marginTop: '16px' 
          }}>
            <h4 style={{ fontSize: '14px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-lime)', marginBottom: '10px' }}>
              Why ZAP FIT AI Picked This Meal
            </h4>
            
            <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
              {(meal.aiReasons || []).map((reason, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-lime)' }}>✓</span>
                  <span style={{ color: 'var(--on-deep)' }}>{reason}</span>
                </div>
              ))}
            </div>

            {/* Why Not 100% Honest Feedback */}
            {meal.not100Reason && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}>
                <span style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>Why isn't this 100%? </span>
                <span style={{ color: 'var(--ink-faint)' }}>{meal.not100Reason}</span>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px' }}>
            <button className="btn-primary" onClick={() => openMealDetail(meal)}>
              📖 View Recipe & Ingredients
            </button>

            <button 
              className="btn-outline" 
              style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--on-deep)', borderColor: 'rgba(255,255,255,0.2)' }}
              onClick={() => onLogMeal(meal)}
            >
              ✓ I Cooked & Ate This
            </button>
          </div>

        </div>
      ) : null}
    </div>
  );
}
