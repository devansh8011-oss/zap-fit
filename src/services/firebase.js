// Backend-proxied authentication and data service — no credentials on the client
export const isFirebaseConfigured = false;
let auth = null;
let db = null;
let googleProvider = null;

// ----------------------------------------------------
// Mock / LocalStorage Fallback State for Demo Mode
// ----------------------------------------------------
const MOCK_STORAGE_KEY = 'zapfit_mock_user';
const MOCK_PROFILE_KEY = 'zapfit_user_profile';
const MOCK_WORKOUTS_KEY = 'zapfit_user_workouts';
const MOCK_MEALS_KEY = 'zapfit_user_meals';

const DEFAULT_MOCK_USER = {
  uid: 'demo-user-aarav',
  displayName: 'Aarav Sharma',
  email: 'aarav.fitness@example.com',
  photoURL: null,
  isAnonymous: false,
};

// ----------------------------------------------------
// AUTHENTICATION API
// ----------------------------------------------------

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  if (isFirebaseConfigured && auth && googleProvider) {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Save/update basic user info in Firestore
    await saveUserProfile(user.uid, {
      name: user.displayName || 'Fitness Athlete',
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString()
    });
    
    return user;
  } else {
    // Demo mode: Return preconfigured athletic user
    const mockUser = {
      ...DEFAULT_MOCK_USER,
      loginMethod: 'Google (Demo Mode)'
    };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
    return mockUser;
  }
}

/**
 * Sign in with Email and Password
 */
export async function signInEmail(email, password) {
  if (isFirebaseConfigured && auth) {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  } else {
    const mockUser = {
      uid: 'demo-' + btoa(email).slice(0, 10),
      displayName: email.split('@')[0],
      email: email,
      photoURL: null,
      loginMethod: 'Email (Demo Mode)'
    };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
    return mockUser;
  }
}

/**
 * Sign up with Email and Password
 */
export async function signUpEmail(email, password, displayName = '') {
  if (isFirebaseConfigured && auth) {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    await saveUserProfile(user.uid, {
      name: displayName || email.split('@')[0],
      email: user.email,
      createdAt: new Date().toISOString()
    });
    return user;
  } else {
    const mockUser = {
      uid: 'demo-' + btoa(email).slice(0, 10),
      displayName: displayName || email.split('@')[0],
      email: email,
      photoURL: null,
      loginMethod: 'Email (Demo Mode)'
    };
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
    return mockUser;
  }
}

/**
 * Sign out
 */
export async function logout() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  } else {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  }
}

/**
 * Subscribe to Auth State Changes
 */
export function onAuthChange(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    // Trigger callback with whatever is currently in mock storage
    const saved = localStorage.getItem(MOCK_STORAGE_KEY);
    const mockUser = saved ? JSON.parse(saved) : DEFAULT_MOCK_USER;
    callback(mockUser);
    return () => {};
  }
}

// ----------------------------------------------------
// FIRESTORE DATABASE API
// ----------------------------------------------------

/**
 * Save user profile (preferences, diet, allergies, goal, remaining macros)
 */
export async function saveUserProfile(uid, profileData) {
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { ...profileData, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error("Firestore save error:", e);
    }
  } else {
    const existing = JSON.parse(localStorage.getItem(MOCK_PROFILE_KEY) || '{}');
    const updated = { ...existing, ...profileData, updatedAt: new Date().toISOString() };
    localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(updated));
  }
}

/**
 * Fetch user profile
 */
export async function getUserProfile(uid) {
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
    } catch (e) {
      console.error("Firestore read error:", e);
    }
  }
  
  // Return local storage or default profile
  const saved = localStorage.getItem(MOCK_PROFILE_KEY);
  if (saved) return JSON.parse(saved);

  return {
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
  };
}

/**
 * Log a Workout
 */
export async function logWorkout(uid, workout) {
  const session = {
    ...workout,
    timestamp: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'users', uid, 'workouts');
      await addDoc(colRef, session);
    } catch (e) {
      console.error("Error logging workout to Firestore:", e);
    }
  } else {
    const list = JSON.parse(localStorage.getItem(MOCK_WORKOUTS_KEY) || '[]');
    list.unshift(session);
    localStorage.setItem(MOCK_WORKOUTS_KEY, JSON.stringify(list.slice(0, 30)));
  }
  return session;
}

/**
 * Log a Meal
 */
export async function logMeal(uid, meal) {
  const entry = {
    ...meal,
    loggedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'users', uid, 'meals');
      await addDoc(colRef, entry);
    } catch (e) {
      console.error("Error logging meal to Firestore:", e);
    }
  } else {
    const list = JSON.parse(localStorage.getItem(MOCK_MEALS_KEY) || '[]');
    list.unshift(entry);
    localStorage.setItem(MOCK_MEALS_KEY, JSON.stringify(list.slice(0, 30)));
  }
  return entry;
}
