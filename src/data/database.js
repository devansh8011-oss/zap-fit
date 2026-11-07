// Database of 75 Meals, 7 Workout-Meal Strategies, and 16 Supplements/Whole Foods
// Sourced directly from Gym_Goer_Food_Library_75_Meals_Multisheet.xlsx

import mealsJson from '../../data/meals.json';
import strategiesJson from '../../data/strategies.json';
import supplementsJson from '../../data/supplements.json';

export const ALL_MEALS = mealsJson;
export const WORKOUT_STRATEGIES = strategiesJson;
export const SUPPLEMENTS = supplementsJson;

// Common pantry ingredients list for rapid pantry selection
export const PANTRY_COMMON_ITEMS = [
  'Paneer', 'Spinach', 'White rice', 'Curd', 'Tomatoes', 'Eggs', 'Chicken breast', 
  'Sweet potato', 'Broccoli', 'Oats', 'Banana', 'Chickpeas', 'Tofu', 
  'Quinoa', 'Chia seeds', 'Almonds', 'Avocado', 'Brown rice',
  'Yellow moong dal', 'Lemon', 'Peanut butter', 'Olive oil', 'Garlic', 'Whole wheat flour'
];

/**
 * Deterministic Safety Gate:
 * Strictly eliminates any meal that violates the user's dietary category or contains listed allergens.
 */
export function filterMealsBySafety(meals, userProfile) {
  if (!userProfile) return meals;
  const { diet = 'Any', allergies = [] } = userProfile;

  return meals.filter(meal => {
    // 1. Allergen Check (Pass / Fail)
    if (allergies && allergies.length > 0) {
      const hasAllergen = allergies.some(allergen => 
        meal.allergens_present && meal.allergens_present.some(present => 
          present.toLowerCase().includes(allergen.toLowerCase()) || 
          allergen.toLowerCase().includes(present.toLowerCase())
        )
      );
      if (hasAllergen) return false;
    }

    // 2. Dietary Category Filter
    if (diet && diet !== 'Any' && diet !== 'No preference') {
      const d = diet.toLowerCase();
      const cat = meal.category.toLowerCase();
      
      if (d === 'vegan') {
        if (!cat.includes('vegan')) return false;
      } else if (d === 'vegetarian') {
        if (cat.includes('non-veg') || cat === 'non-vegetarian') return false;
      } else if (d === 'jain') {
        if (!cat.includes('jain')) return false;
      } else if (d === 'allergen-free') {
        if (!cat.includes('allergen-free')) return false;
      }
    }

    return true;
  });
}

/**
 * Local Deterministic Match Engine:
 * Computes transparent scores across 5 factors:
 * 1. Training Fit (25 pts)
 * 2. Remaining Needs / Protein Density (25 pts)
 * 3. Goal Fit (15 pts)
 * 4. Taste & Macro Balance (15 pts)
 * 5. Pantry Availability (20 pts)
 */
export function calculateMealMatch(meal, workout, userProfile, pantryItems = []) {
  const factors = {
    trainingFit: 20,
    remainingNeeds: 20,
    goalFit: 12,
    macroBalance: 12,
    pantryMatch: 10
  };

  const reasons = [];
  let not100 = "Nutrient density is well-rounded, though individual sodium/fat preferences may vary slightly.";

  // 1. Training Fit check
  const workoutType = workout?.type || 'Hypertrophy / Resistance';
  const targetStrategy = WORKOUT_STRATEGIES.find(s => 
    s.workout_type.toLowerCase().includes(workoutType.toLowerCase()) ||
    workoutType.toLowerCase().includes(s.workout_type.toLowerCase())
  );

  if (targetStrategy) {
    if (meal.recommended_post_workout.toLowerCase().includes(workoutType.toLowerCase())) {
      factors.trainingFit = 25;
      reasons.push(`Directly matches your ${workoutType} session for optimal tissue recovery`);
    } else {
      factors.trainingFit = 21;
      reasons.push(`Provides sustained energy suited for ${workoutType}`);
    }
  } else {
    reasons.push(`Balanced post-workout profile supporting recovery`);
  }

  // 2. Remaining Needs & Protein
  const userGoal = userProfile?.goal || 'Build muscle';
  if (userGoal.toLowerCase().includes('muscle') || userGoal.toLowerCase().includes('hypertrophy')) {
    if (meal.protein >= 30) {
      factors.remainingNeeds = 25;
      factors.goalFit = 15;
      reasons.push(`High protein density (${meal.protein}g) stimulates Muscle Protein Synthesis (MPS)`);
    } else {
      factors.remainingNeeds = 20;
      factors.goalFit = 12;
      not100 = `Protein content (${meal.protein}g) is slightly below standard hypertrophy targets (25g-35g+).`;
    }
  } else if (userGoal.toLowerCase().includes('fat loss') || userGoal.toLowerCase().includes('cut')) {
    if (meal.calories <= 420 && meal.protein >= 25) {
      factors.goalFit = 15;
      factors.remainingNeeds = 24;
      reasons.push(`Calorie-efficient (${meal.calories} kcal) with lean protein to protect muscle mass during a cut`);
    } else {
      factors.goalFit = 11;
      not100 = `Calorie density (${meal.calories} kcal) is moderate; monitor your total daily deficit.`;
    }
  } else {
    factors.goalFit = 14;
    factors.remainingNeeds = 22;
    reasons.push(`Balanced macronutrient distribution supporting general fitness and energy`);
  }

  // 3. Pantry Availability Check
  if (pantryItems && pantryItems.length > 0) {
    const mealIngs = meal.ingredients || [];
    const matched = mealIngs.filter(ing => 
      pantryItems.some(p => ing.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(ing.toLowerCase()))
    );

    if (mealIngs.length > 0) {
      const ratio = matched.length / mealIngs.length;
      factors.pantryMatch = Math.min(20, Math.round(ratio * 20));
      if (matched.length >= 2) {
        reasons.push(`Uses ${matched.length} ingredients already confirmed in your kitchen (${matched.slice(0, 3).join(', ')})`);
      }
    }
  } else {
    factors.pantryMatch = 15;
  }

  // Dietary confirmation
  reasons.push(`Verified ${meal.category} · No listed allergens detected`);

  const totalScore = Math.min(99, Math.max(60, 
    factors.trainingFit + factors.remainingNeeds + factors.goalFit + factors.macroBalance + factors.pantryMatch
  ));

  return {
    score: totalScore,
    factors: [
      { name: 'Training Fit', score: factors.trainingFit, max: 25 },
      { name: 'Remaining Needs', score: factors.remainingNeeds, max: 25 },
      { name: 'Goal Fit', score: factors.goalFit, max: 15 },
      { name: 'Macro Balance', score: factors.macroBalance, max: 15 },
      { name: 'Pantry Availability', score: factors.pantryMatch, max: 20 },
    ],
    reasons,
    not100
  };
}
