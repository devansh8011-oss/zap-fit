import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RecommendationHero from './components/RecommendationHero';
import WorkoutModal from './components/WorkoutModal';
import PantryView from './components/PantryView';
import AllMealsExplorer from './components/AllMealsExplorer';
import SupplementsGuide from './components/SupplementsGuide';
import AIAssistantModal from './components/AIAssistantModal';
import AuthModal from './components/AuthModal';
import MealDetailModal from './components/MealDetailModal';
import SetupGuideModal from './components/SetupGuideModal';

import { onAuthChange, getUserProfile, saveUserProfile, logWorkout, logMeal } from './services/firebase';
import { getGroqMealRecommendation } from './services/groqAI';
import { ALL_MEALS, filterMealsBySafety } from './data/database';

export default function App() {
  // 1. Theme State (Default Light, with option to toggle to dark)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('zapfit_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zapfit_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 2. Navigation Tab ('recommendation', 'all-meals', 'pantry', 'supplements')
  const [currentTab, setCurrentTab] = useState('recommendation');

  // 3. User & Auth State
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: 'Aarav Sharma',
    goal: 'Build muscle',
    diet: 'Vegetarian',
    allergies: ['Peanuts'],
    pantry: ['Paneer', 'Spinach', 'Rice', 'Curd', 'Tomatoes', 'Oats', 'Bananas'],
    dailyTargetProtein: 130,
    dailyTargetCarbs: 260,
    dailyTargetFat: 65,
    dailyTargetCalories: 2200,
    currentProtein: 78,
    currentCarbs: 160,
    currentFat: 38,
    currentCalories: 1340,
    mealsCount: 2
  });

  // 4. Workout State
  const [workout, setWorkout] = useState({
    type: 'Hypertrophy / Muscle Building',
    focus: 'Upper Body (Chest & Back)',
    min: 65,
    int: 'High'
  });

  // 5. AI Recommendation State
  const [recommendation, setRecommendation] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // 6. Modals State
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [selectedMealForDetail, setSelectedMealForDetail] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Show temporary toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);
      if (authUser?.uid) {
        const profile = await getUserProfile(authUser.uid);
        if (profile) {
          setUserProfile(prev => ({
            ...prev,
            ...profile,
            name: authUser.displayName || profile.name || prev.name
          }));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Recalculate AI Recommendation whenever workout, user profile, or pantry changes
  useEffect(() => {
    let isCancelled = false;

    async function fetchRecommendation() {
      setLoadingAI(true);
      const safeCandidates = filterMealsBySafety(ALL_MEALS, userProfile);
      
      const remaining = {
        protein: userProfile.dailyTargetProtein - userProfile.currentProtein,
        carbs: userProfile.dailyTargetCarbs - userProfile.currentCarbs,
        calories: userProfile.dailyTargetCalories - userProfile.currentCalories
      };

      const result = await getGroqMealRecommendation({
        userProfile,
        workout,
        remainingMacros: remaining,
        pantryItems: userProfile.pantry || [],
        candidateMeals: safeCandidates
      });

      if (!isCancelled) {
        setRecommendation(result);
        setLoadingAI(false);
      }
    }

    fetchRecommendation();

    return () => { isCancelled = true; };
  }, [workout, userProfile.diet, userProfile.allergies, userProfile.goal, userProfile.pantry]);

  // Handler: Save Workout
  const handleSaveWorkout = async (newWorkout) => {
    setWorkout(newWorkout);
    if (user?.uid) {
      await logWorkout(user.uid, newWorkout);
    }
    showToast(`Workout updated: ${newWorkout.type} (${newWorkout.min} min)`);
  };

  // Handler: Update Pantry
  const handleUpdatePantry = async (newPantry) => {
    const updated = { ...userProfile, pantry: newPantry };
    setUserProfile(updated);
    if (user?.uid) {
      await saveUserProfile(user.uid, { pantry: newPantry });
    }
    showToast("Kitchen pantry inventory updated");
  };

  // Handler: Log Meal Eaten
  const handleLogMeal = async (meal) => {
    const updatedProfile = {
      ...userProfile,
      currentProtein: userProfile.currentProtein + (meal.protein || 0),
      currentCarbs: userProfile.currentCarbs + (meal.carbs || 0),
      currentFat: userProfile.currentFat + (meal.fat || 0),
      currentCalories: userProfile.currentCalories + (meal.calories || 0),
      mealsCount: userProfile.mealsCount + 1
    };
    setUserProfile(updatedProfile);

    if (user?.uid) {
      await logMeal(user.uid, meal);
      await saveUserProfile(user.uid, updatedProfile);
    }

    showToast(`Logged ${meal.name}! Added +${meal.protein}g protein to daily total.`);
  };

  // Handler: Auth Success
  const handleAuthSuccess = (authUser) => {
    setUser(authUser);
    if (authUser.displayName) {
      setUserProfile(prev => ({ ...prev, name: authUser.displayName }));
    }
    showToast(`Welcome, ${authUser.displayName || 'Athlete'}! Synced with Firebase.`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation Bar */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        userProfile={userProfile}
        openAuthModal={() => setIsAuthOpen(true)}
        openSetupGuide={() => setIsSetupOpen(true)}
        openWorkoutModal={() => setIsWorkoutOpen(true)}
        openAIModal={() => setIsAIOpen(true)}
      />

      {/* Main Content Body */}
      <main className="app-container" style={{ flex: 1 }}>
        
        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 100,
            background: 'var(--brand-deep)',
            color: 'var(--on-deep)',
            padding: '12px 20px',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <span>⚡</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: AI Recommendation Match View */}
        {currentTab === 'recommendation' && (
          <RecommendationHero
            workout={workout}
            userProfile={userProfile}
            recommendation={recommendation}
            loadingAI={loadingAI}
            openWorkoutModal={() => setIsWorkoutOpen(true)}
            openMealDetail={(meal) => setSelectedMealForDetail(meal)}
            onLogMeal={handleLogMeal}
          />
        )}

        {/* Tab 2: All 75 Meals Explorer */}
        {currentTab === 'all-meals' && (
          <AllMealsExplorer
            userProfile={userProfile}
            openMealDetail={(meal) => setSelectedMealForDetail(meal)}
          />
        )}

        {/* Tab 3: Pantry Match */}
        {currentTab === 'pantry' && (
          <PantryView
            userProfile={userProfile}
            pantryItems={userProfile.pantry || []}
            onUpdatePantry={handleUpdatePantry}
            openMealDetail={(meal) => setSelectedMealForDetail(meal)}
          />
        )}

        {/* Tab 4: Supplements & Whole Foods */}
        {currentTab === 'supplements' && (
          <SupplementsGuide />
        )}

      </main>

      {/* Footer */}
      <footer className="footer" style={{ 
        borderTop: '1px solid var(--line)', 
        padding: '24px 20px', 
        fontSize: '13px', 
        color: 'var(--ink-muted)' 
      }}>
        <div className="container footer-inner" style={{ maxWidth: '1220px', margin: '0 auto' }}>
          <div className="footer-copy">
            <span><b>ZAP FIT Connect</b> · AI Post-Workout Nutrition Engine</span>
            <span>·</span>
            <span>Nutrition guidance only — not medical advice.</span>
          </div>
          <div className="co-engineered-wrap">
            <a className="co-engineered-badge" href="https://steelandstack.com" target="_blank" rel="noopener noreferrer" title="Visit Steel &amp; Stack Studio" aria-label="Co-Engineered by Steel &amp; Stack">
              <span className="co-engineered-label">Co-Engineered by</span>
              <span className="co-engineered-brand">Steel &amp; Stack</span>
              <span className="co-engineered-logo-wrap">
                <img src="/steelandstack-s.png" alt="Steel &amp; Stack 'S' Monogram" className="co-engineered-logo" />
              </span>
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <WorkoutModal
        isOpen={isWorkoutOpen}
        onClose={() => setIsWorkoutOpen(false)}
        currentWorkout={workout}
        onSaveWorkout={handleSaveWorkout}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        openSetupGuide={() => { setIsAuthOpen(false); setIsSetupOpen(true); }}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        userProfile={userProfile}
        workout={workout}
        pantryItems={userProfile.pantry || []}
      />

      <SetupGuideModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
      />

      <MealDetailModal
        meal={selectedMealForDetail}
        isOpen={Boolean(selectedMealForDetail)}
        onClose={() => setSelectedMealForDetail(null)}
        userProfile={userProfile}
        pantryItems={userProfile.pantry || []}
        onLogMeal={handleLogMeal}
      />

    </div>
  );
}
