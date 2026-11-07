// Groq AI Integration Service for ZAP FIT
// Ultra-fast inference with Llama 3.3 70B / Llama 3.1 8B

import { calculateMealMatch } from '../data/database';

export const isGroqConfigured = true;

/**
 * Get AI-powered meal ranking and personalized reasoning via secure backend /api/ai
 */
export async function getGroqMealRecommendation({
  userProfile,
  workout,
  remainingMacros,
  pantryItems,
  candidateMeals
}) {
  try {
    // Provide top 6 candidate meals to AI for ranking & reasoning
    const candidatesSubset = candidateMeals.slice(0, 8).map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      calories: m.calories,
      carbs: m.carbs,
      protein: m.protein,
      fat: m.fat,
      recommended_workout: m.recommended_post_workout,
      benefits: m.benefits,
      ingredients: m.ingredients
    }));

    const systemPrompt = `You are ZAP FIT AI, an elite sports nutritionist and meal recommendation engine.
Your mission is to pick the #1 best post-workout meal from a curated library of meals for this specific athlete.

Follow these strict rules:
1. Analyze the physiological demands of their specific training session (e.g. Strength/Hypertrophy demands 25-40g+ protein + glycogen replenishment; Endurance demands high complex carbs + hydration; Cutting demands high protein with controlled calories).
2. Consider their remaining daily macros: Target Protein: ${remainingMacros.protein}g, Target Carbs: ${remainingMacros.carbs}g, Target Calories: ${remainingMacros.calories} kcal.
3. Check ingredient overlap with what they already confirmed in their kitchen pantry: ${pantryItems.join(', ')}.
4. Strict safety: Do not violate diet (${userProfile.diet}) or allergies (${userProfile.allergies.join(', ')}).

Return ONLY a valid JSON object matching this schema (no markdown, no backticks, raw JSON):
{
  "topMealId": "string matching one of the candidate IDs",
  "matchScore": number (integer between 80 and 99),
  "summaryHeadline": "Short energetic 1-line reason for this meal",
  "whyReasons": [
    "string: specific reason linking today's workout to this meal",
    "string: how it satisfies their remaining protein/carbs",
    "string: pantry ingredients used from home",
    "string: dietary and allergy safety confirmation"
  ],
  "not100Reason": "string: transparent, honest critique of why it is not a 100% perfect score",
  "pantryOverlapCount": number,
  "suggestedSubstitution": "string: optional tip if a secondary ingredient is missing"
}`;

    const userPrompt = `Athlete Profile:
- Name: ${userProfile.name}
- Goal: ${userProfile.goal}
- Diet: ${userProfile.diet}
- Allergies: ${userProfile.allergies.join(', ') || 'None'}

Today's Workout:
- Type: ${workout.type} (${workout.focus})
- Duration: ${workout.min} minutes
- Intensity: ${workout.int}

Kitchen Pantry Items Available:
${pantryItems.join(', ')}

Candidate Meals to Evaluate:
${JSON.stringify(candidatesSubset, null, 2)}

Pick the single best meal and provide personalized fitness reasoning.`;

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800
      })
    });

    if (!response.ok) {
      return getLocalFallbackRecommendations(candidateMeals, workout, userProfile, pantryItems);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.text);

    const topMeal = candidateMeals.find(m => m.id === parsed.topMealId) || candidateMeals[0];
    
    return {
      topMeal: {
        ...topMeal,
        matchScore: parsed.matchScore || 94,
        summaryHeadline: parsed.summaryHeadline,
        aiReasons: parsed.whyReasons,
        not100Reason: parsed.not100Reason,
        substitution: parsed.suggestedSubstitution
      },
      source: 'ZAP FIT AI'
    };

  } catch (error) {
    return getLocalFallbackRecommendations(candidateMeals, workout, userProfile, pantryItems);
  }
}

/**
 * Fallback deterministic matching engine if AI is offline
 */
function getLocalFallbackRecommendations(candidateMeals, workout, userProfile, pantryItems) {
  const scored = candidateMeals.map(meal => {
    const match = calculateMealMatch(meal, workout, userProfile, pantryItems);
    return {
      ...meal,
      matchScore: match.score,
      factors: match.factors,
      aiReasons: match.reasons,
      not100Reason: match.not100,
      summaryHeadline: `Recommended for ${workout.type} (${workout.min} min)`
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  return {
    topMeal: scored[0] || candidateMeals[0],
    rankedList: scored,
    source: 'ZAP FIT Deterministic Engine'
  };
}

/**
 * Ask the ZAP FIT AI Assistant a question
 */
export async function askAIAssistant(question, context = {}) {
  try {
    const systemPrompt = `You are ZAP FIT AI Assistant, a concise, supportive sports nutrition copilot.
Help the athlete with questions regarding post-workout meals, macro timing, ingredient substitutions, and training refuel.
Keep answers under 3-4 crisp sentences. Never prescribe medical treatments.

Current User Context:
- Goal: ${context.user?.goal || 'Muscle gain'}
- Diet: ${context.user?.diet || 'Vegetarian'}
- Allergies: ${context.user?.allergies?.join(', ') || 'None'}
- Recent Workout: ${context.workout?.type || 'Strength'} (${context.workout?.min || 60} mins)`;

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 300
      })
    });

    if (!res.ok) throw new Error("Assistant response failed");
    const data = await res.json();
    return data.text;
  } catch (e) {
    return localAssistantResponse(question, context);
  }
}

function localAssistantResponse(q, context) {
  const ql = q.toLowerCase();
  if (ql.includes('substitute') || ql.includes('swap') || ql.includes('paneer')) {
    return "You can easily swap Paneer with Extra-Firm Tofu (for a plant-based, lower-fat protein) or Low-Fat Cottage Cheese. Both deliver 25-30g of complete protein per 150g serving!";
  }
  if (ql.includes('carb') || ql.includes('run') || ql.includes('endurance')) {
    return "After endurance and running sessions, your muscle glycogen stores are depleted. Consuming 50-70g of complex carbs (sweet potato, oats, brown rice) accelerates glycogen resynthesis and prevents post-run cortisol spikes.";
  }
  if (ql.includes('protein') || ql.includes('how much')) {
    return "For hypertrophy and muscle retention, aim for 25g to 35g of high-quality protein containing at least 2.5g to 3g of Leucine in your post-workout meal.";
  }
  return "ZAP FIT recommends meals matching your specific workout intensity, remaining macros, and verified pantry ingredients. Try logging your workout above to see your top match!";
}
