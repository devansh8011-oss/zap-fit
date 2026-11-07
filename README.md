# ZAP FIT Connect ⚡
> **AI-Powered Post-Workout Nutrition & Athlete Recovery System**

ZAP FIT Connect is an athlete recovery web application designed to eliminate guesswork from post-workout nutrition. By combining deterministic sports-science macronutrient splits with an AI coach, it calibrates daily targets and matches post-workout meals with recipes and preparation steps.

---

## ⚡ Core Features

- **Personalized 9-Step Onboarding**: Comprehensive intake covering athletic goals, body metrics, training schedules, dietary disciplines (Vegan, Vegetarian, Non-Vegetarian, Jain, Allergen-Free), and medical allergies.
- **AI Target Calibration**: Calculates daily Calorie, Protein, Carbohydrate, and Fat targets with an active recovery strategy tailored to your training.
- **75 Curated Athlete Meals with Step-by-Step Recipes**: Complete with exact macronutrients, prep times, cooking times, ingredients, and numbered culinary steps.
- **5-Factor Deterministic Match Engine**:
  1. *Training fit* (25 pts): Session carb/protein/fat split.
  2. *Remaining needs* (25 pts): Protein & calorie targets remaining today.
  3. *Goal fit* (15 pts): Muscle building, fat loss, or endurance alignment.
  4. *Taste & variety* (15 pts): Dislike screening and meal rotation.
  5. *Recovery timing* (20 pts): Digestibility and nutrient timing.
- **Daily Meal & Workout Logging**: Easily log workouts and eaten meals, with offline-safe storage and Cloud Firestore synchronization.
- **Comprehensive History & 7-Day Trend Chart**: View meals, workouts, and macro totals for today, yesterday, or any past date.
- **Context-Aware AI Coach**: The AI coach has real-time access to the athlete's full profile, daily targets, and 7-day activity history (including yesterday's report).
- **Dark Mode Default & High-Contrast Light Mode**: Complete theme token system designed for legibility across all screens.

---

## 🚀 Instant Deployment on Vercel

1. Push or import this repository into your GitHub account.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Select the `zap-fit` repository.
4. Framework Preset: **Other** (Static Site).
5. Click **Deploy**.

---

## 💻 Local Development

Run with Python's built-in server:
```bash
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.
