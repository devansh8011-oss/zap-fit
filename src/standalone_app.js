// ==========================================================================
// ZAP FIT Connect — Athlete Nutrition & Recovery App
// Flow: Landing -> Sign in (Google / Email) -> 9 questions (mandatory)
//       -> ZAP FIT AI calibration -> Dashboard
// ==========================================================================
(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Data
  // ------------------------------------------------------------------
  const MEALS = window.ZAP_MEALS || [];
  const STRATEGIES = window.ZAP_STRATEGIES || [];
  const SUPPLEMENTS = window.ZAP_SUPPLEMENTS || [];

  const FACTORS = [
    { name: 'Pantry match', max: 30 },
    { name: 'Training fit', max: 20 },
    { name: 'Remaining needs', max: 20 },
    { name: 'Goal fit', max: 15 },
    { name: 'Recovery timing', max: 15 }
  ];

  const ALLERGY_MAP = {
    'Peanuts': ['Peanuts'],
    'Tree nuts': ['Tree Nuts'],
    'Milk': ['Dairy'],
    'Eggs': ['Eggs'],
    'Soy': ['Soy'],
    'Wheat': ['Gluten'],
    'Sesame': ['Sesame'],
    'Fish / Shellfish': ['Fish', 'Shellfish']
  };

  const ONB = [
    { k: 'purpose', q: 'What brings you to ZAP FIT?', sub: 'Pick everything that applies.', multi: true,
      opts: ['Build muscle', 'Lose body fat', 'Improve fitness', 'Support endurance', 'Maintain healthy habits', 'Eat more consistently'] },
    { k: 'basic', q: 'A little about you', sub: 'Used to estimate your energy and protein needs. Your weight is never shown on the dashboard.' },
    { k: 'activity', q: 'How active are you outside planned workouts?', sub: 'Think about your job, commute and daily movement.',
      opts: ['Mostly sedentary', 'Lightly active', 'Moderately active', 'Very active', 'Highly active'] },
    { k: 'training', q: 'What kinds of training do you usually do?', sub: 'Pick all that apply, then choose how many days a week you train.', multi: true,
      opts: ['Strength', 'Cardio', 'Running', 'Cycling', 'Swimming', 'HIIT', 'Sports', 'Yoga / mobility', 'Mixed training'] },
    { k: 'diet', q: 'How do you eat?', sub: 'Meals that do not fit your diet are never recommended.',
      opts: ['Vegetarian', 'Vegan', 'Eggetarian', 'Non-vegetarian', 'Jain', 'No preference'] },
    { k: 'allergy', q: 'Any food allergies?', sub: 'Selected allergens are removed from every recommendation.', multi: true,
      opts: ['Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Soy', 'Wheat', 'Sesame', 'Fish / Shellfish', 'None'] },
    { k: 'health', q: 'Any health-related dietary requirements?', sub: 'ZAP FIT never adjusts meals for a medical condition on its own.',
      opts: ['None', 'I have professional dietary guidance', 'I would like support from a nutrition professional'] },
    { k: 'eat', q: 'Which meals do you usually have?', sub: 'Helps us pace your protein across the day.', multi: true,
      opts: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pre-workout meals', 'Post-workout meals'] },
    { k: 'svc', q: 'How should ZAP FIT help you?', sub: 'We will prioritise these on your dashboard.', multi: true,
      opts: ['Recommend meals', 'Track meals and workouts', 'AI nutrition guidance', 'Supplement guidance'] }
  ];
  const MEAL_TIMES = { 'Breakfast': '8:00 AM', 'Lunch': '1:30 PM', 'Dinner': '8:30 PM', 'Snacks': '5:00 PM', 'Pre-workout meals': '5:15 PM', 'Post-workout meals': '7:15 PM' };

  const CALIB_STEPS = ['Reading your answers', 'Applying diet and allergy safety rules', 'Estimating your daily energy needs', 'ZAP FIT AI is building your recovery plan'];

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const todayKey = () => dateKey(new Date());
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const shiftKey = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
  const nowTime = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const prettyDate = (k) => parseKey(k).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  const shortDay = (k) => parseKey(k).toLocaleDateString([], { weekday: 'short' });
  const sum = (arr, f) => arr.reduce((a, x) => a + (Number(x[f]) || 0), 0);
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const firstName = (n) => String(n || 'Athlete').trim().split(/\s+/)[0];

  function icon(name, size = 18) {
    const p = {
      bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
      check: '<polyline points="20 6 9 17 4 12"/>',
      close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
      flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
      sparkle: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
      dumbbell: '<path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12"/>',
      logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
      search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/>',
      sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
      moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
      left: '<polyline points="15 18 9 12 15 6"/>',
      right: '<polyline points="9 18 15 12 9 6"/>',
      arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
      target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
      plate: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
      calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
      plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
      send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
      trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
      info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
      user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      pill: '<path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>',
      clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
      home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
      chef: '<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/>',
      box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
      refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
      scooter: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10l-1.5-4.5A2 2 0 0 0 12.6 4H8"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6M12 6l-2 5h4"/>',
      map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
      pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
      phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
      mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/>',
      bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
      lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      wallet: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><circle cx="16" cy="14" r="1.5"/>',
      cooking: '<path d="M18 11h3a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-3"/><path d="M4 11h14v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-5z"/><line x1="2" y1="8" x2="6" y2="8"/><line x1="9" y1="6" x2="13" y2="6"/>'
    }[name] || '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  }

  const GOOGLE_SVG = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  // ------------------------------------------------------------------
  // Route detection for Chef Didi (/didi and /deede)
  // ------------------------------------------------------------------
  function isDidiRoute() {
    const p = (window.location.pathname || '').toLowerCase().replace(/\/+$/, '');
    const h = (window.location.hash || '').toLowerCase();
    const s = (window.location.search || '').toLowerCase();
    return (
      p === '/didi' || p.endsWith('/didi') || p.endsWith('/didi/index.html') ||
      p === '/deede' || p.endsWith('/deede') || p.endsWith('/deede/index.html') ||
      p === '/deedee' || p.endsWith('/deedee') ||
      p === '/chef-didi' || p === '/chefdidi' ||
      h === '#didi' || h === '#/didi' || h === '#deede' || h === '#/deede' ||
      s.includes('didi=1') || s.includes('view=didi')
    );
  }

  // ------------------------------------------------------------------
  // Per-athlete storage + Backend API (/api/*) Sync
  // ------------------------------------------------------------------
  const SESSION_KEY = 'zapfit:session_user_v1';
  const DIDI_LOCAL_KEY = 'zapfit:chef_didi_orders_v1';

  const blankAnswers = () => ({ purpose: [], name: '', age: '', gender: '', height: '', weight: '', activity: '', training: [], days: 4, diet: '', disliked: '', allergy: [], health: '', eat: [], svc: [] });
  const blankData = () => ({ onboarded: false, answers: null, profile: null, meals: [], workouts: [], didiOrders: [], pantry: {} });

  const Store = {
    key: (uid) => 'zapfit:athlete:' + uid,
    load(uid) {
      try {
        const raw = localStorage.getItem(this.key(uid));
        if (raw) {
          const d = JSON.parse(raw);
          if (!d.pantry || typeof d.pantry !== 'object') d.pantry = this.loadPantry() || {};
          return Object.assign(blankData(), d);
        }
      } catch (e) {}
      const b = blankData();
      b.pantry = this.loadPantry() || {};
      return b;
    },
    save(uid, data) {
      try {
        localStorage.setItem(this.key(uid), JSON.stringify(data));
        if (data && data.pantry) this.savePantry(data.pantry);
      } catch (e) {}
    },
    loadPantry() {
      try { const raw = localStorage.getItem('zapfit:pantry_v1'); if (raw) return JSON.parse(raw) || {}; } catch (e) {}
      return {};
    },
    savePantry(p) {
      try { localStorage.setItem('zapfit:pantry_v1', JSON.stringify(p || {})); } catch (e) {}
    },
    loadSession() {
      try { const raw = localStorage.getItem(SESSION_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
      return null;
    },
    saveSession(user) {
      try {
        if (user) localStorage.setItem(SESSION_KEY, JSON.stringify({ uid: user.uid, name: user.name }));
        else localStorage.removeItem(SESSION_KEY);
      } catch (e) {}
    },
    loadDidiOrders() {
      try { const raw = localStorage.getItem(DIDI_LOCAL_KEY); if (raw) return JSON.parse(raw) || []; } catch (e) {}
      return [];
    },
    saveDidiOrders(list) {
      try { localStorage.setItem(DIDI_LOCAL_KEY, JSON.stringify(list)); } catch (e) {}
    },
    loadDidiWallet() {
      try {
        const raw = localStorage.getItem('zapfit:didi_wallet');
        if (raw) return parseInt(raw, 10) || 1250;
      } catch (e) {}
      return 1250;
    },
    saveDidiWallet(amt) {
      try { localStorage.setItem('zapfit:didi_wallet', String(amt)); } catch (e) {}
    },
    loadDidiActiveOrder() {
      try { return localStorage.getItem('zapfit:didi_active_order') || null; } catch (e) {}
      return null;
    },
    saveDidiActiveOrder(id) {
      try {
        if (id) localStorage.setItem('zapfit:didi_active_order', id);
        else localStorage.removeItem('zapfit:didi_active_order');
      } catch (e) {}
    },
    loadDidiCheckedSteps(orderId) {
      if (!orderId) return {};
      try {
        const raw = localStorage.getItem(`zapfit:didi_steps_${orderId}`);
        if (raw) return JSON.parse(raw) || {};
      } catch (e) {}
      return {};
    },
    saveDidiCheckedSteps(orderId, stepsObj) {
      if (!orderId) return;
      try {
        localStorage.setItem(`zapfit:didi_steps_${orderId}`, JSON.stringify(stepsObj || {}));
      } catch (e) {}
    }
  };

  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  }

  async function apiRequest(url, method = 'GET', body = undefined) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await withTimeout(fetch(url, opts), 8000);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  function mergeById(localArr, cloudArr) {
    const map = new Map();
    (Array.isArray(cloudArr) ? cloudArr : Object.values(cloudArr || {})).forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    (Array.isArray(localArr) ? localArr : []).forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values()).sort((a, b) => {
      const da = a.date || '', dbKey = b.date || '';
      if (da !== dbKey) return da < dbKey ? 1 : -1;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }

  // Build structured daily history (Today, Yesterday, and every logged date) for Firebase
  function buildUserHistoryObject(d) {
    const meals = d.meals || [];
    const workouts = d.workouts || [];
    const didiOrders = d.didiOrders || [];
    const prof = d.profile || null;
    const today = todayKey();
    const yesterday = shiftKey(today, -1);

    const dateSet = new Set();
    for (let i = 0; i <= 7; i++) dateSet.add(shiftKey(today, -i));
    meals.forEach((m) => { if (m && m.date) dateSet.add(m.date); });
    workouts.forEach((w) => { if (w && w.date) dateSet.add(w.date); });
    didiOrders.forEach((o) => { if (o && o.date) dateSet.add(o.date); });

    const byDate = {};
    Array.from(dateSet).sort().reverse().forEach((k) => {
      const dayMeals = meals.filter((m) => m.date === k);
      const dayWorkouts = workouts.filter((w) => w.date === k);
      const dayOrders = didiOrders.filter((o) => o.date === k);
      const tag = k === today ? 'Today' : k === yesterday ? 'Yesterday' : shortDay(k);
      byDate[k] = {
        date: k,
        dayTag: tag,
        label: `${tag} (${prettyDate(k)})`,
        meals: dayMeals,
        workouts: dayWorkouts,
        chefDidiOrders: dayOrders,
        totals: {
          protein: sum(dayMeals, 'protein'),
          carbs: sum(dayMeals, 'carbs'),
          fat: sum(dayMeals, 'fat'),
          calories: sum(dayMeals, 'calories'),
          mealsCount: dayMeals.length,
          workoutMinutes: sum(dayWorkouts, 'minutes'),
          kcalBurned: sum(dayWorkouts, 'kcal'),
          workoutsCount: dayWorkouts.length,
          chefDidiOrdersCount: dayOrders.length
        },
        targets: prof ? {
          proteinTarget: prof.proteinTarget,
          carbsTarget: prof.carbsTarget,
          fatTarget: prof.fatTarget,
          caloriesTarget: prof.caloriesTarget
        } : null
      };
    });

    return {
      today: byDate[today] || null,
      yesterday: byDate[yesterday] || null,
      byDate,
      lastUpdatedISO: new Date().toISOString()
    };
  }

  async function cloudGet(uid) {
    try {
      const res = await apiRequest('/api/athlete?uid=' + encodeURIComponent(uid), 'GET');
      return res && res.data ? res.data : null;
    } catch (e) {
      console.warn('[ZAP FIT] Cloud read skipped:', e.message);
      return null;
    }
  }

  function cloudSave() {
    if (!S.user || !S.data) return;
    const d = S.data;
    const historyObj = buildUserHistoryObject(d);
    const payload = {
      uid: S.user.uid,
      name: d.answers?.name || S.user.name || 'Athlete',
      onboarded: !!d.onboarded,
      answers: d.answers || null,
      profile: d.profile || null,
      meals: (d.meals || []).slice(0, 500),
      workouts: (d.workouts || []).slice(0, 500),
      didiOrders: (d.didiOrders || []).slice(0, 200),
      pantry: d.pantry || {},
      history: historyObj,
      updatedAt: Date.now(),
      updatedAtISO: new Date().toISOString()
    };

    apiRequest('/api/athlete', 'PUT', { uid: S.user.uid, payload, history: historyObj })
      .catch((e) => console.warn('[ZAP FIT] Cloud save deferred:', e.message));
  }

  function persist() {
    if (!S.user || !S.data) return;
    Store.save(S.user.uid, S.data);
    cloudSave();
  }

  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  const S = {
    theme: localStorage.getItem('zapfit_theme_v3') || 'dark',
    view: isDidiRoute() ? 'didi' : 'boot', // boot | landing | onboarding | calibrating | calibrated | dashboard | didi
    tab: 'today',            // today | history | meals | supplements | profile
    user: null,
    data: null,
    onb: { step: 0, answers: blankAnswers(), error: '' },
    calib: { stage: 0 },
    modal: null,             // auth | workout | meal | ai | didi-recipe
    authTab: 'signin',
    authBusy: false,
    authError: '',
    explicitSignIn: false,
    selectedMealId: null,
    selectedOrderId: null,
    historyDate: todayKey(),
    libQuery: '',
    libFilter: 'all',
    pantryFilter: 'all',
    pantrySearch: '',
    didiOrders: Store.loadDidiOrders(),
    didiFilter: 'all',       // all | pending | preparing | ready | completed | today
    didiQuery: '',
    didiConnected: true,
    didiWallet: Store.loadDidiWallet(),
    didiView: 'orders',      // orders | map | cooking | payout
    didiActiveOrderId: Store.loadDidiActiveOrder(),
    didiCheckedSteps: {},
    pendingPaymentMealId: null,
    notifiedReachedOrders: new Set(),
    dismissedReachedBanner: false,
    chat: [],
    chatBusy: false,
    toast: null
  };
  document.documentElement.setAttribute('data-theme', S.theme);

  // ------------------------------------------------------------------
  // Nutrition engine
  // ------------------------------------------------------------------
  function strategyFor(name) {
    return STRATEGIES.find((s) => s.workout_type === name) || STRATEGIES[1] || { workout_type: 'Hypertrophy / Muscle Building', carb_pct: 45, protein_pct: 40, fat_pct: 15, primary_goal: '' };
  }

  function primaryStrategy(a) {
    const t = a.training || [], p = a.purpose || [];
    if (p.includes('Lose body fat')) return 'Fat Loss / Cutting Phase';
    if (t.some((x) => ['Running', 'Cycling', 'Swimming'].includes(x)) || p.includes('Support endurance')) return 'Endurance / Long Distance Cardio';
    if (t.includes('HIIT') || t.includes('Sports')) return 'HIIT / Circuit Training';
    if (t.includes('Strength') && p.includes('Build muscle')) return 'Hypertrophy / Muscle Building';
    if (t.includes('Strength')) return 'Heavy Strength / Powerlifting';
    if (t.includes('Yoga / mobility') && t.length === 1) return 'Light Mobility / Rest Day';
    return 'Hypertrophy / Muscle Building';
  }

  function goalOf(a) {
    const p = a.purpose || [];
    if (p.includes('Lose body fat')) return 'fatloss';
    if (p.includes('Build muscle')) return 'muscle';
    if (p.includes('Support endurance') || p.includes('Improve fitness')) return 'endurance';
    return 'general';
  }

  // Deterministic baseline (Mifflin-St Jeor) — also the safety net if AI is unreachable
  function baselineTargets(a) {
    const w = clamp(parseFloat(a.weight) || 70, 30, 250);
    const h = clamp(parseFloat(a.height) || 170, 120, 230);
    const age = clamp(parseFloat(a.age) || 25, 13, 90);
    const sexAdj = a.gender === 'Male' ? 5 : a.gender === 'Female' ? -161 : -78;
    const bmr = 10 * w + 6.25 * h - 5 * age + sexAdj;
    const act = { 'Mostly sedentary': 1.2, 'Lightly active': 1.375, 'Moderately active': 1.5, 'Very active': 1.65, 'Highly active': 1.8 }[a.activity] || 1.4;
    let tdee = bmr * (act + (Number(a.days) || 0) * 0.025);
    const goal = goalOf(a);
    if (goal === 'fatloss') tdee -= 400;
    if (goal === 'muscle') tdee += 250;
    if (goal === 'endurance') tdee += 150;
    const kcal = Math.round(clamp(tdee, 1400, 4500) / 10) * 10;
    const pPerKg = { muscle: 2.0, fatloss: 2.2, endurance: 1.6, general: 1.6 }[goal];
    const protein = Math.round(w * pPerKg);
    const fat = Math.round(Math.max(w * 0.8, (kcal * 0.25) / 9));
    const carbs = Math.max(100, Math.round((kcal - protein * 4 - fat * 9) / 4));
    return { proteinTarget: protein, carbsTarget: carbs, fatTarget: fat, caloriesTarget: kcal, waterLitres: Math.round(w * 0.035 * 10) / 10 + 0.5 };
  }

  function dietAllows(meal, diet) {
    const c = (meal.category || '').toLowerCase();
    const isNonVeg = c.includes('non-veg');
    const isVegan = c.includes('vegan');
    switch (diet) {
      case 'Vegan': return isVegan;
      case 'Vegetarian':
      case 'Eggetarian': return !isNonVeg;
      case 'Jain': return c.startsWith('jain') && !isNonVeg;
      default: return true;
    }
  }

  function blockedAllergens(meal, allergies) {
    const present = meal.allergens_present || [];
    const hits = [];
    (allergies || []).forEach((a) => (ALLERGY_MAP[a] || []).forEach((tag) => { if (present.includes(tag)) hits.push(tag); }));
    return hits;
  }

  function todayMeals() { return (S.data?.meals || []).filter((m) => m.date === todayKey()); }
  function todayWorkouts() { return (S.data?.workouts || []).filter((w) => w.date === todayKey()); }

  function currentSession() {
    const w = todayWorkouts()[0];
    if (w) return { strategy: strategyFor(w.type), workout: w, logged: true };
    const prof = S.data?.profile;
    return { strategy: strategyFor(prof?.primaryStrategy), workout: null, logged: false };
  }

  function getIngredientCategory(name) {
    const n = (name || '').toLowerCase();
    if (/chicken|egg|tofu|paneer|turkey|salmon|tuna|shrimp|fish|beef|pork|mutton|whey|tempeh|edamame|chickpea|lentil|beans|soya|cottage cheese|moong|protein powder/.test(n)) return 'Proteins';
    if (/spinach|kale|broccoli|bell pepper|tomato|onion|garlic|ginger|carrot|cucumber|avocado|mushroom|cabbage|zucchini|cauliflower|pea|beetroot|lettuce|arugula|coriander|mint|chili|jalapeno|asparagus|capsicum|corn|greens|sweet potato|potato/.test(n)) return 'Vegetables';
    if (/oats|rice|quinoa|bread|pasta|roti|tortilla|noodle|wrap|flour|couscous|barley|poha|upma|dalia/.test(n)) return 'Grains & Carbs';
    if (/milk|yogurt|curd|cheese|butter|ghee|cream/.test(n)) return 'Dairy';
    if (/apple|banana|berry|berries|blueberry|strawberry|orange|lemon|lime|mango|pineapple|grape|pomegranate|dates|raisins/.test(n)) return 'Fruits';
    if (/oil|almond|walnut|cashew|peanut|chia|flax|seed|nut/.test(n)) return 'Nuts & Oils';
    return 'Spices & Staples';
  }

  const ALL_PANTRY_INGREDIENTS = (() => {
    const map = new Map();
    (MEALS || []).forEach((m) => {
      (m.ingredients || []).forEach((raw) => {
        const name = (raw || '').trim();
        if (!name) return;
        const cur = map.get(name) || { name, category: getIngredientCategory(name), mealsCount: 0, meals: [] };
        cur.mealsCount++;
        cur.meals.push(m.name);
        map.set(name, cur);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  })();

  const COMMON_KITCHEN_STAPLES = [
    'Salt', 'Black pepper', 'Olive oil', 'Ghee', 'Turmeric',
    'Cumin seeds', 'Garlic', 'Ginger', 'Onion', 'Tomatoes', 'Water',
    'Lemon', 'Green chillies', 'Coriander', 'Soy sauce', 'Honey',
    'Oats', 'White rice', 'Whole wheat flour', 'Eggs'
  ];

  function normalizeIngredient(s) {
    let str = (s || '')
      .toLowerCase()
      .replace(/\b(fresh|baby|ripe|plain|cooked|raw|crushed|chopped|diced|sliced|powder|spray|leaves|mixed|whole|scrambled|firm|boneless|skinless|lean|low-fat|fat-free|organic)\b/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    str = str.replace(/\b(toast|bread)\b/g, 'bread')
             .replace(/\b(chillies|chili|chilies)\b/g, 'chili')
             .replace(/\b(egg whites|whole eggs|egg white|whole egg|eggs)\b/g, 'egg')
             .replace(/\b(tomatoes|tomato)\b/g, 'tomato')
             .replace(/\b(black pepper|pepper)\b/g, 'pepper')
             .replace(/\b(curd|yogurt|dahi)\b/g, 'curd')
             .replace(/\b(coriander leaves|fresh coriander|coriander|dhania)\b/g, 'coriander')
             .replace(/\b(shrimp|prawns|prawn)\b/g, 'shrimp')
             .replace(/\b(paneer|cottage cheese)\b/g, 'paneer')
             .replace(/\b(white rice|basmati rice|brown rice|rice)\b/g, 'rice')
             .replace(/\b(yellow moong dal|moong dal)\b/g, 'moong dal')
             .replace(/\b(minced chicken|chicken breast)\b/g, 'chicken');
    return str.trim();
  }

  function isIngredientInPantry(mealIng, pantry) {
    const trimmed = (mealIng || '').trim();
    if (pantry[trimmed]) return true;
    const lower = trimmed.toLowerCase();
    for (const pItem in pantry) {
      if (!pantry[pItem]) continue;
      if (pItem.toLowerCase() === lower) return true;
    }
    const norm = normalizeIngredient(trimmed);
    if (!norm) return false;
    for (const pItem in pantry) {
      if (!pantry[pItem]) continue;
      const pNorm = normalizeIngredient(pItem);
      if (pNorm === norm) return true;
      if (pNorm.length >= 4 && norm.length >= 4) {
        if (pNorm.includes(norm) || norm.includes(pNorm)) return true;
      }
      if (pNorm + 's' === norm || norm + 's' === pNorm || pNorm + 'es' === norm || norm + 'es' === pNorm) return true;
    }
    return false;
  }

  function getMealPantryMatch(meal) {
    const pantry = S.data?.pantry || {};
    const ings = meal.ingredients || [];
    const total = ings.length;
    if (!total) return { inStock: [], missing: [], total: 0, ratio: 1, hasMajority: true, allInStock: true, isAccepted: true };
    const inStock = [];
    const missing = [];
    ings.forEach((ing) => {
      if (isIngredientInPantry(ing, pantry)) inStock.push(ing);
      else missing.push(ing);
    });
    const ratio = total > 0 ? inStock.length / total : 1;
    // User acceptance rule: an acceptance of at most 1-2 missing ingredients is fine
    const isAccepted = missing.length <= 2;
    return {
      inStock,
      missing,
      total,
      ratio,
      hasMajority: ratio >= 0.5,
      allInStock: missing.length === 0,
      isAccepted
    };
  }

  function scoreMeal(meal) {
    const prof = S.data.profile, ans = S.data.answers;
    if (!dietAllows(meal, ans.diet)) return { allowed: false, reason: 'diet' };
    const hits = blockedAllergens(meal, ans.allergy);
    if (hits.length) return { allowed: false, reason: 'allergen', hits };

    const session = currentSession();
    const st = session.strategy;
    const kcal = Math.max(1, meal.calories);
    const mc = (meal.carbs * 4) / kcal * 100, mp = (meal.protein * 4) / kcal * 100, mf = (meal.fat * 9) / kcal * 100;

    // 0. Pantry match (max 30 pts) — strongly prioritizes meals with 0 to 2 missing ingredients
    const pantryMatch = getMealPantryMatch(meal);
    const hasAnyPantryChecked = Object.values(S.data?.pantry || {}).some(Boolean);
    let fPantry = 15;
    if (hasAnyPantryChecked) {
      if (pantryMatch.missing.length === 0) {
        fPantry = 30; // 100% in stock!
      } else if (pantryMatch.missing.length === 1) {
        fPantry = 26; // 1 missing accepted
      } else if (pantryMatch.missing.length === 2) {
        fPantry = 22; // 2 missing accepted
      } else {
        // 3+ missing — outside user's 1-2 acceptance threshold
        fPantry = Math.max(0, 10 - pantryMatch.missing.length * 2);
      }
    }

    // 1. Training fit (max 20 pts) — macro split vs session split
    const dist = Math.abs(mc - st.carb_pct) + Math.abs(mp - st.protein_pct) + Math.abs(mf - st.fat_pct);
    const f1 = Math.round(20 * clamp(1 - dist / 90, 0.2, 1));

    // 2. Remaining needs (max 20 pts) — protein & calories left today
    const eaten = todayMeals();
    const remP = Math.max(0, prof.proteinTarget - sum(eaten, 'protein'));
    const remK = Math.max(0, prof.caloriesTarget - sum(eaten, 'calories'));
    const mealsLeft = Math.max(1, (ans.eat?.length || 4) - eaten.length);
    const targetP = clamp(remP / mealsLeft, 15, 50);
    const pScore = 1 - Math.min(1, Math.abs(meal.protein - targetP) / Math.max(targetP, 1));
    const kScore = meal.calories <= remK + 50 ? 1 : clamp(1 - (meal.calories - remK) / 400, 0, 1);
    const f2 = Math.round(20 * clamp(0.65 * pScore + 0.35 * kScore, 0.2, 1));

    // 3. Goal fit (max 15 pts)
    const goal = goalOf(ans);
    const pDensity = (meal.protein * 4) / kcal;
    let g = 0.7;
    if (goal === 'muscle') g = clamp(pDensity / 0.32, 0.3, 1);
    else if (goal === 'fatloss') g = clamp(pDensity / 0.35, 0.3, 1) * (meal.calories <= 450 ? 1 : 0.75);
    else if (goal === 'endurance') g = clamp(mc / 55, 0.3, 1);
    else g = 1 - Math.min(0.6, Math.abs(mp - 30) / 60);
    const f3 = Math.round(15 * g);

    // 4. Recovery timing (max 15 pts) — meal designed for this session
    const rec = (meal.recommended_post_workout || '').toLowerCase();
    const words = st.workout_type.toLowerCase().split(/[\s/]+/).filter((w) => w.length > 3);
    const overlap = words.filter((w) => rec.includes(w)).length;
    let f4 = overlap >= 2 ? 15 : overlap === 1 ? 11 : 7;
    if (meal.fat > 22) f4 = Math.max(4, f4 - 3);

    const factors = [fPantry, f1, f2, f3, clamp(f4, 0, 15)];
    const total = clamp(factors.reduce((a, b) => a + b, 0), 0, 100);

    const why = [];
    if (hasAnyPantryChecked) {
      if (pantryMatch.missing.length === 0) why.push(`All ${pantryMatch.total} ingredients in your pantry ✓ (100% ready)`);
      else if (pantryMatch.missing.length === 1) why.push(`Pantry ready! Only 1 item needed: ${pantryMatch.missing[0]}`);
      else if (pantryMatch.missing.length === 2) why.push(`Pantry ready! Only 2 items needed: ${pantryMatch.missing.join(', ')}`);
      else why.push(`Requires ${pantryMatch.missing.length} missing ingredients: ${pantryMatch.missing.slice(0, 3).join(', ')}`);
    }
    why.push(session.logged ? `Matches ${st.carb_pct}/${st.protein_pct}/${st.fat_pct} split for ${esc(session.workout.type)}` : `Fits your ${esc(st.workout_type)} training`);
    why.push(`${meal.protein} g protein toward ${remP} g remaining today`);
    why.push(ans.diet && ans.diet !== 'No preference' ? `${esc(ans.diet)} friendly` : 'Fits your diet');
    why.push((ans.allergy || []).filter((a) => a !== 'None').length ? `Free from ${esc(ans.allergy.filter((a) => a !== 'None').join(', '))}` : 'No allergens to avoid on your profile');
    if (overlap) why.push(`Designed for ${esc(meal.recommended_post_workout)} recovery`);

    const losses = factors.map((v, i) => ({ i, loss: 1 - v / FACTORS[i].max })).sort((a, b) => b.loss - a.loss);
    const worst = losses[0].i;
    const not100 = [
      pantryMatch.missing.length === 0 ? 'All ingredients are stocked in your kitchen.' : `Missing ${pantryMatch.missing.length} ingredient${pantryMatch.missing.length > 1 ? 's' : ''}: ${pantryMatch.missing.join(', ')}.`,
      `Its macro split (${Math.round(mc)}% carbs, ${Math.round(mp)}% protein) is a little off the ideal ${st.carb_pct}% / ${st.protein_pct}% for this session.`,
      meal.calories > remK ? `At ${meal.calories} kcal it is slightly above the ${remK} kcal you have left today.` : `Its ${meal.protein} g protein is not an exact fit for the ~${Math.round(targetP)} g per meal you need right now.`,
      `It is a reasonable but not ideal fit for your ${goal === 'fatloss' ? 'fat-loss' : goal === 'muscle' ? 'muscle-gain' : goal === 'endurance' ? 'endurance' : 'general fitness'} goal.`,
      `It is built for ${esc(meal.recommended_post_workout || 'general')} recovery rather than ${esc(st.workout_type)}.`
    ][worst];

    return { allowed: true, total, factors, why, not100, pantryMatch };
  }

  function rankedMeals() {
    const ok = [], hidden = [], needMorePantry = [];
    const hasAnyPantryChecked = Object.values(S.data?.pantry || {}).some(Boolean);

    MEALS.forEach((m) => {
      const r = scoreMeal(m);
      if (!r.allowed) {
        if (r.reason === 'allergen') hidden.push({ meal: m, hits: r.hits });
        return;
      }
      const mealWithScore = Object.assign({}, m, { score: r });
      if (hasAnyPantryChecked) {
        // Acceptance of at most 1-2 missing ingredients
        if (r.pantryMatch.missing.length <= 2) {
          ok.push(mealWithScore);
        } else {
          needMorePantry.push(mealWithScore);
        }
      } else {
        ok.push(mealWithScore);
      }
    });

    // Primary ranking: 0 missing first, then 1 missing, then 2 missing, then by total score
    ok.sort((a, b) => {
      if (hasAnyPantryChecked) {
        const aMiss = a.score.pantryMatch.missing.length;
        const bMiss = b.score.pantryMatch.missing.length;
        if (aMiss !== bMiss) return aMiss - bMiss;
      }
      return b.score.total - a.score.total;
    });

    needMorePantry.sort((a, b) => {
      const aMiss = a.score.pantryMatch.missing.length;
      const bMiss = b.score.pantryMatch.missing.length;
      if (aMiss !== bMiss) return aMiss - bMiss;
      return b.score.total - a.score.total;
    });

    // If no meals match <= 2 missing ingredients yet, provide needMorePantry as graceful fallback so athlete still sees closest options
    const effectiveOk = ok.length ? ok : needMorePantry;
    return { ok: effectiveOk, acceptedCount: ok.length, needMorePantry, hidden, hasAnyPantryChecked };
  }

  // ------------------------------------------------------------------
  // AI (Proxied via Backend /api/ai — No Keys on Frontend)
  // ------------------------------------------------------------------
  async function askAI(messages, maxTokens) {
    const res = await apiRequest('/api/ai', 'POST', { messages, max_tokens: maxTokens || 500 });
    return (res && res.text) ? res.text.trim() : '';
  }
  function extractJSON(txt) {
    const a = txt.indexOf('{'), b = txt.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('no json');
    return JSON.parse(txt.slice(a, b + 1));
  }
  const cleanText = (s) => String(s || '').replace(/\*\*|__|#+\s?/g, '').replace(/^\s*[-*]\s+/gm, '• ').trim();

  async function calibrateWithAI(answers) {
    const base = baselineTargets(answers);
    const primary = primaryStrategy(answers);
    const st = strategyFor(primary);
    const allergies = (answers.allergy || []).filter((a) => a !== 'None');
    const prompt = `Athlete questionnaire:
- Goals: ${answers.purpose.join(', ')}
- Age ${answers.age}, ${answers.gender}, ${answers.height} cm, ${answers.weight} kg
- Activity outside workouts: ${answers.activity}
- Training: ${answers.training.join(', ')}, ${answers.days} days per week
- Diet: ${answers.diet}; dislikes: ${answers.disliked || 'none'}
- Allergies: ${allergies.join(', ') || 'none'}
- Health requirements: ${answers.health}
- Usual meals: ${answers.eat.join(', ')}
Primary recovery protocol: ${st.workout_type} (target split ${st.carb_pct}% carbs / ${st.protein_pct}% protein / ${st.fat_pct}% fat; goal: ${st.primary_goal}).
Reference estimate (Mifflin-St Jeor): ${base.caloriesTarget} kcal, ${base.proteinTarget} g protein, ${base.carbsTarget} g carbs, ${base.fatTarget} g fat.

Return ONLY a JSON object with these keys:
{"caloriesTarget": number, "proteinTarget": number, "carbsTarget": number, "fatTarget": number, "waterLitres": number,
 "recoveryStrategy": "two plain sentences on post-workout timing and protein pacing",
 "tips": ["short tip", "short tip", "short tip"], "focus": "3-5 word plan name"}`;
    let ai = null;
    try {
      const txt = await askAI([
        { role: 'system', content: 'You are ZAP FIT AI, a sports nutritionist. Reply with a single valid JSON object only. No markdown.' },
        { role: 'user', content: prompt }
      ], 600);
      ai = extractJSON(txt);
    } catch (e) { console.warn('[ZAP FIT] AI calibration fallback:', e.message); }

    const num = (v, lo, hi, fb) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= lo && n <= hi ? n : fb; };
    return {
      caloriesTarget: num(ai?.caloriesTarget, 1200, 5000, base.caloriesTarget),
      proteinTarget: num(ai?.proteinTarget, 40, 320, base.proteinTarget),
      carbsTarget: num(ai?.carbsTarget, 60, 750, base.carbsTarget),
      fatTarget: num(ai?.fatTarget, 20, 220, base.fatTarget),
      waterLitres: Number(ai?.waterLitres) > 1 && Number(ai?.waterLitres) < 8 ? Math.round(Number(ai.waterLitres) * 10) / 10 : base.waterLitres,
      recoveryStrategy: cleanText(ai?.recoveryStrategy) || `Within 45 minutes of training, aim for about ${Math.round(base.proteinTarget / 4)} g of protein with fast carbohydrates to restart muscle repair. Spread the rest of your protein evenly across your meals.`,
      tips: Array.isArray(ai?.tips) && ai.tips.length ? ai.tips.slice(0, 3).map(cleanText) : ['Eat your post-workout meal within 45 minutes of training.', 'Split protein into 25–40 g servings across the day.', 'Drink water steadily — don’t wait until you are thirsty.'],
      focus: cleanText(ai?.focus) || st.workout_type,
      primaryStrategy: primary,
      macroRatio: `${st.carb_pct}% carbs · ${st.protein_pct}% protein · ${st.fat_pct}% fat`,
      calibratedBy: ai ? 'ai' : 'baseline',
      calibratedAt: Date.now()
    };
  }

  // ------------------------------------------------------------------
  // Auth flow & Real-Time History Sync (Proxied via /api/auth & /api/athlete)
  // ------------------------------------------------------------------
  let athleteSyncInterval = null;
  function subscribeAthleteData(uid) {
    if (!uid) return;
    if (athleteSyncInterval) clearInterval(athleteSyncInterval);
    athleteSyncInterval = setInterval(async () => {
      if (!S.user || S.user.uid !== uid || !S.data) return;
      const val = await cloudGet(uid);
      if (!val) return;
      const mergedMeals = mergeById(S.data.meals, val.meals);
      const mergedWorkouts = mergeById(S.data.workouts, val.workouts);
      const mergedOrders = mergeById(S.data.didiOrders, val.didiOrders);
      const changed =
        mergedMeals.length !== (S.data.meals || []).length ||
        mergedWorkouts.length !== (S.data.workouts || []).length ||
        mergedOrders.length !== (S.data.didiOrders || []).length;
      S.data.meals = mergedMeals;
      S.data.workouts = mergedWorkouts;
      S.data.didiOrders = mergedOrders;
      if (val.pantry && typeof val.pantry === 'object') {
        S.data.pantry = Object.assign({}, val.pantry, S.data.pantry || {});
      }
      Store.save(uid, S.data);
      if (changed && !S.modal) render();
    }, 10000);
  }

  async function handleSignedIn(userObj) {
    S.user = {
      uid: userObj.uid,
      name: userObj.name || 'Athlete',
      photo: userObj.photo || ''
    };
    Store.saveSession(S.user);
    S.data = Store.load(userObj.uid);

    const cloud = await cloudGet(userObj.uid);
    if (cloud) {
      if (cloud.onboarded && (!S.data.onboarded || (cloud.profile?.calibratedAt || 0) > (S.data.profile?.calibratedAt || 0))) {
        S.data.onboarded = true;
        S.data.answers = cloud.answers;
        S.data.profile = cloud.profile;
      }
      S.data.meals = mergeById(S.data.meals, cloud.meals);
      S.data.workouts = mergeById(S.data.workouts, cloud.workouts);
      S.data.didiOrders = mergeById(S.data.didiOrders, cloud.didiOrders);
      if (cloud.pantry && typeof cloud.pantry === 'object') {
        S.data.pantry = Object.assign({}, cloud.pantry, S.data.pantry || {});
      }
      Store.save(userObj.uid, S.data);
    }

    if (S.data?.answers?.name) {
      S.user.name = S.data.answers.name;
      Store.saveSession(S.user);
    }

    // Immediately sync merged history (today, yesterday, and all past days) to backend database
    persist();
    subscribeAthleteData(userObj.uid);

    S.modal = null; S.authBusy = false; S.authError = '';
    if (isDidiRoute()) {
      S.view = 'didi';
      render();
      return;
    }
    const alreadyAnswered = Boolean(S.data?.onboarded && S.data?.profile && S.data?.answers?.purpose?.length);
    if (!alreadyAnswered) {
      startOnboarding();
    } else {
      S.view = 'dashboard';
      S.tab = 'today';
    }
    render();
  }

  function startOnboarding() {
    const prev = S.data?.answers;
    const answers = prev ? JSON.parse(JSON.stringify(Object.assign(blankAnswers(), prev))) : blankAnswers();
    if (!answers.name) answers.name = S.user?.name || '';
    S.onb = { step: 0, answers, error: '' };
    S.view = 'onboarding';
    window.scrollTo(0, 0);
  }

  function friendlyAuthError(err) {
    const c = err?.code || '';
    const map = {
      'auth/invalid-email': 'That email address doesn’t look right.',
      'auth/user-not-found': 'No account with that email. Switch to “Create account”.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/email-already-in-use': 'An account already exists with this email. Switch to “Sign in”.',
      'auth/weak-password': 'Use at least 6 characters for your password.',
      'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
      'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
      'auth/popup-blocked': 'Your browser blocked the Google pop-up. Allow pop-ups and try again.',
      'auth/unauthorized-domain': 'Open the app at http://localhost:8000 (or add your domain in Firebase Console -> Authentication -> Authorized domains) to sign in with Google.',
      'auth/network-request-failed': 'Network error. Check your connection and try again.',
      'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.'
    };
    return map[c] || err?.message || 'Sign-in failed. Please try again.';
  }

  let googleAuthInstance = null;
  async function getGoogleAuth() {
    if (googleAuthInstance) return googleAuthInstance;
    if (!window.firebase) throw new Error('Google sign-in SDK is still loading. Please try again.');
    const cfgRes = await apiRequest('/api/config', 'GET');
    const fbCfg = cfgRes && cfgRes.firebase;
    if (!fbCfg || !fbCfg.apiKey) throw new Error('Google sign-in is not configured on the server.');
    if (!firebase.apps.length) firebase.initializeApp(fbCfg);
    googleAuthInstance = firebase.auth();
    return googleAuthInstance;
  }

  async function signInGoogle() {
    S.authBusy = true; S.authError = ''; S.explicitSignIn = true; render();
    try {
      const authClient = await getGoogleAuth();
      const res = await authClient.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      const u = res.user;
      await handleSignedIn({
        uid: u.uid,
        name: u.displayName || (u.email ? u.email.split('@')[0] : 'Athlete'),
        photo: u.photoURL || ''
      });
    } catch (err) {
      S.authError = friendlyAuthError(err);
    } finally { S.explicitSignIn = false; S.authBusy = false; render(); }
  }

  async function signInEmail(email, password) {
    S.authBusy = true; S.authError = ''; S.explicitSignIn = true; render();
    try {
      const res = await apiRequest('/api/auth', 'POST', {
        mode: S.authTab === 'signup' ? 'signup' : 'signin',
        email,
        password
      });
      if (!res || !res.user) throw new Error('Authentication failed');
      await handleSignedIn(res.user);
    } catch (err) {
      S.authError = friendlyAuthError(err);
    } finally { S.explicitSignIn = false; S.authBusy = false; render(); }
  }

  async function signOut() {
    if (athleteSyncInterval) { clearInterval(athleteSyncInterval); athleteSyncInterval = null; }
    try { if (googleAuthInstance) await googleAuthInstance.signOut(); } catch (e) {}
    Store.saveSession(null);
    S.user = null; S.data = null; S.modal = null; S.chat = []; S.view = isDidiRoute() ? 'didi' : 'landing';
    render();
    toast('Signed out');
  }

  // ------------------------------------------------------------------
  // Onboarding logic
  // ------------------------------------------------------------------
  function validateStep() {
    const st = ONB[S.onb.step], a = S.onb.answers;
    if (st.k === 'basic') {
      if (!a.name.trim()) return 'Please enter your name.';
      const age = Number(a.age), h = Number(a.height), w = Number(a.weight);
      if (!(age >= 13 && age <= 90)) return 'Please enter an age between 13 and 90.';
      if (!a.gender) return 'Please choose a gender option.';
      if (!(h >= 120 && h <= 230)) return 'Please enter your height in cm (120–230).';
      if (!(w >= 30 && w <= 250)) return 'Please enter your weight in kg (30–250).';
      return '';
    }
    const v = a[st.k];
    if (st.multi ? !v.length : !v) return st.multi ? 'Pick at least one option to continue.' : 'Choose an option to continue.';
    return '';
  }

  function readBasicInputs() {
    const a = S.onb.answers;
    ['name', 'age', 'height', 'weight', 'gender', 'disliked'].forEach((k) => { const el = $('ob-' + k); if (el) a[k] = el.value.trim(); });
  }

  async function finishOnboarding() {
    const answers = JSON.parse(JSON.stringify(S.onb.answers));
    S.view = 'calibrating'; S.calib.stage = 0; render();
    const tick = setInterval(() => { if (S.calib.stage < 3) { S.calib.stage++; if (S.view === 'calibrating') render(); } }, 900);
    const started = Date.now();
    const profile = await calibrateWithAI(answers);
    const wait = Math.max(0, 3200 - (Date.now() - started));
    await new Promise((r) => setTimeout(r, wait));
    clearInterval(tick);

    S.user.name = answers.name || S.user.name;
    Store.saveSession(S.user);
    S.data.answers = answers;
    S.data.profile = profile;
    S.data.onboarded = true;
    persist();
    S.chat = [];
    S.view = 'calibrated';
    render();
  }

  // ------------------------------------------------------------------
  // Logging (Meals, Workouts & Chef Didi Orders)
  // ------------------------------------------------------------------
  function logMeal(mealId, date) {
    const m = MEALS.find((x) => x.id === mealId);
    if (!m) return;
    const d = date || todayKey();

    // Check if there is an in-progress Chef Didi order for this meal today
    const inProgressDidi = (S.didiOrders || []).find((o) =>
      o.mealId === mealId &&
      o.date === d &&
      o.status !== 'completed' &&
      (!S.user || !o.athlete?.uid || o.athlete.uid === S.user.uid || o.athlete.uid === 'guest')
    );
    if (inProgressDidi) {
      toast(`Chef Didi is currently preparing “${m.name}”. The meal cannot be approved or logged until all cooking steps are completed by Chef Didi.`);
      return;
    }

    const completedDidi = (S.didiOrders || []).find((o) =>
      o.mealId === mealId &&
      o.date === d &&
      o.status === 'completed' &&
      (!S.user || !o.athlete?.uid || o.athlete.uid === S.user.uid || o.athlete.uid === 'guest')
    );

    S.data.meals.unshift({
      id: 'm' + Date.now(),
      date: d,
      time: nowTime(),
      loggedAtISO: new Date().toISOString(),
      mealId: m.id,
      name: m.name,
      category: m.category,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      calories: m.calories,
      preparedByDidi: !!completedDidi
    });
    S.data.meals.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    persist();
    S.modal = null;
    toast(completedDidi ? `Logged “${m.name}” (Prepared & approved by Chef Didi)` : `Logged “${m.name}” (${d === todayKey() ? 'Today' : prettyDate(d)})`);
    render();
  }

  const KCAL_PER_MIN = { Low: 5, Moderate: 7.5, High: 10 };
  function logWorkout(form) {
    const minutes = clamp(parseInt(form.minutes, 10) || 0, 5, 300);
    const w = {
      id: 'w' + Date.now(),
      date: form.date || todayKey(),
      time: nowTime(),
      loggedAtISO: new Date().toISOString(),
      type: form.type,
      title: form.title || form.type,
      minutes,
      intensity: form.intensity,
      kcal: Math.round(minutes * (KCAL_PER_MIN[form.intensity] || 7))
    };
    S.data.workouts.unshift(w);
    S.data.workouts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    persist();
    S.modal = null;
    S.historyDate = w.date;
    toast(w.date === todayKey() ? 'Workout logged — meal matches updated' : 'Workout saved to ' + prettyDate(w.date));
    render();
  }

  // ------------------------------------------------------------------
  // Chef Didi Order & Kitchen Platform Engine (Proxied via /api/didi-orders)
  // ------------------------------------------------------------------
  function normalizeDidiOrders(raw) {
    if (!raw) return [];
    const list = Array.isArray(raw) ? raw : Object.values(raw);
    return list
      .filter((x) => x && x.id && x.mealName)
      .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  }

  let lastDidiOrdersHash = '';
  async function fetchDidiOrders() {
    try {
      const res = await apiRequest('/api/didi-orders', 'GET');
      const list = normalizeDidiOrders(res && res.orders);
      const newHash = list.map((o) => `${o.id}_${o.status}`).join('|');
      const changed = newHash !== lastDidiOrdersHash;
      lastDidiOrdersHash = newHash;

      S.didiOrders = list;
      S.didiConnected = true;
      Store.saveDidiOrders(list);

      // Alert athlete in real time if Chef Didi has reached
      list.forEach((o) => {
        if (o && o.status === 'reached' && !S.notifiedReachedOrders.has(o.id)) {
          S.notifiedReachedOrders.add(o.id);
          S.dismissedReachedBanner = false;
          toast(`CHEF DIDI HAS REACHED! She is at your door ready to cook "${o.mealName}" in your kitchen.`);
        }
      });

      // ONLY re-render if data actually changed, and NEVER while user is inside a modal or typing!
      if (changed) {
        if (S.modal) return list;
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return list;
        if (S.view === 'didi' || S.view === 'dashboard') render();
      }
      return list;
    } catch (e) {
      console.warn('[Chef Didi] Fetch fallback:', e.message);
      return S.didiOrders;
    }
  }

  function subscribeDidiOrders() {
    fetchDidiOrders();
    if (!window.__zapDidiPoll) {
      window.__zapDidiPoll = setInterval(() => {
        if (S.view === 'didi' || (S.view === 'dashboard' && !S.modal)) fetchDidiOrders();
      }, 3000);
    }
  }

  function openDidiPaymentModal(mealId) {
    const m = MEALS.find((x) => x.id === mealId);
    if (!m) return;
    S.pendingPaymentMealId = mealId;
    S.modal = 'didi-payment';
    render();
  }

  async function confirmDidiPayment(mealId) {
    const m = MEALS.find((x) => x.id === (mealId || S.pendingPaymentMealId));
    if (!m) return;

    // Extract user contact and address input from the booking modal
    const nameInput = document.getElementById('didi-name');
    const phoneInput = document.getElementById('didi-phone');
    const emailInput = document.getElementById('didi-email');
    const addressInput = document.getElementById('didi-address');

    const orderName = (nameInput?.value || '').trim() || (S.data?.answers?.name || S.user?.name || 'Athlete');
    const orderPhone = (phoneInput?.value || '').trim();
    const orderEmail = (emailInput?.value || '').trim();
    const orderAddress = (addressInput?.value || '').trim();

    if (!orderPhone || orderPhone.length < 8) {
      toast('Please enter your valid phone number so Chef Didi can contact you.');
      phoneInput?.focus();
      return;
    }
    if (!orderEmail || !orderEmail.includes('@')) {
      toast('Please enter a valid email address.');
      emailInput?.focus();
      return;
    }
    if (!orderAddress || orderAddress.length < 6) {
      toast('Please enter your complete kitchen / flat address.');
      addressInput?.focus();
      return;
    }

    try {
      localStorage.setItem('zapfit:saved_name', orderName);
      localStorage.setItem('zapfit:saved_phone', orderPhone);
      localStorage.setItem('zapfit:saved_email', orderEmail);
      localStorage.setItem('zapfit:saved_address', orderAddress);
    } catch (e) {}

    const r = S.data && S.data.profile && S.data.answers ? scoreMeal(m) : null;
    const session = S.data && S.data.profile ? currentSession() : null;
    const ans = S.data?.answers || {};
    const allergies = (ans.allergy || []).filter((x) => x !== 'None');
    const sessionText = session
      ? (session.logged ? `${session.workout.title} (${session.workout.type} · ${session.workout.minutes} min)` : session.strategy.workout_type)
      : (m.recommended_post_workout || 'Post-Workout Recovery');

    const nowMs = Date.now();
    const orderId = 'DIDI_' + nowMs + '_' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderNumber = '#DIDI-' + String(nowMs).slice(-4);
    const steps = (m.steps && m.steps.length) ? m.steps : [
      'Verify required ingredients in athlete pantry and kitchen prep area.',
      'Cook the primary protein and carbohydrate components according to athlete nutrition guidelines.',
      'Sauté fresh vegetables, season to taste, and serve warm for immediate post-workout recovery.'
    ];

    const order = {
      id: orderId,
      orderNumber,
      createdAt: nowMs,
      createdAtISO: new Date(nowMs).toISOString(),
      date: todayKey(),
      time: nowTime(),
      status: 'pending', // pending -> en_route -> reached -> cooking -> completed
      paymentStatus: 'paid',
      price: 249,
      mealId: m.id,
      mealName: m.name,
      category: m.category || 'Athlete Meal',
      recommendedPostWorkout: m.recommended_post_workout || 'Recovery',
      benefits: m.benefits || '',
      matchScore: r && r.allowed ? r.total : 95,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      calories: m.calories,
      prepTime: m.prep_time || '8 mins',
      cookTime: m.cook_time || '12 mins',
      ingredients: m.ingredients || [],
      steps,
      micronutrients: m.micronutrients || [],
      allergensPresent: m.allergens_present || [],
      cookedWithAthletePantry: true,
      didiCarriesFood: false,
      athlete: {
        uid: S.user?.uid || 'guest',
        name: orderName,
        address: orderAddress,
        phone: orderPhone,
        email: orderEmail,
        diet: ans.diet || m.category || 'Standard',
        allergies,
        disliked: ans.disliked || '',
        goal: (ans.purpose || []).join(', ') || 'Athletic Recovery',
        workoutSession: sessionText
      }
    };

    // Update local state immediately for instant UI response
    S.didiOrders = [order, ...S.didiOrders.filter((o) => o.id !== order.id)];
    Store.saveDidiOrders(S.didiOrders);

    if (S.data) {
      if (!Array.isArray(S.data.didiOrders)) S.data.didiOrders = [];
      S.data.didiOrders.unshift(order);
      persist();
    }

    // Push order to Firebase via secure backend endpoint
    apiRequest('/api/didi-orders', 'POST', order)
      .then(() => { S.didiConnected = true; })
      .catch((e) => console.warn('[Chef Didi] Order push error:', e.message));

    S.modal = null;
    S.pendingPaymentMealId = null;
    toast(`Payment Verified! Booked “${m.name}” with Chef Didi (${orderNumber})!`);
    render();
  }

  function getOrderSteps(o) {
    if (o && Array.isArray(o.steps) && o.steps.length) return o.steps;
    return [
      'Gather and measure all fresh ingredients and spices carried in your kit.',
      'Cook the primary protein and carbohydrate components according to athlete nutrition guidelines.',
      'Sauté fresh vegetables, season to taste, and serve warm for immediate post-workout recovery.'
    ];
  }

  function getOrderCheckedSteps(orderId) {
    if (!orderId) return {};
    if (!S.didiCheckedSteps) S.didiCheckedSteps = {};
    if (!S.didiCheckedSteps[orderId]) {
      const saved = Store.loadDidiCheckedSteps(orderId);
      const target = (S.didiOrders || []).find((x) => x.id === orderId);
      const fromTarget = (target && target.completedSteps && typeof target.completedSteps === 'object') ? target.completedSteps : null;
      S.didiCheckedSteps[orderId] = fromTarget || saved || {};
    }
    return S.didiCheckedSteps[orderId];
  }

  function areAllStepsCompleted(order) {
    if (!order) return false;
    const steps = getOrderSteps(order);
    const checked = getOrderCheckedSteps(order.id);
    return steps.length > 0 && steps.every((_, idx) => !!checked[idx]);
  }

  function toggleOrderStep(orderId, stepIdx) {
    if (!orderId) return;
    const checked = getOrderCheckedSteps(orderId);
    checked[stepIdx] = !checked[stepIdx];
    Store.saveDidiCheckedSteps(orderId, checked);
    const target = (S.didiOrders || []).find((x) => x.id === orderId);
    if (target) {
      target.completedSteps = { ...checked };
      Store.saveDidiOrders(S.didiOrders);
      if (S.data && Array.isArray(S.data.didiOrders)) {
        const own = S.data.didiOrders.find((o) => o.id === orderId);
        if (own) own.completedSteps = target.completedSteps;
      }
      apiRequest('/api/didi-orders', 'PATCH', { id: orderId, completedSteps: target.completedSteps })
        .catch(() => {});

      const steps = getOrderSteps(target);
      const done = steps.filter((_, i) => !!checked[i]).length;
      if (done === steps.length) {
        toast(`All ${steps.length} steps completed! You can now approve and complete this meal.`);
      }
    }
  }

  async function didiStartTrip(orderId) {
    const target = S.didiOrders.find((o) => o.id === orderId);
    if (!target) return;
    await updateDidiOrderStatus(orderId, 'en_route');
    S.didiActiveOrderId = orderId;
    S.didiView = 'map';
    Store.saveDidiActiveOrder(orderId);
    toast(`Started trip to ${target.athlete?.name || 'Customer'}'s location!`);
    render();
  }

  async function didiMarkReached(orderId) {
    const target = S.didiOrders.find((o) => o.id === orderId);
    if (!target) return;
    await updateDidiOrderStatus(orderId, 'reached');
    S.didiActiveOrderId = orderId;
    S.didiView = 'cooking';
    getOrderCheckedSteps(orderId);
    Store.saveDidiActiveOrder(orderId);
    toast(`Reached! Customer notified that you have arrived at their kitchen.`);
    render();
  }

  async function didiCompleteOrder(orderId) {
    const target = S.didiOrders.find((o) => o.id === orderId);
    if (!target) return;

    // The meal should not be approved until and unless all steps are completed by Chef Didi
    if (!areAllStepsCompleted(target)) {
      const steps = getOrderSteps(target);
      const checked = getOrderCheckedSteps(orderId);
      const remaining = steps.filter((_, idx) => !checked[idx]).length;
      toast(`Cannot approve meal: Chef Didi must finish all ${steps.length} cooking steps (${remaining} remaining)!`);
      return;
    }

    await updateDidiOrderStatus(orderId, 'completed');
    S.didiWallet = (S.didiWallet || 0) + 250;
    Store.saveDidiWallet(S.didiWallet);
    S.didiActiveOrderId = null;
    Store.saveDidiActiveOrder(null);
    S.didiView = 'payout';
    toast(`Meal approved! ₹250 Credited to Chef Didi account!`);
    render();
  }

  async function updateDidiOrderStatus(orderId, newStatus) {
    const target = S.didiOrders.find((o) => o.id === orderId);
    if (!target) return;

    // Guard: completed status requires all steps completed
    if (newStatus === 'completed' && !areAllStepsCompleted(target)) {
      const steps = getOrderSteps(target);
      const checked = getOrderCheckedSteps(orderId);
      const remaining = steps.filter((_, idx) => !checked[idx]).length;
      toast(`Cannot approve meal: All ${steps.length} cooking steps must be completed by Chef Didi first (${remaining} remaining).`);
      return;
    }
    target.status = newStatus;
    target.updatedAt = Date.now();
    target.updatedAtISO = new Date().toISOString();
    Store.saveDidiOrders(S.didiOrders);

    if (S.data && Array.isArray(S.data.didiOrders)) {
      const own = S.data.didiOrders.find((o) => o.id === orderId);
      if (own) { own.status = newStatus; own.updatedAt = target.updatedAt; persist(); }
    }

    apiRequest('/api/didi-orders', 'PATCH', { id: orderId, status: newStatus, updatedAt: target.updatedAt, updatedAtISO: target.updatedAtISO })
      .catch((e) => console.warn('[Chef Didi] Status update error:', e.message));

    const statusLabels = {
      pending: 'marked Pending',
      en_route: 'Departed on the way',
      reached: 'Arrived at Customer location',
      cooking: 'Cooking in Kitchen',
      ready: 'marked Ready to Serve',
      completed: 'Completed'
    };
    toast(`Order ${target.orderNumber || ''} ${statusLabels[newStatus] || 'updated'}`);
    render();
  }

  async function deleteDidiOrder(orderId) {
    const target = S.didiOrders.find((o) => o.id === orderId);
    if (!window.confirm(`Remove order ${target?.orderNumber || ''} (${target?.mealName || ''})?`)) return;
    S.didiOrders = S.didiOrders.filter((o) => o.id !== orderId);
    if (S.didiActiveOrderId === orderId) {
      S.didiActiveOrderId = null;
      Store.saveDidiActiveOrder(null);
      if (S.didiView === 'map' || S.didiView === 'cooking') S.didiView = 'orders';
    }
    Store.saveDidiOrders(S.didiOrders);

    if (S.data && Array.isArray(S.data.didiOrders)) {
      S.data.didiOrders = S.data.didiOrders.filter((o) => o.id !== orderId);
      persist();
    }

    lastDidiOrdersHash = S.didiOrders.map((o) => `${o.id}_${o.status}`).join('|');
    apiRequest('/api/didi-orders?id=' + encodeURIComponent(orderId), 'DELETE').catch(() => {});
    if (S.modal === 'didi-recipe' && S.selectedOrderId === orderId) S.modal = null;
    toast(`Removed order ${target?.orderNumber || ''}`);
    render();
  }

  async function clearAllDidiOrders() {
    if (!S.didiOrders.length) {
      toast('No orders to clear.');
      return;
    }
    if (!window.confirm('Are you sure you want to remove ALL orders from Chef Didi?')) return;
    S.didiOrders = [];
    S.didiActiveOrderId = null;
    Store.saveDidiOrders([]);
    Store.saveDidiActiveOrder(null);
    if (S.data && Array.isArray(S.data.didiOrders)) {
      S.data.didiOrders = [];
      persist();
    }
    if (S.didiView === 'map' || S.didiView === 'cooking') S.didiView = 'orders';
    lastDidiOrdersHash = '';
    apiRequest('/api/didi-orders?all=1', 'DELETE').catch(() => {});
    toast('All orders removed from Chef Didi!');
    render();
  }

  // ------------------------------------------------------------------
  // Toast
  // ------------------------------------------------------------------
  let toastTimer = null;
  function toast(msg) {
    S.toast = msg;
    renderToast();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { S.toast = null; renderToast(); }, 3200);
  }
  function renderToast() {
    const el = $('zapToast');
    if (!el) return;
    el.style.display = S.toast ? 'block' : 'none';
    el.innerHTML = S.toast ? `<div class="toast">${icon('check', 16)}<span>${esc(S.toast)}</span></div>` : '';
  }

  // ------------------------------------------------------------------
  // Render: shared pieces
  // ------------------------------------------------------------------
  function brand(sub) {
    const label = sub && sub !== 'CONNECT' && sub !== 'ATHLETE' ? sub : '';
    return `<button class="brand" data-action="logo" aria-label="ZAP FIT home">
      <span class="brand-mark"><img src="/logo-mark.png" alt="ZAP FIT Logo" class="brand-logo-img"></span>
      <span style="text-align:left"><span class="brand-name">ZAP FIT<sup>TM</sup></span>${label ? `<span class="brand-sub">${esc(label)}</span>` : ''}</span>
    </button>`;
  }
  function themeBtn() {
    return `<button class="icon-btn" data-action="theme" aria-label="Switch to ${S.theme === 'dark' ? 'light' : 'dark'} mode">${icon(S.theme === 'dark' ? 'sun' : 'moon', 17)}</button>`;
  }
  function userChip() {
    if (!S.user) return '';
    const initials = firstName(S.user.name).slice(0, 1).toUpperCase();
    return `<div class="user-chip"><span class="avatar">${S.user.photo ? `<img src="${esc(S.user.photo)}" alt="" referrerpolicy="no-referrer">` : esc(initials)}</span><span>${esc(firstName(S.user.name))}</span></div>`;
  }
  function ring(p, light) {
    return `<div class="ring ${light ? 'light' : ''}" style="--p:${p}"><div><div><b>${p}</b><span>MATCH</span></div></div></div>`;
  }
  function progress(v, max, cls) {
    const p = max > 0 ? Math.min(100, (v / max) * 100) : 0;
    return `<div class="progress ${cls || ''} ${v > max * 1.05 ? 'over' : ''}"><i style="width:${p}%"></i></div>`;
  }

  // ------------------------------------------------------------------
  // Render: landing
  // ------------------------------------------------------------------
  function renderLanding() {
    return `
    <header class="topbar"><div class="container topbar-inner">
      ${brand('CONNECT')}
      <div class="top-actions">
        <button class="btn btn-ghost btn-sm hide-sm" data-action="scroll" data-target="how">How it works</button>
        ${themeBtn()}
        <button class="btn btn-secondary btn-sm" data-action="open-auth" data-tab="signin">Sign in</button>
        <button class="btn btn-primary btn-sm" data-action="open-auth" data-tab="signup">Get started</button>
      </div>
    </div></header>

    <main class="container">
      <section class="hero">
        <div>
          <span class="pill">${icon('sparkle', 14)} Post-workout nutrition, personalised</span>
          <h1>From your workout to the <em>right recovery meal.</em></h1>
          <p class="hero-lead">Tell ZAP FIT how you train and eat. Our AI sets your daily targets, then every meal is ranked for today's session — with the reasons shown, never a black box.</p>
          <div class="row wrap hero-cta">
            <button class="btn btn-primary btn-lg" data-action="open-auth" data-tab="signup">Create your plan ${icon('arrow', 16)}</button>
            <button class="btn btn-secondary btn-lg" data-action="open-auth" data-tab="signin">I already have an account</button>
          </div>
          <div class="row wrap small muted" style="margin-top:20px;gap:14px">
            <span class="row" style="gap:6px">${icon('shield', 15)} Allergy-safe filtering</span>
            <span class="row" style="gap:6px">${icon('plate', 15)} 75 athlete meals</span>
            <span class="row" style="gap:6px">${icon('calendar', 15)} Meal & workout diary</span>
          </div>
        </div>
        <div class="card-hero">
          <div class="row-between" style="margin-bottom:18px">
            <span class="badge badge-solid">TODAY'S TOP MATCH</span>
            <span class="xs mono hero-2">After 65 min strength</span>
          </div>
          <div class="row-between" style="align-items:flex-start;margin-bottom:16px">
            <div class="grow"><h3 style="font-size:22px">Paneer Tikka Quinoa Bowl</h3><p class="small hero-2" style="margin-top:4px">High-leucine protein with steady carbs to refill glycogen.</p></div>
            ${ring(94)}
          </div>
          <div class="macro-grid" style="margin-bottom:16px">
            <div class="macro"><span>PROTEIN</span><b class="hl">36g</b></div>
            <div class="macro"><span>CARBS</span><b>48g</b></div>
            <div class="macro"><span>FAT</span><b>14g</b></div>
            <div class="macro"><span>KCAL</span><b>470</b></div>
          </div>
          <div class="stack-sm">
            ${[['Training fit', 24, 25], ['Remaining needs', 23, 25], ['Goal fit', 14, 15], ['Taste & feedback', 13, 15], ['Recovery timing', 20, 20]].map(([n, v, m]) => `<div class="factor"><span class="lbl">${n}</span>${progress(v, m)}<span class="val">${v}/${m}</span></div>`).join('')}
          </div>
        </div>
      </section>

      <section class="section" id="how">
        <div class="section-head"><span class="eyebrow">How it works</span><h2>Three steps to your recovery plan</h2><p>No guesswork and no generic meal plans.</p></div>
        <div class="steps-grid">
          ${[['Sign in', 'Use Google or email. Your data is tied to your account.'], ['Answer 9 questions', 'Goals, body stats, training, diet, allergies and meal habits.'], ['Get your plan', 'ZAP FIT AI sets your targets, then ranks meals after every workout.']].map(([t, d], i) => `<div class="card"><div class="step-num">${i + 1}</div><h3 style="font-size:17px;margin-bottom:6px">${t}</h3><p class="small ink-2">${d}</p></div>`).join('')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><span class="eyebrow">The Meal Match score</span><h2>A score you can read</h2><p>Diet and allergies are pass/fail safety rules — never traded off against taste. Then five factors build the score.</p></div>
        <div class="factor-grid">
          ${[['Training fit', 25, 'Macro split matched to the session you just did.'], ['Remaining needs', 25, 'Protein and calories you still need today.'], ['Goal fit', 15, 'Muscle gain, fat loss or endurance.'], ['Taste & feedback', 15, 'Skips dislikes and keeps your meals varied.'], ['Recovery timing', 20, 'Built for this type of workout and digests well after training.']].map(([n, m, d]) => `<div class="card factor-card"><span class="badge badge-accent">${m} pts</span><h4>${n}</h4><p>${d}</p></div>`).join('')}
        </div>
      </section>

      <section class="section"><div class="card cta">
        <h2>Ready to eat for your training?</h2>
        <p>It takes about two minutes to set up.</p>
        <button class="btn btn-primary btn-lg" data-action="open-auth" data-tab="signup">Get started ${icon('arrow', 16)}</button>
      </div></section>
    </main>
    <footer class="footer"><div class="container row-between wrap"><span>© ${new Date().getFullYear()} ZAP FIT Connect</span><span>Nutrition guidance only — not medical advice.</span></div></footer>`;
  }

  // ------------------------------------------------------------------
  // Render: onboarding (full page, no skip)
  // ------------------------------------------------------------------
  function renderOnboarding() {
    const i = S.onb.step, st = ONB[i], a = S.onb.answers;
    let body = '';
    if (st.k === 'basic') {
      body = `<div class="stack">
        <div class="field"><label for="ob-name">Name</label><input class="input" id="ob-name" value="${esc(a.name)}" placeholder="Your name" autocomplete="name"></div>
        <div class="grid-2">
          <div class="field"><label for="ob-age">Age</label><input class="input" id="ob-age" type="number" inputmode="numeric" min="13" max="90" value="${esc(a.age)}" placeholder="e.g. 24"></div>
          <div class="field"><label for="ob-gender">Gender</label><select class="input" id="ob-gender">
            <option value="" ${!a.gender ? 'selected' : ''} disabled>Select</option>
            ${['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((g) => `<option ${a.gender === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select></div>
        </div>
        <div class="grid-2">
          <div class="field"><label for="ob-height">Height (cm)</label><input class="input" id="ob-height" type="number" inputmode="decimal" value="${esc(a.height)}" placeholder="e.g. 176"></div>
          <div class="field"><label for="ob-weight">Weight (kg)</label><input class="input" id="ob-weight" type="number" inputmode="decimal" value="${esc(a.weight)}" placeholder="e.g. 71"></div>
        </div>
      </div>`;
    } else {
      const sel = a[st.k];
      const isOn = (v) => (st.multi ? sel.includes(v) : sel === v);
      body = `${st.k === 'allergy' ? `<div class="note warn" style="margin-bottom:14px"><b>Safety first.</b> ZAP FIT filters meals but cannot guarantee an allergen-free kitchen. Keep your usual medication with you.</div>` : ''}
        <div class="opts ${st.opts.length > 6 ? 'two' : ''}">
          ${st.opts.map((v) => `<button type="button" class="opt ${st.multi ? 'multi' : ''} ${isOn(v) ? 'on' : ''}" data-action="ob-opt" data-v="${esc(v)}">
            <span>${esc(v)}${st.k === 'eat' && isOn(v) ? `<small>Usually around ${MEAL_TIMES[v]}</small>` : ''}</span>
            <span class="tick">${icon('check', 14)}</span></button>`).join('')}
        </div>
        ${st.k === 'training' ? `<div class="card" style="margin-top:16px"><div class="row-between" style="margin-bottom:10px"><b>Training days per week</b><span class="mono accent-text">${a.days} days</span></div>
          <div class="days">${[1, 2, 3, 4, 5, 6, 7].map((d) => `<button type="button" class="day ${a.days === d ? 'on' : ''}" data-action="ob-days" data-d="${d}">${d}</button>`).join('')}</div></div>` : ''}
        ${st.k === 'diet' ? `<div class="field" style="margin-top:16px"><label for="ob-disliked">Foods you dislike (optional)</label><input class="input" id="ob-disliked" value="${esc(a.disliked)}" placeholder="e.g. mushrooms, bitter gourd"></div>` : ''}
        ${st.k === 'health' && a.health && a.health !== 'None' ? `<div class="note" style="margin-top:14px"><b>Good to know.</b> Keep following your professional's guidance — ZAP FIT will not change your meals for a medical condition.</div>` : ''}`;
    }

    return `
    <div class="onb-page">
      <header class="topbar"><div class="container topbar-inner">
        ${brand('ATHLETE SETUP')}
        <div class="top-actions">${themeBtn()}${userChip()}<button class="btn btn-ghost btn-sm" data-action="signout">${icon('logout', 15)}<span class="hide-sm">Sign out</span></button></div>
      </div></header>
      <main class="onb-main"><div class="onb-card">
        <div class="row-between"><span class="eyebrow">Question ${i + 1} of ${ONB.length}</span><span class="xs muted">Required to build your plan</span></div>
        <div class="onb-progress">${ONB.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div>
        <h1 class="onb-q">${esc(st.q)}</h1>
        <p class="onb-sub">${esc(st.sub)}</p>
        ${body}
        ${S.onb.error ? `<div class="form-error" style="margin-top:16px">${esc(S.onb.error)}</div>` : ''}
        <div class="onb-nav">
          ${i > 0 ? `<button class="btn btn-secondary" data-action="ob-back">${icon('left', 16)} Back</button>` : '<span></span>'}
          <button class="btn btn-primary" data-action="ob-next">${i === ONB.length - 1 ? `Build my plan ${icon('sparkle', 16)}` : `Continue ${icon('right', 16)}`}</button>
        </div>
      </div></main>
    </div>`;
  }

  function renderCalibrating() {
    return `
    <div class="onb-page">
      <header class="topbar"><div class="container topbar-inner">${brand('ATHLETE SETUP')}<div class="top-actions">${themeBtn()}${userChip()}</div></div></header>
      <main class="onb-main"><div class="onb-card">
        <span class="badge badge-accent">${icon('sparkle', 13)} ZAP FIT AI</span>
        <h1 class="onb-q" style="margin-top:14px">Building your recovery plan…</h1>
        <p class="onb-sub">Your answers are being analysed. This takes a few seconds.</p>
        <div class="calib-steps">
          ${CALIB_STEPS.map((t, j) => `<div class="calib-step ${j < S.calib.stage ? 'done' : j === S.calib.stage ? 'active' : ''}"><span class="calib-dot">${j < S.calib.stage ? icon('check', 13) : ''}</span>${t}</div>`).join('')}
        </div>
      </div></main>
    </div>`;
  }

  function renderCalibrated() {
    const p = S.data.profile, a = S.data.answers;
    return `
    <div class="onb-page">
      <header class="topbar"><div class="container topbar-inner">${brand('ATHLETE SETUP')}<div class="top-actions">${themeBtn()}${userChip()}</div></div></header>
      <main class="onb-main"><div class="onb-card">
        <span class="badge badge-accent">${icon('check', 13)} Plan ready</span>
        <h1 class="onb-q" style="margin-top:14px">${esc(firstName(a.name))}, here are your daily targets</h1>
        <p class="onb-sub">Plan: <b class="ink-2">${esc(p.focus)}</b> · ${esc(p.macroRatio)}</p>
        <div class="target-grid">
          <div class="stat"><div class="stat-label">Calories</div><div class="stat-value">${p.caloriesTarget}<small> kcal</small></div></div>
          <div class="stat"><div class="stat-label">Protein</div><div class="stat-value accent-text">${p.proteinTarget}<small> g</small></div></div>
          <div class="stat"><div class="stat-label">Carbs</div><div class="stat-value">${p.carbsTarget}<small> g</small></div></div>
          <div class="stat"><div class="stat-label">Fat</div><div class="stat-value">${p.fatTarget}<small> g</small></div></div>
        </div>
        <div class="card" style="margin-top:16px">
          <div class="row" style="margin-bottom:8px"><span class="list-icon">${icon('sparkle', 17)}</span><b>Your recovery strategy</b></div>
          <p class="ink-2 small">${esc(p.recoveryStrategy)}</p>
          <div class="check-list" style="margin-top:12px">${p.tips.map((t) => `<div>${icon('check', 15)}<span>${esc(t)}</span></div>`).join('')}</div>
        </div>
        ${(a.allergy || []).filter((x) => x !== 'None').length ? `<div class="note warn" style="margin-top:14px"><b>Safety gate on:</b> meals with ${esc(a.allergy.filter((x) => x !== 'None').join(', '))} will never be recommended.</div>` : ''}
        <div class="onb-nav"><button class="btn btn-secondary" data-action="restart-onb">${icon('left', 16)} Edit answers</button><button class="btn btn-primary btn-lg" data-action="go-dashboard">Go to my dashboard ${icon('arrow', 16)}</button></div>
      </div></main>
    </div>`;
  }

  // ------------------------------------------------------------------
  // Render: dashboard
  // ------------------------------------------------------------------
  function renderDashboard() {
    const pantryCount = Object.keys(S.data?.pantry || {}).filter((k) => S.data.pantry[k]).length;
    const tabs = [
      ['today', 'Today', 'home'],
      ['pantry', 'Pantry', 'box', pantryCount ? String(pantryCount) : ''],
      ['meals', 'Meals', 'plate'],
      ['history', 'History', 'calendar', (S.data.meals.length + S.data.workouts.length) || ''],
      ['supplements', 'Supplements', 'pill'],
      ['profile', 'Profile', 'user']
    ];
    let content = '';
    if (S.tab === 'today') content = renderToday();
    else if (S.tab === 'pantry') content = renderPantryTab();
    else if (S.tab === 'history') content = renderHistory();
    else if (S.tab === 'meals') content = renderMealsTab();
    else if (S.tab === 'supplements') content = renderSupplements();
    else content = renderProfile();

    return `
    <header class="topbar"><div class="container topbar-inner">
      ${brand('ATHLETE')}
      <div class="top-actions">
        <button class="btn btn-primary btn-sm" data-action="open-workout" aria-label="Log workout">${icon('plus', 15)}<span class="hide-sm">Log workout</span></button>
        <button class="btn btn-secondary btn-sm" data-action="open-ai" aria-label="AI coach">${icon('sparkle', 15)}<span class="hide-sm">AI coach</span></button>
        ${themeBtn()}${userChip()}
        <button class="icon-btn" data-action="signout" aria-label="Sign out">${icon('logout', 16)}</button>
      </div>
    </div></header>
    <nav class="tabbar" aria-label="Primary navigation"><div class="container tabs">
      ${tabs.map(([k, l, ic, c]) => `<button class="tab ${S.tab === k ? 'on' : ''}" data-action="tab" data-tab="${k}">${icon(ic, 17)}<span class="tab-lbl">${l}</span>${c ? `<span class="count">${c}</span>` : ''}</button>`).join('')}
    </div></nav>
    <main class="container page">${content}</main>`;
  }

  function statCard(label, ic, v, max, unit, cls) {
    const left = Math.round(max - v);
    return `<div class="stat">
      <div class="stat-label">${icon(ic, 14)} ${label}</div>
      <div class="stat-value">${Math.round(v)}<small> / ${max} ${unit}</small></div>
      ${progress(v, max, cls)}
      <div class="stat-foot"><span>${left >= 0 ? `${left} ${unit} left` : `${-left} ${unit} over`}</span><span>${pct(v, max)}%</span></div>
    </div>`;
  }

  function statusBadgeHTML(status) {
    const st = status || 'pending';
    const map = {
      pending: ['pending', `${icon('clock', 12)} New Booking · Paid`],
      en_route: ['en_route', `${icon('scooter', 12)} On the Way`],
      reached: ['reached', `${icon('pin', 12)} Arrived at Location`],
      cooking: ['cooking', `${icon('cooking', 12)} Cooking in Kitchen`],
      preparing: ['cooking', `${icon('cooking', 12)} Cooking in Kitchen`],
      ready: ['ready', `${icon('plate', 12)} Ready to Serve`],
      completed: ['completed', `${icon('check', 12)} Completed & Paid`]
    };
    const [cls, lbl] = map[st] || ['pending', st];
    return `<span class="didi-status ${cls}">${lbl}</span>`;
  }

  function renderToday() {
    const p = S.data.profile;
    const eaten = todayMeals(), wk = todayWorkouts();
    const { ok, hidden } = rankedMeals();
    const top = ok[0];
    const more = ok.slice(1, 5);
    const session = currentSession();
    const trainMin = sum(wk, 'minutes');
    const todayOrders = (S.didiOrders || []).filter((o) => o.date === todayKey() && (!S.user || !o.athlete?.uid || o.athlete.uid === S.user.uid || o.athlete.uid === 'guest')).slice(0, 5);
    const activeDidi = (S.didiOrders || []).find((o) => ['pending', 'en_route', 'reached', 'cooking', 'preparing'].includes(o.status));

    let activeDidiBannerHTML = '';
    if (activeDidi) {
      if (activeDidi.status === 'reached' && !S.dismissedReachedBanner) {
        activeDidiBannerHTML = `
        <div class="user-reached-banner">
          <div class="row-between wrap" style="gap:10px">
            <div class="row" style="gap:10px">
              <span class="accent-text" style="display:grid;place-items:center">${icon('bell', 28)}</span>
              <div>
                <div style="font-size:16px;font-weight:800;color:var(--ink)">CHEF DIDI HAS REACHED YOUR LOCATION!</div>
                <div style="font-size:13.5px;color:var(--ink);margin-top:2px">
                  Chef Didi is at your door ready to cook <b>${esc(activeDidi.mealName)}</b> in your kitchen using your pantry ingredients. Please let her in and show her to your kitchen.
                </div>
              </div>
            </div>
            <div class="row" style="gap:8px">
              <a href="/didi" class="btn btn-didi btn-sm" target="_blank" rel="noopener">Open /didi Phone App ↗</a>
              <button class="icon-btn sm" data-action="dismiss-reached-banner" title="Dismiss">${icon('close', 14)}</button>
            </div>
          </div>
          <div class="didi-food-bag-banner" style="margin-top:10px;margin-bottom:0">
            <div class="icon">${icon('cooking', 20)}</div>
            <div class="xs"><b>Home Kitchen Cooking:</b> Chef Didi prepares this recovery meal directly in your kitchen using your fresh pantry items. Enjoy fresh athletic nutrition!</div>
          </div>
        </div>`;
      } else if (activeDidi.status === 'en_route') {
        activeDidiBannerHTML = `
        <div class="card" style="border:1.5px solid #4285F4;background:rgba(66,133,244,0.06);margin-bottom:18px">
          <div class="row-between wrap" style="gap:10px">
            <div class="row" style="gap:10px">
              <span style="color:#4285F4;display:grid;place-items:center">${icon('scooter', 26)}</span>
              <div>
                <div style="font-weight:800;color:var(--ink);font-size:15px">Chef Didi is on the way to your home!</div>
                <div class="xs muted">On the way to your home for <b>${esc(activeDidi.mealName)}</b> · ETA: ~6 mins</div>
              </div>
            </div>
            <a href="/didi" class="btn btn-secondary btn-sm" target="_blank" rel="noopener">Track on /didi ↗</a>
          </div>
        </div>`;
      } else if (activeDidi.status === 'cooking' || activeDidi.status === 'preparing') {
        activeDidiBannerHTML = `
        <div class="card" style="border:1.5px solid #D06828;background:rgba(208,104,40,0.06);margin-bottom:18px">
          <div class="row-between wrap" style="gap:10px">
            <div class="row" style="gap:10px">
              <span style="color:#D06828;display:grid;place-items:center">${icon('cooking', 26)}</span>
              <div>
                <div style="font-weight:800;color:var(--ink);font-size:15px">Chef Didi is currently cooking in your kitchen!</div>
                <div class="xs muted">Preparing <b>${esc(activeDidi.mealName)}</b> using your pantry ingredients.</div>
              </div>
            </div>
            <a href="/didi" class="btn btn-didi btn-sm" target="_blank" rel="noopener">Kitchen Status ↗</a>
          </div>
        </div>`;
      } else if (activeDidi.status === 'pending') {
        activeDidiBannerHTML = `
        <div class="card" style="border:1.5px solid var(--warn);background:rgba(248,216,88,0.06);margin-bottom:18px">
          <div class="row-between wrap" style="gap:10px">
            <div class="row" style="gap:10px">
              <span style="color:var(--warn);display:grid;place-items:center">${icon('clock', 26)}</span>
              <div>
                <div style="font-weight:800;color:var(--ink);font-size:15px">Order Confirmed · Chef Didi Dispatched</div>
                <div class="xs muted">Order ${esc(activeDidi.orderNumber)} for <b>${esc(activeDidi.mealName)}</b> is ready for Chef Didi to start trip.</div>
              </div>
            </div>
            <a href="/didi" class="btn btn-secondary btn-sm" target="_blank" rel="noopener">Open /didi Phone App ↗</a>
          </div>
        </div>`;
      }
    }

    return `
    <div class="page-head">
      <div><p class="small muted">${prettyDate(todayKey())}</p><h1 class="page-title">${greeting()}, ${esc(firstName(S.data.answers.name || S.user.name))}</h1></div>
      <div class="row wrap" style="gap:8px">
        <span class="badge badge-accent"><span class="live-dot" style="margin-right:4px"></span> Firebase Synced</span>
        <span class="badge badge-accent">${icon('shield', 13)} ${esc(S.data.answers.diet)}${(S.data.answers.allergy || []).filter((x) => x !== 'None').length ? ' · no ' + esc(S.data.answers.allergy.filter((x) => x !== 'None').join(', ')) : ''}</span>
      </div>
    </div>

    ${activeDidiBannerHTML}

    <div class="stat-grid">
      ${statCard('Protein', 'flame', sum(eaten, 'protein'), p.proteinTarget, 'g', '')}
      ${statCard('Carbs', 'bolt', sum(eaten, 'carbs'), p.carbsTarget, 'g', 'carb')}
      ${statCard('Calories', 'target', sum(eaten, 'calories'), p.caloriesTarget, 'kcal', 'kcal')}
      <div class="stat">
        <div class="stat-label">${icon('dumbbell', 14)} Training</div>
        <div class="stat-value">${trainMin}<small> min</small></div>
        <div class="stat-foot" style="margin-top:0"><span>${wk.length ? `${wk.length} session${wk.length > 1 ? 's' : ''} · ${sum(wk, 'kcal')} kcal burned` : 'No session logged yet'}</span></div>
        <button class="btn btn-secondary btn-sm btn-block" style="margin-top:10px" data-action="open-workout">${icon('plus', 14)} Log workout</button>
      </div>
    </div>

    <div class="dash-grid">
      <div class="stack">
        ${top ? `
        <div class="card-hero">
          <div class="row-between wrap" style="margin-bottom:16px;gap:8px">
            <div class="row wrap" style="gap:8px;align-items:center">
              <span class="badge badge-solid">BEST MATCH RIGHT NOW</span>
              ${top.score.pantryMatch ? `
                <span class="pantry-match-badge ${top.score.pantryMatch.missing.length === 0 ? 'high' : top.score.pantryMatch.missing.length <= 2 ? 'med' : 'low'}">
                  ${icon('box', 13)} ${top.score.pantryMatch.missing.length === 0 ? '✓ 100% in Pantry (0 missing)' : `Pantry: ${top.score.pantryMatch.missing.length} missing (${top.score.pantryMatch.missing.join(', ')})`}
                </span>
              ` : ''}
            </div>
            <span class="xs hero-2">${session.logged ? `After ${esc(session.workout.title)} · ${session.workout.minutes} min` : `Based on your usual ${esc(session.strategy.workout_type)} training`}</span>
          </div>
          <div class="row-between" style="align-items:flex-start;margin-bottom:16px">
            <div class="grow"><h2 class="hero-meal-title">${esc(top.name)}</h2><p class="small hero-2" style="margin-top:4px">${esc(top.benefits)}</p></div>
            ${ring(top.score.total)}
          </div>
          <div class="macro-grid" style="margin-bottom:18px">
            <div class="macro"><span>PROTEIN</span><b class="hl">${top.protein}g</b></div>
            <div class="macro"><span>CARBS</span><b>${top.carbs}g</b></div>
            <div class="macro"><span>FAT</span><b>${top.fat}g</b></div>
            <div class="macro"><span>KCAL</span><b>${top.calories}</b></div>
          </div>
          <div class="hero-tile" style="margin-bottom:16px">
            <div class="row-between" style="margin-bottom:10px"><span class="eyebrow">Match breakdown</span><span class="xs mono hero-2">${top.score.total}/100</span></div>
            <div class="stack-sm">${FACTORS.map((f, j) => `<div class="factor"><span class="lbl">${f.name}</span>${progress(top.score.factors[j], f.max)}<span class="val">${top.score.factors[j]}/${f.max}</span></div>`).join('')}</div>
          </div>
          <div class="check-list" style="margin-bottom:14px">${top.score.why.map((w) => `<div>${icon('check', 15)}<span>${w}</span></div>`).join('')}</div>
          <div class="note" style="margin-bottom:18px"><b>Why not 100%?</b> ${top.score.not100}</div>
          <div class="row wrap hero-actions three">
            ${(() => {
              const topDidi = (S.didiOrders || []).find((o) =>
                o.mealId === top.id &&
                o.date === todayKey() &&
                (!S.user || !o.athlete?.uid || o.athlete.uid === S.user.uid || o.athlete.uid === 'guest')
              );
              if (topDidi) {
                if (topDidi.status !== 'completed') {
                  return `
                    <a href="/didi" target="_blank" rel="noopener" class="btn btn-didi">${icon('chef', 16)} Chef Didi Cooking (${topDidi.status})</a>
                    <button class="btn btn-secondary" data-action="log-meal" data-id="${top.id}" style="opacity:0.65;cursor:not-allowed" title="Chef Didi must complete all cooking steps before approving this meal">${icon('clock', 14)} Awaiting Chef Didi Approval</button>
                    <button class="btn btn-secondary" data-action="open-meal" data-id="${top.id}">${icon('sparkle', 14)} View recipe & steps</button>
                  `;
                }
                return `
                  <button class="btn btn-didi" data-action="order-didi" data-id="${top.id}">${icon('chef', 16)} Reorder with Chef Didi</button>
                  <button class="btn btn-primary" data-action="log-meal" data-id="${top.id}">${icon('check', 16)} Approve & Log Meal</button>
                  <button class="btn btn-secondary" data-action="open-meal" data-id="${top.id}">${icon('sparkle', 14)} View recipe & steps</button>
                `;
              }
              return `
                <button class="btn btn-didi" data-action="order-didi" data-id="${top.id}">${icon('chef', 16)} Cook with Chef Didi</button>
                <button class="btn btn-primary" data-action="log-meal" data-id="${top.id}">${icon('check', 16)} I ate this</button>
                <button class="btn btn-secondary" data-action="open-meal" data-id="${top.id}">${icon('sparkle', 14)} View recipe & steps</button>
              `;
            })()}
          </div>
        </div>` : `<div class="card empty">No meals match your diet and allergy settings. Update them in Profile.</div>`}

        <div class="card">
          <div class="card-head"><h3 class="card-title">More good matches</h3><button class="btn btn-ghost btn-sm" data-action="tab" data-tab="meals">See all ${icon('right', 14)}</button></div>
          <div class="stack-sm">
            ${more.map((m) => `<div class="list-row wrap">
              <span class="list-icon clickable" data-action="open-meal" data-id="${m.id}">${icon('plate', 17)}</span>
              <div class="grow clickable" data-action="open-meal" data-id="${m.id}">
                <div class="title">${esc(m.name)}</div>
                <div class="meta mono">${m.protein}g P · ${m.carbs}g C · ${m.fat}g F · ${m.calories} kcal</div>
                ${m.score.pantryMatch ? `
                  <div style="margin-top:2px">
                    <span class="pantry-match-badge ${m.score.pantryMatch.missing.length === 0 ? 'high' : m.score.pantryMatch.missing.length <= 2 ? 'med' : 'low'}" style="font-size:10px;padding:2px 7px">
                      ${icon('box', 11)} ${m.score.pantryMatch.missing.length === 0 ? '✓ 100% in Pantry' : `Pantry: ${m.score.pantryMatch.missing.length} missing (${m.score.pantryMatch.missing.join(', ')})`}
                    </span>
                  </div>
                ` : ''}
              </div>
              <div class="row" style="gap:8px">
                <span class="score-pill">${m.score.total}%</span>
                ${(() => {
                  const mDidi = (S.didiOrders || []).find((o) =>
                    o.mealId === m.id &&
                    o.date === todayKey() &&
                    (!S.user || !o.athlete?.uid || o.athlete.uid === S.user.uid || o.athlete.uid === 'guest')
                  );
                  if (mDidi && mDidi.status !== 'completed') {
                    return `<a href="/didi" target="_blank" rel="noopener" class="btn btn-didi btn-sm" title="Chef Didi is preparing this meal">${icon('chef', 14)} Chef Didi Cooking</a>`;
                  }
                  return `<button class="btn btn-didi btn-sm" data-action="order-didi" data-id="${m.id}" title="Send order to Chef Didi">${icon('chef', 14)} Cook with Chef Didi</button>`;
                })()}
              </div>
            </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <div class="card-head">
            <div class="row" style="gap:8px"><span class="list-icon didi-mark" style="width:30px;height:30px">${icon('chef', 15)}</span><h3 class="card-title">Chef Didi Orders</h3></div>
            <a class="btn btn-ghost btn-sm" href="/didi" target="_blank" rel="noopener">Open /didi ${icon('arrow', 13)}</a>
          </div>
          ${todayOrders.length ? `<div class="stack-sm">${todayOrders.map((o) => `<div class="list-row">
            <div class="grow">
              <div class="row-between" style="margin-bottom:4px"><span class="title">${esc(o.mealName)}</span>${statusBadgeHTML(o.status)}</div>
              <div class="meta mono">${esc(o.orderNumber || '')} · ${o.protein}g P · ${o.calories} kcal · ${esc(o.time)}</div>
            </div>
          </div>`).join('')}</div>`
          : `<div class="empty">Tap <b>“Cook with Chef Didi”</b> on any meal to send the order & recipe straight to Chef Didi at <code>/didi</code>.</div>`}
        </div>

        <div class="card">
          <div class="card-head"><h3 class="card-title">Today's session</h3>${session.logged ? `<span class="xs muted">${esc(session.workout.time)}</span>` : ''}</div>
          ${session.logged ? `<div class="list-row"><span class="list-icon">${icon('dumbbell', 17)}</span><div class="grow"><div class="title">${esc(session.workout.title)}</div><div class="meta">${esc(session.workout.type)} · ${session.workout.minutes} min · ${esc(session.workout.intensity)}</div></div></div>
            <p class="small muted" style="margin-top:10px">Recovery split: ${session.strategy.carb_pct}% carbs · ${session.strategy.protein_pct}% protein · ${session.strategy.fat_pct}% fat</p>`
          : `<div class="empty">Log today's workout and your meal matches will adapt to it.<div style="margin-top:12px"><button class="btn btn-primary btn-sm" data-action="open-workout">${icon('plus', 14)} Log workout</button></div></div>`}
        </div>

        <div class="card">
          <div class="card-head"><h3 class="card-title">Eaten today</h3><button class="btn btn-ghost btn-sm" data-action="tab" data-tab="history">History ${icon('right', 14)}</button></div>
          ${eaten.length ? `<div class="stack-sm">${eaten.map((m) => `<div class="list-row"><div class="grow"><div class="title">${esc(m.name)}</div><div class="meta mono">${m.protein}g P · ${m.calories} kcal · ${esc(m.time)}</div></div><button class="icon-btn sm danger" data-action="del-meal" data-id="${m.id}" aria-label="Remove">${icon('trash', 14)}</button></div>`).join('')}</div>`
          : `<div class="empty">Nothing logged yet today. Tap “I ate this” on any meal.</div>`}
        </div>

        <div class="card">
          <div class="row" style="margin-bottom:10px"><span class="list-icon">${icon('sparkle', 17)}</span><div><h3 class="card-title">ZAP FIT AI coach</h3><span class="xs muted">${esc(p.focus)}</span></div></div>
          <p class="small ink-2">${esc(p.recoveryStrategy)}</p>
          <form data-form="quick-ai" class="row" style="margin-top:12px"><input class="input" name="q" placeholder="Ask about yesterday, today, protein…" autocomplete="off"><button class="icon-btn" type="submit" aria-label="Send">${icon('send', 16)}</button></form>
        </div>

        ${hidden.length ? `<div class="note danger"><b>${hidden.length} meal${hidden.length > 1 ? 's' : ''} hidden for your safety</b><br><span class="small">${hidden.slice(0, 3).map((h) => `${esc(h.meal.name)} (${esc(h.hits.join(', '))})`).join(' · ')}${hidden.length > 3 ? ` and ${hidden.length - 3} more` : ''}</span></div>` : ''}
      </div>
    </div>`;
  }

  function renderHistory() {
    const today = todayKey();
    const yesterday = shiftKey(today, -1);
    const d = S.historyDate, p = S.data.profile;
    const meals = S.data.meals.filter((m) => m.date === d);
    const wks = S.data.workouts.filter((w) => w.date === d);
    const dayOrders = (S.didiOrders || []).filter((o) => o.date === d && (!S.user || !o.athlete?.uid || o.athlete.uid === S.user.uid || o.athlete.uid === 'guest'));
    const days = Array.from({ length: 7 }, (_, j) => shiftKey(today, j - 6));
    const isToday = d === today;
    const isYesterday = d === yesterday;

    const todayM = S.data.meals.filter((m) => m.date === today);
    const todayW = S.data.workouts.filter((w) => w.date === today);
    const yestM = S.data.meals.filter((m) => m.date === yesterday);
    const yestW = S.data.workouts.filter((w) => w.date === yesterday);

    return `
    <div class="page-head">
      <div>
        <p class="small muted">Firebase Cloud Activity & Nutrition History</p>
        <h1 class="page-title">${isToday ? 'Today — ' + esc(prettyDate(d)) : isYesterday ? 'Yesterday — ' + esc(prettyDate(d)) : esc(prettyDate(d))}</h1>
      </div>
      <div class="row wrap history-controls">
        <button class="btn ${isYesterday ? 'btn-primary' : 'btn-secondary'} btn-sm" data-action="pick-day" data-d="${yesterday}">Yesterday</button>
        <button class="btn ${isToday ? 'btn-primary' : 'btn-secondary'} btn-sm" data-action="day-today">Today</button>
        <button class="icon-btn" data-action="day" data-n="-1" aria-label="Previous day">${icon('left', 16)}</button>
        <input type="date" class="input history-date-input" data-input="history-date" value="${d}" max="${today}">
        <button class="icon-btn" data-action="day" data-n="1" aria-label="Next day" ${isToday ? 'disabled style="opacity:.4"' : ''}>${icon('right', 16)}</button>
      </div>
    </div>

    <!-- Yesterday vs Today Cloud Summary Cards -->
    <div class="day-compare-grid">
      <div class="card clickable" data-action="pick-day" data-d="${yesterday}" style="${isYesterday ? 'border-color:var(--accent-border)' : ''}">
        <div class="row-between" style="margin-bottom:8px">
          <span class="badge ${isYesterday ? 'badge-solid' : 'badge-muted'}">YESTERDAY (${esc(shortDay(yesterday))})</span>
          <span class="xs muted">${esc(prettyDate(yesterday))}</span>
        </div>
        <div class="row-between wrap">
          <div><b class="mono" style="font-size:18px">${sum(yestM, 'protein')}g</b> <span class="xs muted">/ ${p.proteinTarget}g Protein</span></div>
          <div><b class="mono" style="font-size:18px">${sum(yestM, 'calories')}</b> <span class="xs muted">kcal</span></div>
          <div><b class="mono" style="font-size:18px">${sum(yestW, 'minutes')}m</b> <span class="xs muted">workout (${yestW.length})</span></div>
        </div>
        <p class="xs muted" style="margin-top:8px">${yestM.length ? `Meals: ${yestM.map((m) => esc(m.name)).join(', ')}` : 'No meals logged for yesterday — click to view or add'}</p>
      </div>

      <div class="card clickable" data-action="pick-day" data-d="${today}" style="${isToday ? 'border-color:var(--accent-border)' : ''}">
        <div class="row-between" style="margin-bottom:8px">
          <span class="badge ${isToday ? 'badge-solid' : 'badge-accent'}">TODAY (${esc(shortDay(today))})</span>
          <span class="xs muted">${esc(prettyDate(today))}</span>
        </div>
        <div class="row-between wrap">
          <div><b class="mono" style="font-size:18px">${sum(todayM, 'protein')}g</b> <span class="xs muted">/ ${p.proteinTarget}g Protein</span></div>
          <div><b class="mono" style="font-size:18px">${sum(todayM, 'calories')}</b> <span class="xs muted">kcal</span></div>
          <div><b class="mono" style="font-size:18px">${sum(todayW, 'minutes')}m</b> <span class="xs muted">workout (${todayW.length})</span></div>
        </div>
        <p class="xs muted" style="margin-top:8px">${todayM.length ? `Meals: ${todayM.map((m) => esc(m.name)).join(', ')}` : 'No meals logged yet today'}</p>
      </div>
    </div>

    <div class="stat-grid">
      ${statCard('Protein', 'flame', sum(meals, 'protein'), p.proteinTarget, 'g', '')}
      ${statCard('Carbs', 'bolt', sum(meals, 'carbs'), p.carbsTarget, 'g', 'carb')}
      ${statCard('Calories', 'target', sum(meals, 'calories'), p.caloriesTarget, 'kcal', 'kcal')}
      <div class="stat"><div class="stat-label">${icon('dumbbell', 14)} Training</div><div class="stat-value">${sum(wks, 'minutes')}<small> min</small></div><div class="stat-foot" style="margin-top:0"><span>${wks.length} session${wks.length === 1 ? '' : 's'} · ${sum(wks, 'kcal')} kcal burned</span></div></div>
    </div>

    <div class="card" style="margin-top:20px">
      <div class="card-head"><h3 class="card-title">Protein — last 7 days</h3><span class="xs muted">Target ${p.proteinTarget} g · tap any day to inspect</span></div>
      <div class="week">${days.map((k) => { const v = sum(S.data.meals.filter((m) => m.date === k), 'protein'); const h = Math.min(100, pct(v, p.proteinTarget)); return `<div class="week-col ${k === d ? 'on' : ''}" data-action="pick-day" data-d="${k}" title="${v} g"><div class="week-bar"><i style="height:${h}%"></i></div><span>${k === today ? 'Today' : k === yesterday ? 'Yest' : shortDay(k)}</span></div>`; }).join('')}</div>
    </div>

    <div class="dash-grid equal">
      <div class="card">
        <div class="card-head"><h3 class="card-title">Workouts on ${isToday ? 'Today' : isYesterday ? 'Yesterday' : esc(shortDay(d))} (${wks.length})</h3><button class="btn btn-secondary btn-sm" data-action="open-workout">${icon('plus', 14)} Add workout</button></div>
        ${wks.length ? `<div class="stack-sm">${wks.map((w) => `<div class="list-row"><span class="list-icon">${icon('dumbbell', 17)}</span><div class="grow"><div class="title">${esc(w.title)}</div><div class="meta">${esc(w.type)} · ${w.minutes} min · ${esc(w.intensity)} · ${w.kcal} kcal · ${esc(w.time)}</div></div><button class="icon-btn sm danger" data-action="del-workout" data-id="${w.id}" aria-label="Remove">${icon('trash', 14)}</button></div>`).join('')}</div>`
        : `<div class="empty">No workouts logged on this day.</div>`}
      </div>
      <div class="card">
        <div class="card-head"><h3 class="card-title">Meals eaten on ${isToday ? 'Today' : isYesterday ? 'Yesterday' : esc(shortDay(d))} (${meals.length})</h3><button class="btn btn-secondary btn-sm" data-action="tab" data-tab="meals">${icon('plus', 14)} Add meal</button></div>
        ${meals.length ? `<div class="stack-sm">${meals.map((m) => `<div class="list-row"><span class="list-icon">${icon('plate', 17)}</span><div class="grow"><div class="title">${esc(m.name)}</div><div class="meta mono">${m.protein}g P · ${m.carbs}g C · ${m.fat}g F · ${m.calories} kcal · ${esc(m.time)}</div></div><button class="icon-btn sm danger" data-action="del-meal" data-id="${m.id}" aria-label="Remove">${icon('trash', 14)}</button></div>`).join('')}</div>`
        : `<div class="empty">No meals logged on this day.</div>`}
      </div>
    </div>

    ${dayOrders.length ? `<div class="card" style="margin-top:20px">
      <div class="card-head"><h3 class="card-title">Chef Didi Bookings on this day (${dayOrders.length})</h3></div>
      <div class="stack-sm">${dayOrders.map((o) => `<div class="list-row">
        <span class="list-icon didi-mark">${icon('chef', 17)}</span>
        <div class="grow"><div class="title">${esc(o.mealName)} <span class="xs muted">${esc(o.orderNumber || '')}</span></div><div class="meta mono">${o.protein}g P · ${o.carbs}g C · ${o.fat}g F · ${o.calories} kcal · Booked at ${esc(o.time)}</div></div>
        ${statusBadgeHTML(o.status)}
      </div>`).join('')}</div>
    </div>` : ''}`;
  }

  function filteredMeals() {
    const { ok, hidden, needMorePantry } = rankedMeals();
    const q = S.libQuery.trim().toLowerCase();
    let list = ok;
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q) || (m.ingredients || []).some((x) => x.toLowerCase().includes(q)));
    if (S.libFilter === 'pantry_100') list = list.filter((m) => m.score.pantryMatch.missing.length === 0);
    if (S.libFilter === 'pantry_ready') list = list.filter((m) => m.score.pantryMatch.missing.length <= 2);
    if (S.libFilter === 'protein') list = list.filter((m) => m.protein >= 30);
    if (S.libFilter === 'light') list = list.filter((m) => m.calories <= 450);
    if (S.libFilter === 'session') list = list.filter((m) => m.score.factors[4] >= 11);
    return { list, hidden, needMorePantry };
  }
  function mealGridHTML() {
    const { list } = filteredMeals();
    if (!list.length) return `<div class="empty">No meals match that search.</div>`;
    return `<div class="meal-grid">${list.map((m) => `<div class="card meal-card">
      <div class="row-between wrap" style="gap:8px;align-items:center;margin-bottom:2px">
        <span class="score-pill">${m.score.total}% match</span>
        ${m.score.pantryMatch ? `
          <span class="pantry-match-badge ${m.score.pantryMatch.missing.length === 0 ? 'high' : m.score.pantryMatch.missing.length <= 2 ? 'med' : 'low'}" style="font-size:11px;padding:3px 9px">
            ${icon('box', 12)} ${m.score.pantryMatch.missing.length === 0 ? '✓ 100% in Pantry' : `Pantry: ${m.score.pantryMatch.missing.length} missing`}
          </span>
        ` : `<span class="xs muted">${esc(m.category)}</span>`}
      </div>
      <h4 class="clickable" data-action="open-meal" data-id="${m.id}">${esc(m.name)}</h4>
      <p class="desc clickable" data-action="open-meal" data-id="${m.id}">${esc(m.benefits)}</p>
      <div class="row wrap" style="gap:6px;margin:6px 0">
        <span class="badge" style="font-size:11px">${icon('clock', 11)} ${esc(m.cook_time || '15 mins')}</span>
        <span class="badge" style="font-size:11px">${(m.steps || []).length || 5} steps</span>
      </div>
      <div class="foot"><span>${m.protein}g P</span><span>${m.carbs}g C</span><span>${m.calories} kcal</span></div>
      <div class="meal-card-actions">
        <button class="btn btn-didi btn-sm" data-action="order-didi" data-id="${m.id}">${icon('chef', 14)} Cook with Chef Didi</button>
        <button class="btn btn-secondary btn-sm" data-action="open-meal" data-id="${m.id}">Recipe & Log</button>
      </div>
    </div>`).join('')}</div>`;
  }
  function renderMealsTab() {
    const { hidden } = filteredMeals();
    const filters = [['all', 'Pantry Accepted (≤2 missing)'], ['pantry_100', '100% In Pantry (0 missing)'], ['session', 'Best for today'], ['protein', '30 g+ protein'], ['light', 'Under 450 kcal']];
    return `
    <div class="page-head"><div><p class="small muted">Ranked for you right now · Every meal can be cooked with Chef Didi</p><h1 class="page-title">Meal library</h1></div>
      <div class="row search-wrap"><input class="input" data-input="lib-search" value="${esc(S.libQuery)}" placeholder="Search meals or ingredients" autocomplete="off"></div></div>
    <div class="chips" style="margin-bottom:16px">${filters.map(([k, l]) => `<button class="chip ${S.libFilter === k ? 'on' : ''}" data-action="lib-filter" data-f="${k}">${l}</button>`).join('')}</div>
    ${hidden.length ? `<div class="note danger" style="margin-bottom:16px"><b>${hidden.length} meal${hidden.length > 1 ? 's' : ''} hidden</b> because they contain your allergens.</div>` : ''}
    <div id="mealGrid">${mealGridHTML()}</div>`;
  }

  function renderPantryTab() {
    const pantry = S.data?.pantry || {};
    const inStockCount = Object.keys(pantry).filter((k) => pantry[k]).length;
    const totalCount = ALL_PANTRY_INGREDIENTS.length;

    let zeroMissingMeals = 0;
    let oneMissingMeals = 0;
    let twoMissingMeals = 0;
    MEALS.forEach((m) => {
      const match = getMealPantryMatch(m);
      if (match.missing.length === 0) zeroMissingMeals++;
      else if (match.missing.length === 1) oneMissingMeals++;
      else if (match.missing.length === 2) twoMissingMeals++;
    });
    const totalAcceptedMeals = zeroMissingMeals + oneMissingMeals + twoMissingMeals;

    const activeFilter = S.pantryFilter || 'all';
    const searchQuery = (S.pantrySearch || '').trim().toLowerCase();

    const filteredIngredients = ALL_PANTRY_INGREDIENTS.filter((item) => {
      const isChecked = Boolean(pantry[item.name]);
      if (activeFilter === 'in_stock' && !isChecked) return false;
      if (activeFilter === 'missing' && isChecked) return false;
      if (activeFilter !== 'all' && activeFilter !== 'in_stock' && activeFilter !== 'missing') {
        if (item.category !== activeFilter) return false;
      }
      if (searchQuery) {
        if (!item.name.toLowerCase().includes(searchQuery) && !item.category.toLowerCase().includes(searchQuery)) {
          return false;
        }
      }
      return true;
    });

    const catCounts = {};
    ALL_PANTRY_INGREDIENTS.forEach((it) => {
      catCounts[it.category] = (catCounts[it.category] || 0) + 1;
    });

    const categories = [
      ['all', `All (${totalCount})`],
      ['in_stock', `In Stock (${inStockCount})`],
      ['missing', `Missing (${totalCount - inStockCount})`],
      ['Proteins', `Proteins (${catCounts['Proteins'] || 0})`],
      ['Vegetables', `Vegetables (${catCounts['Vegetables'] || 0})`],
      ['Grains & Carbs', `Grains & Carbs (${catCounts['Grains & Carbs'] || 0})`],
      ['Dairy', `Dairy (${catCounts['Dairy'] || 0})`],
      ['Fruits', `Fruits (${catCounts['Fruits'] || 0})`],
      ['Nuts & Oils', `Nuts & Seeds (${catCounts['Nuts & Oils'] || 0})`],
      ['Spices & Staples', `Spices & Staples (${catCounts['Spices & Staples'] || 0})`]
    ];

    return `
    <div class="stack" style="gap:16px">
      <div class="row-between wrap" style="gap:12px;align-items:flex-start">
        <div>
          <h1 class="page-title" style="display:flex;align-items:center;gap:8px">
            ${icon('box', 24)} Kitchen Pantry
          </h1>
          <p class="small muted" style="margin-top:2px;max-width:640px">
            <b>Chef Didi prepares and cooks fresh in your kitchen using your pantry staples.</b> Rice is boiled, batters are blended, and veggies are prepped fresh by Chef Didi on arrival — you only need to keep basic raw pantry items in stock!
          </p>
        </div>
        <div class="row wrap" style="gap:8px">
          <button class="btn btn-primary btn-sm" data-action="ask-ai-pantry">
            ${icon('sparkle', 14)} Ask AI What to Cook
          </button>
        </div>
      </div>

      <!-- Stats overview bar -->
      <div class="pantry-stat-bar row-between wrap" style="gap:12px">
        <div class="row wrap" style="gap:14px;align-items:center">
          <div>
            <div class="xs muted" style="text-transform:uppercase;font-weight:700">In Stock</div>
            <div style="font-size:20px;font-weight:800;color:#34A853">${inStockCount} <small style="font-size:12px;color:var(--muted)">/ ${totalCount} items</small></div>
          </div>
          <div style="width:1px;height:32px;background:var(--border)"></div>
          <div>
            <div class="xs muted" style="text-transform:uppercase;font-weight:700">Ready to Cook (≤2 missing)</div>
            <div style="font-size:20px;font-weight:800;color:var(--accent-text)">${totalAcceptedMeals} <small style="font-size:12px;color:var(--muted)">meals</small></div>
          </div>
          <div style="width:1px;height:32px;background:var(--border)"></div>
          <div>
            <div class="xs muted" style="text-transform:uppercase;font-weight:700">100% in Pantry (0 missing)</div>
            <div style="font-size:20px;font-weight:800;color:#D06828">${zeroMissingMeals} <small style="font-size:12px;color:var(--muted)">meals</small></div>
          </div>
        </div>
      </div>

      <!-- Search and Category Filters -->
      <div class="card" style="padding:14px 16px">
        <div class="row-between wrap" style="gap:10px;margin-bottom:12px">
          <div style="position:relative;flex:1;min-width:240px">
            <input type="text" id="pantry-search" class="input" placeholder="Search ${totalCount} pantry staples (e.g. paneer, oats, spinach)..." value="${esc(S.pantrySearch || '')}" style="padding-left:34px;font-size:13px" data-input="pantry-search">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none">${icon('search', 16)}</span>
            ${S.pantrySearch ? `<button class="icon-btn sm" data-action="pantry-clear-search" style="position:absolute;right:8px;top:50%;transform:translateY(-50%)">${icon('close', 14)}</button>` : ''}
          </div>
          <div class="xs muted" style="align-self:center">
            Showing <b>${filteredIngredients.length}</b> of ${totalCount}
          </div>
        </div>

        <div class="row wrap" style="gap:6px">
          ${categories.map(([key, label]) => `
            <button class="btn btn-sm ${activeFilter === key ? 'btn-primary' : 'btn-ghost'}" data-action="pantry-filter" data-category="${key}" style="padding:4px 10px;font-size:12px;border-radius:20px">
              ${label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Ingredient Grid -->
      ${filteredIngredients.length ? `
        <div class="pantry-grid" id="pantryGrid">
          ${filteredIngredients.map((item) => {
            const isChecked = Boolean(pantry[item.name]);
            return `
              <div class="pantry-item-card ${isChecked ? 'in-stock' : ''}" data-action="toggle-pantry-item" data-name="${esc(item.name)}">
                <div class="pantry-checkbox" aria-checked="${isChecked ? 'true' : 'false'}">
                  ${isChecked ? '✓' : ''}
                </div>
                <div class="pantry-item-info">
                  <div class="pantry-item-name" title="${esc(item.name)}">${esc(item.name)}</div>
                  <div class="pantry-item-meta">
                    <span class="muted">${item.category}</span>
                    <span class="muted">·</span>
                    <span class="muted">${item.mealsCount} meal${item.mealsCount === 1 ? '' : 's'}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="card empty" style="padding:40px 20px;text-align:center">
          <div style="margin:0 auto 8px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:var(--surface-2);color:var(--muted)">${icon('search', 28)}</div>
          <h3>No ingredients match your filter</h3>
          <p class="small muted">Try clearing your search or switching to another category.</p>
          <button class="btn btn-secondary btn-sm" data-action="pantry-filter" data-category="all" style="margin-top:10px">Show All ${totalCount} Ingredients</button>
        </div>
      `}
    </div>`;
  }

  function renderSupplements() {
    return `
    <div class="page-head"><div><p class="small muted">Evidence-based timing</p><h1 class="page-title">Supplement guide</h1></div></div>
    <div class="note" style="margin-bottom:16px"><b>Food first.</b> Supplements fill gaps — check with a professional if you have a medical condition.</div>
    <div class="meal-grid">${SUPPLEMENTS.map((s) => `<div class="card meal-card">
      <div class="row-between"><span class="badge badge-accent">${icon('clock', 12)} ${esc(s.optimal_timing)}</span></div>
      <h4>${esc(s.name)}</h4>
      <p class="desc">${esc(s.fitness_benefits)}</p>
      <p class="xs muted">Key nutrients: ${esc(s.active_nutrients)}</p>
      <div class="note small"><b>Dose:</b> ${esc(s.recommended_dosage)}</div></div>`).join('')}</div>`;
  }

  function renderProfile() {
    const a = S.data.answers, p = S.data.profile;
    const rows = [
      ['Goals', a.purpose.join(', ')], ['Age', a.age], ['Gender', a.gender], ['Height', a.height + ' cm'], ['Weight', a.weight + ' kg'],
      ['Daily activity', a.activity], ['Training', `${a.training.join(', ')} · ${a.days} days/week`], ['Diet', a.diet + (a.disliked ? ` · dislikes ${a.disliked}` : '')],
      ['Allergies', a.allergy.join(', ')], ['Health', a.health], ['Usual meals', a.eat.join(', ')], ['ZAP FIT helps with', a.svc.join(', ')]
    ];
    return `
    <div class="page-head"><div><p class="small muted">Athlete Profile</p><h1 class="page-title">${esc(a.name || S.user.name)}</h1></div>
      <div class="row wrap"><button class="btn btn-primary btn-sm" data-action="restart-onb">${icon('sparkle', 14)} Update answers & recalibrate</button><button class="btn btn-secondary btn-sm" data-action="signout">${icon('logout', 14)} Sign out</button></div></div>
    <div class="dash-grid" style="margin-top:0">
      <div class="card"><h3 class="card-title" style="margin-bottom:12px">Your answers</h3>
        <div class="stack-sm">${rows.map(([k, v]) => `<div class="row-between" style="align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--border)"><span class="small muted">${k}</span><span class="small" style="text-align:right;font-weight:600;max-width:65%">${esc(v || '—')}</span></div>`).join('')}</div>
      </div>
      <div class="stack">
        <div class="card"><h3 class="card-title" style="margin-bottom:12px">Daily targets</h3>
          <div class="target-grid" style="grid-template-columns:1fr 1fr">
            ${[['Calories', p.caloriesTarget, 'kcal'], ['Protein', p.proteinTarget, 'g'], ['Carbs', p.carbsTarget, 'g'], ['Fat', p.fatTarget, 'g']].map(([l, v, u]) => `<div class="macro"><span>${l.toUpperCase()}</span><b>${v} ${u}</b></div>`).join('')}
          </div>
          <p class="small muted" style="margin-top:12px">Water: about ${p.waterLitres} L/day · ${esc(p.macroRatio)}</p>
          <p class="xs muted" style="margin-top:4px">Calibrated ${new Date(p.calibratedAt).toLocaleDateString()} by ZAP FIT AI</p>
        </div>
        <div class="card"><h3 class="card-title" style="margin-bottom:8px">Recovery strategy</h3><p class="small ink-2">${esc(p.recoveryStrategy)}</p>
          <div class="check-list" style="margin-top:12px">${p.tips.map((t) => `<div>${icon('check', 15)}<span>${esc(t)}</span></div>`).join('')}</div></div>
        ${a.health && a.health !== 'None' ? `<div class="note warn"><b>Professional guidance:</b> keep following your dietitian's advice. ZAP FIT does not adjust meals for medical conditions.</div>` : ''}
      </div>
    </div>`;
  }

  // ------------------------------------------------------------------
  // Render: Chef Didi Platform (/didi and /deede)
  // ------------------------------------------------------------------
  function filteredDidiOrders() {
    const all = S.didiOrders || [];
    const today = todayKey();
    const yesterday = shiftKey(today, -1);
    let list = all;
    if (S.didiFilter === 'pending') list = list.filter((o) => (o.status || 'pending') === 'pending');
    else if (S.didiFilter === 'preparing') list = list.filter((o) => o.status === 'preparing');
    else if (S.didiFilter === 'ready') list = list.filter((o) => o.status === 'ready');
    else if (S.didiFilter === 'completed') list = list.filter((o) => o.status === 'completed');
    else if (S.didiFilter === 'today') list = list.filter((o) => o.date === today);
    else if (S.didiFilter === 'yesterday') list = list.filter((o) => o.date === yesterday);

    const q = (S.didiQuery || '').trim().toLowerCase();
    if (q) {
      list = list.filter((o) =>
        (o.mealName || '').toLowerCase().includes(q) ||
        (o.orderNumber || '').toLowerCase().includes(q) ||
        (o.category || '').toLowerCase().includes(q) ||
        (o.athlete?.name || '').toLowerCase().includes(q) ||
        (o.ingredients || []).some((ing) => ing.toLowerCase().includes(q))
      );
    }
    return list;
  }

  function renderDidiMapHTML(o) {
    if (!o) return `<div class="card empty">No active trip found. <button class="btn btn-secondary btn-sm" data-action="didi-view-orders" style="margin-top:10px">Back to orders</button></div>`;
    const athleteName = o.athlete?.name || 'Aarav Sharma';
    const address = o.athlete?.address || 'Flat 402, Green Glen Heights, 27th Main Rd, HSR Layout Sector 2, Bengaluru';
    const phone = o.athlete?.phone || '';
    const email = o.athlete?.email || '';
    const ingredients = o.ingredientsCarriedByDidi || o.ingredients || [];

    return `
    <div style="padding:16px" class="stack">
      <div class="row-between wrap">
        <div>
          <span class="badge badge-solid mono">${esc(o.orderNumber || '#DIDI')}</span>
          <h2 style="font-size:20px;margin-top:4px">Navigating to ${esc(athleteName)}</h2>
        </div>
        ${statusBadgeHTML('en_route')}
      </div>

      <!-- Temporary Simulated GPS Navigation Map -->
      <div class="didi-map-viewport">
        <svg class="didi-map-svg" viewBox="0 0 380 280">
          <defs>
            <pattern id="didi-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="380" height="280" fill="#151b23"/>
          <rect width="380" height="280" fill="url(#didi-grid)"/>

          <!-- Park & Water Features -->
          <path d="M 220 30 Q 280 20 320 60 Q 340 110 300 130 Q 240 140 210 90 Z" fill="#1a2f23" stroke="#254d35" stroke-width="1"/>
          <text x="260" y="80" fill="#4ade80" font-size="10" opacity="0.7" font-family="sans-serif">HSR Sector Park</text>
          <path d="M 0 200 Q 80 180 180 220 T 380 210" fill="none" stroke="#1e3a5f" stroke-width="14" opacity="0.4"/>
          <path d="M 0 200 Q 80 180 180 220 T 380 210" fill="none" stroke="#2563eb" stroke-width="2.5" opacity="0.7"/>

          <!-- City Street Grid -->
          <path d="M 0 80 L 380 80 M 0 160 L 380 160 M 100 0 L 100 280 M 260 0 L 260 280 M 0 240 L 380 240" fill="none" stroke="#2d3748" stroke-width="8"/>
          <path d="M 0 80 L 380 80 M 0 160 L 380 160 M 100 0 L 100 280 M 260 0 L 260 280 M 0 240 L 380 240" fill="none" stroke="#1f2937" stroke-width="5"/>

          <!-- Active Route Line -->
          <path d="M 70 230 L 100 230 L 100 160 L 260 160 L 260 90 L 310 90" fill="none" stroke="#34A853" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
          <path class="didi-route-line" d="M 70 230 L 100 230 L 100 160 L 260 160 L 260 90 L 310 90" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Hub Marker -->
          <circle cx="70" cy="230" r="11" fill="#D06828"/>
          <circle cx="70" cy="230" r="5" fill="#FAF0DF"/>
          <text x="70" y="254" fill="#FAF0DF" font-size="9" font-weight="bold" text-anchor="middle" font-family="sans-serif">Didi Base Hub</text>

          <!-- Customer Destination Marker -->
          <g transform="translate(310, 90)">
            <circle cx="0" cy="0" r="14" fill="#EA4335" opacity="0.3">
              <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="12" fill="#EA4335"/>
            <path d="M -5 -2 L 0 -7 L 5 -2 L 5 5 L -5 5 Z" fill="#ffffff"/>
            <text x="0" y="24" fill="#FAF0DF" font-size="9" font-weight="bold" text-anchor="middle" font-family="sans-serif">Customer Home</text>
          </g>

          <!-- Moving Scooter Marker -->
          <g class="didi-moving-scooter">
            <circle cx="0" cy="0" r="16" fill="#34A853" opacity="0.25">
              <animate attributeName="r" values="14;24;14" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="13" fill="#34A853" stroke="#FAF0DF" stroke-width="2"/>
            <g transform="translate(-7, -7) scale(0.6)" stroke="#FAF0DF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10l-1.5-4.5A2 2 0 0 0 12.6 4H8"/>
              <circle cx="7" cy="17" r="2.2" fill="#FAF0DF"/>
              <circle cx="17" cy="17" r="2.2" fill="#FAF0DF"/>
              <path d="M9 17h6M12 6l-2 5h4"/>
            </g>
          </g>
        </svg>

        <!-- Floating HUD -->
        <div style="position:absolute;top:10px;left:10px;right:10px;background:rgba(18,24,38,0.92);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;color:#fff">
          <div>
            <div style="font-size:10px;color:#94a3b8;font-weight:700">NEXT TURN</div>
            <div style="font-size:12.5px;font-weight:700">Turn left onto 27th Main Rd</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:13px;font-weight:800;color:#34A853">1.4 km</div>
            <div style="font-size:10px;color:#94a3b8">~6 mins ETA</div>
          </div>
        </div>
      </div>

      <!-- Customer Location Details Card -->
      <div class="didi-nav-card">
        <div class="row-between wrap" style="align-items:flex-start;gap:8px">
          <div>
            <div class="xs muted" style="font-weight:700;text-transform:uppercase">Customer Kitchen Address</div>
            <div style="font-size:15px;font-weight:700;margin-top:2px">${esc(athleteName)}</div>
            <div class="small" style="margin-top:2px;line-height:1.4;color:var(--ink);font-weight:600;display:flex;align-items:center;gap:4px">${icon('pin', 13)} ${esc(address)}</div>
            ${email ? `<div class="xs muted" style="margin-top:3px;display:flex;align-items:center;gap:4px">${icon('mail', 12)} ${esc(email)}</div>` : ''}
          </div>
          <div class="row wrap" style="gap:6px">
            ${phone ? `<a href="tel:${esc(phone)}" class="btn btn-primary btn-sm" style="font-size:12px;padding:6px 12px">${icon('phone', 12)} Call ${esc(phone)}</a>` : ''}
            ${email ? `<a href="mailto:${esc(email)}" class="btn btn-secondary btn-sm" style="font-size:11px;padding:6px 10px">${icon('mail', 12)} Email</a>` : ''}
          </div>
        </div>
      </div>

      <!-- Athlete Kitchen Cooking Banner -->
      <div class="didi-food-bag-banner">
        <div class="icon">${icon('cooking', 20)}</div>
        <div>
          <b style="color:var(--ink);display:block;margin-bottom:2px">Home Cooking Service:</b>
          <div class="xs" style="line-height:1.4">You will cook <b>${esc(o.mealName)}</b> in athlete's home kitchen using their fresh pantry items:</div>
          <div class="ingredients-pills" style="margin-top:6px;margin-bottom:0">
            ${ingredients.slice(0, 6).map((ing) => `<span class="ing-pill" style="font-size:10.5px">${esc(ing)}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- Big Thumb Button: REACHED -->
      <div style="margin-top:10px">
        <button class="didi-thumb-btn reached" data-action="didi-reached" data-id="${o.id}">
          ${icon('check', 18)} I HAVE REACHED
        </button>
        <div class="xs muted" style="text-align:center;margin-top:6px">
          Tapping this immediately alerts customer that you have arrived at their kitchen
        </div>
        <button class="btn btn-ghost btn-block btn-sm" style="margin-top:10px" data-action="didi-view-orders">← Back to Orders Feed</button>
      </div>
    </div>`;
  }

  function renderDidiCookingHTML(o) {
    if (!o) return `<div class="card empty">No order selected. <button class="btn btn-secondary btn-sm" data-action="didi-view-orders" style="margin-top:10px">Back to orders</button></div>`;
    const athleteName = o.athlete?.name || 'Aarav Sharma';
    const address = o.athlete?.address || '';
    const phone = o.athlete?.phone || '';
    const email = o.athlete?.email || '';
    const allergies = o.athlete?.allergies || [];
    const steps = getOrderSteps(o);
    const ingredients = o.ingredientsCarriedByDidi || o.ingredients || [];
    const checked = getOrderCheckedSteps(o.id);
    const completedCount = steps.filter((_, idx) => !!checked[idx]).length;
    const allCompleted = steps.length > 0 && completedCount === steps.length;
    const pct = Math.round((completedCount / steps.length) * 100);

    return `
    <div style="padding:16px" class="stack">
      <div class="row-between wrap">
        <div>
          <span class="badge badge-solid mono">${esc(o.orderNumber || '#DIDI')}</span>
          <h2 style="font-size:20px;margin-top:4px">In Kitchen: ${esc(o.mealName)}</h2>
        </div>
        ${statusBadgeHTML('cooking')}
      </div>

      <!-- Customer Location & Contact Details -->
      <div style="background:var(--surface-2);border-radius:10px;padding:10px 12px;border:1px solid var(--border)">
        <div class="row-between wrap">
          <span style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:4px">${icon('user', 14)} ${esc(athleteName)}'s Kitchen</span>
          ${phone ? `<a href="tel:${esc(phone)}" class="xs" style="color:var(--accent-text);font-weight:700;display:flex;align-items:center;gap:4px">${icon('phone', 12)} ${esc(phone)}</a>` : ''}
        </div>
        ${address ? `<div class="xs" style="margin-top:3px;color:var(--ink);font-weight:600;display:flex;align-items:center;gap:4px">${icon('pin', 12)} ${esc(address)}</div>` : ''}
        ${email ? `<div class="xs muted" style="margin-top:2px;display:flex;align-items:center;gap:4px">${icon('mail', 11)} ${esc(email)}</div>` : ''}
      </div>

      <!-- Customer Notified Alert -->
      <div class="note info" style="display:flex;align-items:center;gap:10px;padding:12px 14px">
        <span class="accent-text" style="display:grid;place-items:center">${icon('bell', 22)}</span>
        <div class="xs" style="line-height:1.4">
          <b>Customer Notified:</b> ${esc(athleteName)} knows you have reached at their doorstep with all food items.
        </div>
      </div>

      <!-- Meal & Macro Overview -->
      <div class="macro-grid">
        <div class="macro"><span>PROTEIN</span><b class="accent-text">${o.protein}g</b></div>
        <div class="macro"><span>CARBS</span><b>${o.carbs}g</b></div>
        <div class="macro"><span>FAT</span><b>${o.fat}g</b></div>
        <div class="macro"><span>KCAL</span><b>${o.calories}</b></div>
      </div>

      ${allergies.length ? `<div class="note danger" style="padding:8px 12px;font-size:12px;display:flex;align-items:center;gap:6px"><b>${icon('alert', 13)} ATHLETE ALLERGY ALERT — DO NOT USE:</b> ${esc(allergies.join(', '))}</div>` : ''}

      <!-- Kitchen Ingredients Checklist -->
      <div class="didi-food-bag-banner">
        <div class="icon">${icon('cooking', 20)}</div>
        <div>
          <b style="color:var(--ink);display:block;margin-bottom:2px">Athlete's Raw Pantry Staples:</b>
          <div class="xs muted" style="margin-bottom:4px">Raw ingredients provided by athlete (Chef Didi prepares fresh batters, boils rice, and cooks fresh):</div>
          <div class="ingredients-pills" style="margin-top:4px;margin-bottom:0">
            ${ingredients.map((ing) => `<span class="ing-pill" style="font-size:11px">${esc(ing)}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- Interactive Cooking Steps Checklist -->
      <div class="didi-steps-section">
        <div class="row-between wrap" style="margin-bottom:6px;gap:6px">
          <div>
            <span class="xs muted" style="font-weight:700;letter-spacing:.05em;text-transform:uppercase">Cooking Steps Checklist</span>
            <span class="badge ${allCompleted ? 'badge-accent' : 'badge-muted'}" style="margin-left:6px;font-size:11px">
              ${completedCount} of ${steps.length} Completed
            </span>
          </div>
          <span class="xs" style="font-weight:700;color:${allCompleted ? 'var(--accent-text)' : 'var(--muted)'};display:flex;align-items:center;gap:4px">
            ${allCompleted ? `${icon('check', 13)} All Steps Complete` : 'Tap each step to check off'}
          </span>
        </div>

        <!-- Visual Step Progress Bar -->
        <div style="height:6px;background:var(--border);border-radius:99px;overflow:hidden;margin-bottom:12px">
          <div style="height:100%;width:${pct}%;background:${allCompleted ? '#34A853' : 'linear-gradient(90deg, #F8D858, #D06828)'};transition:width 0.25s ease"></div>
        </div>

        ${!allCompleted ? `
        <div class="note warn" style="margin-bottom:12px;padding:9px 12px;display:flex;align-items:center;gap:10px;font-size:12.5px;line-height:1.35">
          <span style="color:#D06828;display:grid;place-items:center">${icon('alert', 18)}</span>
          <div><b>Step Completion Required:</b> Chef Didi must finish and check off all ${steps.length} cooking steps before this meal can be approved and completed (${steps.length - completedCount} remaining).</div>
        </div>
        ` : `
        <div class="note info" style="margin-bottom:12px;padding:9px 12px;display:flex;align-items:center;gap:10px;font-size:12.5px;line-height:1.35;border-color:#34A853;background:rgba(52,168,83,0.08)">
          <span style="color:#34A853;display:grid;place-items:center">${icon('check', 18)}</span>
          <div style="color:var(--ink)"><b>All Steps Completed!</b> You have finished all preparation and cooking steps. Tap below to approve the meal and credit ₹250 to your Chef Didi wallet.</div>
        </div>
        `}

        <div class="stack-sm">
          ${steps.map((st, idx) => {
            const isChecked = !!checked[idx];
            return `<div class="didi-cooking-check ${isChecked ? 'checked' : ''}" data-action="didi-toggle-step" data-step="${idx}" data-id="${o.id}">
              <div class="didi-checkbox-custom">${isChecked ? '✓' : ''}</div>
              <div style="font-size:13px;line-height:1.4;flex:1">
                <div class="row-between">
                  <span class="xs mono" style="font-weight:700;color:${isChecked ? 'var(--accent-text)' : 'var(--muted)'}">STEP ${idx + 1}</span>
                  ${isChecked ? `<span class="xs font-bold" style="color:#34A853;font-size:11px">DONE ✓</span>` : `<span class="xs muted" style="font-size:11px">PENDING</span>`}
                </div>
                <div style="margin-top:2px;${isChecked ? 'color:var(--ink);text-decoration:line-through;opacity:0.85' : 'color:var(--ink)'}">${esc(st)}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Complete Order Button (Strictly gated by allCompleted) -->
      <div style="margin-top:14px">
        ${allCompleted ? `
        <button class="didi-thumb-btn complete" data-action="didi-complete" data-id="${o.id}">
          ${icon('check', 16)} ALL STEPS COMPLETED — APPROVE & COMPLETE MEAL (Collect ₹250)
        </button>
        <div class="xs muted" style="text-align:center;margin-top:6px">
          All ${steps.length} steps verified · Completing immediately credits ₹250 to your Chef Didi account
        </div>
        ` : `
        <button class="didi-thumb-btn complete didi-btn-locked" data-action="didi-complete" data-id="${o.id}" title="Cannot approve meal until all cooking steps are finished">
          ${icon('lock', 15)} COMPLETE ALL STEPS TO APPROVE MEAL (${completedCount}/${steps.length})
        </button>
        <div class="xs" style="text-align:center;margin-top:6px;color:#D06828;font-weight:600;display:flex;align-items:center;justify-content:center;gap:4px">
          ${icon('alert', 12)} Meal cannot be approved until and unless all ${steps.length} cooking steps are completed by Chef Didi above (${steps.length - completedCount} left)
        </div>
        `}
        <button class="btn btn-ghost btn-block btn-sm" style="margin-top:10px" data-action="didi-view-orders">← Back to Orders Feed</button>
      </div>
    </div>`;
  }

  function renderDidiPayoutHTML() {
    return `
    <div style="padding:28px 20px;text-align:center" class="stack">
      <div style="margin:0 auto 8px;width:72px;height:72px;border-radius:50%;background:rgba(52,168,83,0.18);display:grid;place-items:center;color:#34A853">${icon('sparkle', 38)}</div>
      <h2 style="font-size:24px;color:var(--ink);margin:0">Payment Credited!</h2>
      <p class="small muted" style="margin-top:4px">Great job! The payment has been deposited into your Chef Didi Wallet.</p>

      <div class="card" style="background:var(--surface-2);border-radius:16px;padding:20px;margin:16px 0;border:1.5px solid rgba(248,216,88,0.4)">
        <div class="xs muted" style="text-transform:uppercase;letter-spacing:.05em;font-weight:700">Amount Credited</div>
        <div style="font-size:36px;font-weight:800;color:#F8D858;margin:6px 0">+₹250</div>
        <div class="row-between" style="border-top:1px solid var(--border);padding-top:12px;margin-top:12px">
          <span class="small muted">Updated Wallet Balance</span>
          <span class="small" style="font-weight:800;color:var(--ink)">₹${(S.didiWallet || 1250).toLocaleString('en-IN')}</span>
        </div>
        <div class="row-between" style="padding-top:6px">
          <span class="xs muted">Home Cooking Service Fee</span>
          <span class="xs mono">₹200</span>
        </div>
        <div class="row-between" style="padding-top:4px">
          <span class="xs muted">Kitchen Sanitization & Plating</span>
          <span class="xs mono">₹50</span>
        </div>
        <div class="row-between" style="padding-top:6px;border-top:1px dashed var(--border);margin-top:6px">
          <span class="xs muted">Payout Destination</span>
          <span class="xs" style="color:var(--accent-text);font-weight:600;display:flex;align-items:center;gap:4px">HDFC Bank •••• 4092 ${icon('check', 13)}</span>
        </div>
      </div>

      <button class="didi-thumb-btn go" data-action="didi-view-orders">
        Back to Available Orders →
      </button>
    </div>`;
  }

  function renderDidiOrderCardsHTML() {
    const list = filteredDidiOrders();
    if (!list.length) {
      return `<div class="card empty" style="padding:48px 20px;text-align:center">
        <div style="margin:0 auto 12px;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--surface-2);color:var(--accent-text)">${icon('chef', 32)}</div>
        <h3 style="font-size:18px;margin-bottom:6px">No orders in this view</h3>
        <p class="small muted">Whenever an athlete books <b>“Cook with Chef Didi”</b> and scans the QR code, the order arrives here instantly in real time via Firebase.</p>
      </div>`;
    }

    const today = todayKey();
    const yesterday = shiftKey(today, -1);

    return `<div class="stack" style="gap:14px">${list.map((o) => {
      const st = o.status || 'pending';
      const dayLabel = o.date === today ? 'Today' : o.date === yesterday ? 'Yesterday' : prettyDate(o.date || today);
      const allergies = o.athlete?.allergies || [];
      const athleteName = o.athlete?.name || 'Aarav Sharma';
      const address = o.athlete?.address || 'Flat 402, Green Glen Heights, HSR Layout';
      const phone = o.athlete?.phone || '';
      const email = o.athlete?.email || '';
      const ingredients = o.ingredientsCarriedByDidi || o.ingredients || [];

      return `<div class="card didi-order-card status-${esc(st)}" style="padding:16px">
        <div class="row-between wrap" style="gap:8px">
          <div class="row" style="gap:8px">
            <span class="badge badge-solid mono">${esc(o.orderNumber || '#DIDI')}</span>
            <span class="xs muted">${esc(dayLabel)} · ${esc(o.time || '')}</span>
          </div>
          <div class="row" style="gap:6px;align-items:center">
            ${statusBadgeHTML(st)}
            <button class="icon-btn sm" data-action="didi-delete" data-id="${o.id}" title="Remove order" style="color:#EA4335;opacity:0.85;padding:4px" aria-label="Delete order">${icon('trash', 13)}</button>
          </div>
        </div>

        <div>
          <div class="row-between" style="align-items:flex-start;gap:10px">
            <h3 style="font-size:18px;margin:0">${esc(o.mealName)}</h3>
            <span class="score-pill" style="background:rgba(248,216,88,0.18);color:#F8D858;border-color:rgba(248,216,88,0.4)">+₹250</span>
          </div>
          <div class="row wrap" style="gap:6px;margin-top:6px">
            <span class="badge badge-accent">${esc(o.category || 'Athlete Meal')}</span>
            <span class="badge badge-muted">${icon('clock', 11)} ${esc(o.prepTime || '8 mins')}</span>
          </div>
        </div>

        <!-- Customer & Address -->
        <div style="background:var(--surface-2);border-radius:10px;padding:10px 12px;border:1px solid var(--border)">
          <div class="row-between">
            <span class="small" style="font-weight:800;color:var(--ink);display:flex;align-items:center;gap:4px">${icon('user', 14)} ${esc(athleteName)}</span>
            <span class="xs muted">${esc(o.athlete?.diet || 'Standard')}</span>
          </div>
          <div class="small" style="margin-top:4px;color:var(--ink);font-weight:600;line-height:1.35;display:flex;align-items:center;gap:4px">${icon('pin', 13)} ${esc(address)}</div>
          <div class="row wrap" style="gap:8px;margin-top:6px;align-items:center">
            ${phone ? `<a href="tel:${esc(phone)}" class="btn btn-secondary btn-sm" style="font-size:11.5px;padding:4px 9px;font-weight:700;color:var(--accent-text);display:flex;align-items:center;gap:4px">${icon('phone', 11)} Call ${esc(phone)}</a>` : ''}
            ${email ? `<a href="mailto:${esc(email)}" class="xs muted" style="text-decoration:underline;display:flex;align-items:center;gap:4px">${icon('mail', 11)} ${esc(email)}</a>` : ''}
          </div>
          ${allergies.length ? `<div class="note danger" style="padding:6px 8px;font-size:11.5px;margin-top:6px;display:flex;align-items:center;gap:4px"><b>${icon('alert', 12)} ALLERGY:</b> ${esc(allergies.join(', '))}</div>` : ''}
        </div>

        <!-- Athlete Pantry Ingredients Check -->
        <div class="didi-food-bag-banner" style="margin:4px 0">
          <div class="icon">${icon('cooking', 18)}</div>
          <div>
            <b style="color:var(--ink);display:block;font-size:12px">Cook with Athlete's Pantry:</b>
            <div class="xs" style="line-height:1.35;margin-bottom:4px">Prepared in athlete's home kitchen using their pantry items:</div>
            <div class="ingredients-pills" style="margin-bottom:0">
              ${ingredients.slice(0, 5).map((ing) => `<span class="ing-pill" style="font-size:10px;padding:2px 7px">${esc(ing)}</span>`).join('')}
              ${ingredients.length > 5 ? `<span class="xs muted">+${ingredients.length - 5} more</span>` : ''}
            </div>
          </div>
        </div>

        <!-- Quick Macro Bar -->
        <div class="row-between xs mono muted" style="padding:4px 2px">
          <span>${o.protein}g Protein</span>
          <span>${o.carbs}g Carbs</span>
          <span>${o.calories} kcal</span>
        </div>

        <!-- Dynamic Action Button based on status -->
        <div style="margin-top:4px">
          ${st === 'pending' ? `<button class="didi-thumb-btn go" data-action="didi-go" data-id="${o.id}">${icon('scooter', 16)} START TRIP (GO)</button>` : ''}
          ${st === 'en_route' ? `<button class="didi-thumb-btn reached" data-action="didi-show-map" data-id="${o.id}">${icon('map', 16)} RESUME TRIP (MAP)</button>` : ''}
          ${st === 'reached' || st === 'cooking' || st === 'preparing' ? `<button class="didi-thumb-btn complete" data-action="didi-show-cooking" data-id="${o.id}">${icon('cooking', 16)} OPEN COOKING STEPS</button>` : ''}
          ${st === 'completed' ? `<div class="row-between"><span class="badge badge-accent">${icon('check', 11)} Completed</span><span class="xs muted">+₹250 Paid</span><button class="btn btn-ghost btn-sm" data-action="didi-show-cooking" data-id="${o.id}">Recipe</button></div>` : ''}
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function renderDidiPlatform() {
    const all = S.didiOrders || [];
    const today = todayKey();
    const pendingCount = all.filter((o) => (o.status || 'pending') === 'pending').length;
    const activeCount = all.filter((o) => ['en_route', 'reached', 'cooking', 'preparing'].includes(o.status)).length;
    const completedCount = all.filter((o) => o.status === 'completed').length;

    // Resolve active order for navigation or cooking views
    const activeOrder = S.didiActiveOrderId
      ? all.find((o) => o.id === S.didiActiveOrderId)
      : all.find((o) => ['en_route', 'reached', 'cooking'].includes(o.status)) || all[0];

    let mainContent = '';
    if (S.didiView === 'map' && activeOrder) {
      mainContent = renderDidiMapHTML(activeOrder);
    } else if (S.didiView === 'cooking' && activeOrder) {
      mainContent = renderDidiCookingHTML(activeOrder);
    } else if (S.didiView === 'payout') {
      mainContent = renderDidiPayoutHTML();
    } else {
      mainContent = `
      <div style="padding:16px" class="stack">
        <div class="row-between wrap" style="gap:8px">
          <div>
            <div class="xs muted" style="text-transform:uppercase;font-weight:700">Orders Stream</div>
            <h1 style="font-size:22px;margin-top:2px">Incoming Bookings</h1>
          </div>
          <div class="row" style="gap:6px">
            <button class="btn btn-secondary btn-sm" data-action="didi-refresh" style="font-size:12px">${icon('refresh', 13)} Refresh</button>
            ${all.length ? `<button class="btn btn-ghost btn-sm" data-action="didi-clear-all" style="font-size:12px;color:#EA4335" title="Remove all orders">${icon('trash', 12)} Clear All</button>` : ''}
          </div>
        </div>

        <!-- Filter Sub-Tabs -->
        <div class="seg" style="margin:4px 0 8px">
          <button class="${S.didiFilter === 'all' ? 'on' : ''}" data-action="didi-filter" data-f="all">All (${all.length})</button>
          <button class="${S.didiFilter === 'pending' ? 'on' : ''}" data-action="didi-filter" data-f="pending">New (${pendingCount})</button>
          <button class="${S.didiFilter === 'preparing' ? 'on' : ''}" data-action="didi-filter" data-f="preparing">Active (${activeCount})</button>
          <button class="${S.didiFilter === 'completed' ? 'on' : ''}" data-action="didi-filter" data-f="completed">Done (${completedCount})</button>
        </div>

        <input class="input" data-input="didi-search" value="${esc(S.didiQuery)}" placeholder="Search dish, order #, athlete…" autocomplete="off" style="font-size:13.5px">

        <div id="didiOrdersContainer" style="margin-top:8px">${renderDidiOrderCardsHTML()}</div>
      </div>`;
    }

    return `
    <div class="didi-phone-shell">
      <!-- Phone Top Bar -->
      <header class="didi-phone-topbar">
        <div class="didi-partner-profile">
          <div class="didi-avatar-wrap">
            ${icon('chef', 22)}
            <span class="didi-online-pip" title="Active & Ready"></span>
          </div>
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--ink);line-height:1.2">Chef Sunita Didi</div>
            <div class="xs muted" style="display:flex;align-items:center;gap:4px">
              <span class="live-dot" style="width:6px;height:6px"></span> Online Partner
            </div>
          </div>
        </div>
        <div class="row" style="gap:8px">
          <div class="didi-wallet-chip" data-action="didi-wallet" title="View Wallet">
            <span>₹</span><span>${(S.didiWallet || 1250).toLocaleString('en-IN')}</span>
          </div>
          ${themeBtn()}
          <a class="btn btn-ghost btn-sm" href="/" style="padding:5px 8px;font-size:11.5px" title="Main Athlete Site">Web ↗</a>
        </div>
      </header>

      <!-- Main Phone Viewport Area -->
      <main style="flex:1;overflow-y:auto">
        ${mainContent}
      </main>
    </div>`;
  }

  // ------------------------------------------------------------------
  // Modals
  // ------------------------------------------------------------------
  function renderModal() {
    if (!S.modal) return '';
    let inner = '';
    if (S.modal === 'auth') {
      const up = S.authTab === 'signup';
      inner = `<div class="modal">
        <div class="modal-head"><div class="row"><span class="brand-mark" style="width:36px;height:36px"><img src="/logo-mark.png" alt="ZAP FIT" class="brand-logo-img"></span><h3>${up ? 'Create your account' : 'Welcome back'}</h3></div><button class="icon-btn sm" data-action="close-modal" aria-label="Close">${icon('close', 15)}</button></div>
        <div class="seg"><button class="${!up ? 'on' : ''}" data-action="auth-tab" data-tab="signin">Sign in</button><button class="${up ? 'on' : ''}" data-action="auth-tab" data-tab="signup">Create account</button></div>
        <button class="btn btn-secondary btn-block" data-action="google" ${S.authBusy ? 'disabled' : ''}>${GOOGLE_SVG} Continue with Google</button>
        <div class="divider">OR WITH EMAIL</div>
        <form data-form="email-auth" class="stack-sm">
          <div class="field"><label for="au-email">Email</label><input class="input" id="au-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div>
          <div class="field"><label for="au-pass">Password</label><input class="input" id="au-pass" name="password" type="password" required minlength="6" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="At least 6 characters"></div>
          ${S.authError ? `<div class="form-error">${esc(S.authError)}</div>` : ''}
          <button class="btn btn-primary btn-block" type="submit" ${S.authBusy ? 'disabled' : ''}>${S.authBusy ? 'Please wait…' : up ? 'Create account' : 'Sign in'}</button>
        </form>
        <p class="xs muted" style="text-align:center;margin-top:14px">Next, you'll answer 9 quick questions so ZAP FIT AI can build your plan.</p>
      </div>`;
    } else if (S.modal === 'workout') {
      const def = S.data.profile.primaryStrategy;
      inner = `<div class="modal">
        <div class="modal-head"><h3>Log a workout</h3><button class="icon-btn sm" data-action="close-modal" aria-label="Close">${icon('close', 15)}</button></div>
        <form data-form="workout" class="stack-sm">
          <div class="field"><label for="wk-type">Session type</label><select class="input" id="wk-type" name="type">${STRATEGIES.map((s) => `<option ${s.workout_type === def ? 'selected' : ''}>${esc(s.workout_type)}</option>`).join('')}</select></div>
          <div class="field"><label for="wk-title">What did you do?</label><input class="input" id="wk-title" name="title" placeholder="e.g. Push day — chest & shoulders" maxlength="60"></div>
          <div class="grid-2">
            <div class="field"><label for="wk-min">Duration (min)</label><input class="input" id="wk-min" name="minutes" type="number" min="5" max="300" value="60" required></div>
            <div class="field"><label for="wk-int">Intensity</label><select class="input" id="wk-int" name="intensity"><option>Low</option><option selected>Moderate</option><option>High</option></select></div>
          </div>
          <div class="field"><label for="wk-date">Date</label><input class="input" id="wk-date" name="date" type="date" value="${S.tab === 'history' ? S.historyDate : todayKey()}" max="${todayKey()}"></div>
          <button class="btn btn-primary btn-block" type="submit" style="margin-top:6px">Save workout</button>
        </form>
      </div>`;
    } else if (S.modal === 'meal') {
      const m = MEALS.find((x) => x.id === S.selectedMealId);
      const r = m ? scoreMeal(m) : null;
      if (!m || !r || !r.allowed) { S.modal = null; return ''; }
      const logDate = S.tab === 'history' ? S.historyDate : todayKey();
      const steps = (m.steps && m.steps.length) ? m.steps : [
        'Gather and measure all fresh ingredients and spices.',
        'Cook the primary protein and carbohydrate components according to recommended athlete nutrition guidelines.',
        'Combine, season to taste, and serve warm for immediate post-workout glycogen replenishment.'
      ];
      inner = `<div class="modal wide">
        <div class="modal-head">
          <div class="grow">
            <span class="xs muted">${esc(m.category)} · ${esc(m.recommended_post_workout)}</span>
            <h3 style="margin-top:4px">${esc(m.name)}</h3>
          </div>
          ${ring(r.total, true)}
          <button class="icon-btn sm" data-action="close-modal" aria-label="Close">${icon('close', 15)}</button>
        </div>
        <p class="small ink-2" style="margin-bottom:14px">${esc(m.benefits)}</p>
        <div class="macro-grid" style="margin-bottom:16px">
          <div class="macro"><span>PROTEIN</span><b class="accent-text">${m.protein}g</b></div>
          <div class="macro"><span>CARBS</span><b>${m.carbs}g</b></div>
          <div class="macro"><span>FAT</span><b>${m.fat}g</b></div>
          <div class="macro"><span>KCAL</span><b>${m.calories}</b></div>
        </div>
        <div class="card" style="padding:14px;margin-bottom:14px;background:var(--surface-2)"><div class="stack-sm">${FACTORS.map((f, j) => `<div class="factor"><span class="lbl">${f.name}</span>${progress(r.factors[j], f.max)}<span class="val">${r.factors[j]}/${f.max}</span></div>`).join('')}</div></div>
        <div class="check-list" style="margin-bottom:12px">${r.why.map((w) => `<div>${icon('check', 15)}<span>${w}</span></div>`).join('')}</div>
        <div class="note" style="margin-bottom:14px"><b>Why not 100%?</b> ${r.not100}</div>

        <!-- Recipe & Steps to Make Section -->
        <div class="recipe-section">
          <div class="recipe-header">
            <div>
              <h4 style="margin:0;font-size:16px;display:flex;align-items:center;gap:8px">
                <span class="list-icon" style="width:26px;height:26px">${icon('sparkle', 14)}</span>
                Recipe & Steps to Make
              </h4>
              <p class="xs muted" style="margin-top:2px">Follow these steps for optimal nutrient preservation</p>
            </div>
            <div class="recipe-meta">
              <span class="recipe-badge">${icon('clock', 12)} Prep: <strong>${esc(m.prep_time || '8 mins')}</strong></span>
              <span class="recipe-badge">${icon('clock', 12)} Cook: <strong>${esc(m.cook_time || '12 mins')}</strong></span>
            </div>
          </div>

          <div style="margin-bottom:14px">
            <div class="row-between wrap" style="margin-bottom:6px;gap:6px">
              <p class="small" style="margin:0"><b>Ingredients Needed</b></p>
              ${r.pantryMatch ? `<span class="pantry-match-badge ${r.pantryMatch.allInStock ? 'high' : r.pantryMatch.hasMajority ? 'med' : 'low'}" style="font-size:11px">${icon('box', 12)} Pantry: ${r.pantryMatch.inStock.length}/${r.pantryMatch.total} in kitchen</span>` : ''}
            </div>
            <div class="ingredients-pills">
              ${(m.ingredients || []).map((ing) => {
                const inKitchen = Boolean(S.data?.pantry?.[ing.trim()]);
                return `<span class="ing-pill" style="${inKitchen ? 'background:rgba(52,168,83,0.15);border:1px solid rgba(52,168,83,0.45);color:#34A853' : 'background:rgba(234,67,53,0.1);border:1px solid rgba(234,67,53,0.35);color:var(--ink)'}">${inKitchen ? '✓ ' : '✕ '}${esc(ing)}</span>`;
              }).join('')}
            </div>
            <div class="xs muted" style="margin-top:6px">Chef Didi boils rice, prepares fresh batters, and cooks using your raw pantry staples. Update items in your <a href="#" data-action="tab" data-tab="pantry" style="color:var(--accent-text);text-decoration:underline">Kitchen Pantry</a>.</div>
          </div>

          <p class="small" style="margin-bottom:6px"><b>Preparation & Cooking Instructions</b></p>
          <div class="recipe-step-list">
            ${steps.map((st, idx) => `<div class="recipe-step-item">
              <span class="recipe-step-badge">Step ${idx + 1}</span>
              <span class="recipe-step-text">${esc(st)}</span>
            </div>`).join('')}
          </div>
        </div>

        <p class="xs muted" style="margin:14px 0 16px">Micronutrients: ${esc((m.micronutrients || []).join(', ') || '—')} · Allergens: ${esc((m.allergens_present || []).join(', ') || 'none declared')}</p>
        <div class="grid-2">
          <button class="btn btn-didi btn-block" data-action="order-didi" data-id="${m.id}">${icon('chef', 16)} Cook with Chef Didi</button>
          ${(() => {
            const inProgressDidi = (S.didiOrders || []).find((x) =>
              x.mealId === m.id &&
              x.date === logDate &&
              x.status !== 'completed' &&
              (!S.user || !x.athlete?.uid || x.athlete.uid === S.user.uid || x.athlete.uid === 'guest')
            );
            if (inProgressDidi) {
              return `<button class="btn btn-secondary btn-block" data-action="log-meal" data-id="${m.id}" style="opacity:0.65;cursor:not-allowed" title="Chef Didi is currently preparing this meal. All steps must be completed before meal approval.">${icon('clock', 14)} Awaiting Chef Didi Completion</button>`;
            }
            return `<button class="btn btn-primary btn-block" data-action="log-meal" data-id="${m.id}">${icon('check', 16)} Log as eaten${logDate !== todayKey() ? ' on ' + esc(prettyDate(logDate)) : ' today'}</button>`;
          })()}
        </div>
      </div>`;
    } else if (S.modal === 'didi-recipe') {
      const o = (S.didiOrders || []).find((x) => x.id === S.selectedOrderId);
      if (!o) { S.modal = null; return ''; }
      const allergies = o.athlete?.allergies || [];
      const steps = getOrderSteps(o);
      const checked = getOrderCheckedSteps(o.id);
      const completedCount = steps.filter((_, idx) => !!checked[idx]).length;
      const allCompleted = steps.length > 0 && completedCount === steps.length;

      inner = `<div class="modal wide">
        <div class="modal-head">
          <div class="grow">
            <div class="row" style="gap:8px;margin-bottom:4px">
              <span class="badge badge-solid mono">${esc(o.orderNumber || '#DIDI')}</span>
              ${statusBadgeHTML(o.status)}
            </div>
            <h3>${esc(o.mealName)}</h3>
          </div>
          <button class="icon-btn sm" data-action="close-modal" aria-label="Close">${icon('close', 15)}</button>
        </div>
        <div class="didi-athlete-box" style="margin-bottom:14px">
          <div><b>Ordered by:</b> ${esc(o.athlete?.name || 'ZAP FIT Athlete')} · <b>Diet:</b> ${esc(o.athlete?.diet || o.category)}</div>
          <div class="xs muted">Time: ${esc(o.date)} at ${esc(o.time)} · Session: ${esc(o.athlete?.workoutSession || o.recommendedPostWorkout)}</div>
          ${allergies.length ? `<div class="note danger" style="margin-top:6px;display:flex;align-items:center;gap:6px"><b>${icon('alert', 13)} ALLERGY ALERT — AVOID:</b> ${esc(allergies.join(', '))}</div>` : ''}
        </div>
        <div class="macro-grid" style="margin-bottom:14px">
          <div class="macro"><span>PROTEIN</span><b class="accent-text">${o.protein}g</b></div>
          <div class="macro"><span>CARBS</span><b>${o.carbs}g</b></div>
          <div class="macro"><span>FAT</span><b>${o.fat}g</b></div>
          <div class="macro"><span>KCAL</span><b>${o.calories}</b></div>
        </div>
        <p class="small" style="margin-bottom:6px"><b>Ingredients (${(o.ingredients || []).length})</b></p>
        <div class="ingredients-pills">${(o.ingredients || []).map((ing) => `<span class="ing-pill">${esc(ing)}</span>`).join('')}</div>
        
        <div class="row-between" style="margin-top:14px;margin-bottom:6px">
          <p class="small" style="margin:0"><b>Cooking Instructions (${completedCount}/${steps.length} Steps Completed)</b></p>
          <span class="xs ${allCompleted ? 'accent-text font-bold' : 'muted'}" style="display:flex;align-items:center;gap:4px">${allCompleted ? `${icon('check', 12)} Steps Verified` : 'Tap step to check off'}</span>
        </div>
        <div class="stack-sm" style="margin-bottom:16px">
          ${steps.map((st, idx) => {
            const isChecked = !!checked[idx];
            return `<div class="didi-cooking-check ${isChecked ? 'checked' : ''}" data-action="didi-toggle-step" data-step="${idx}" data-id="${o.id}">
              <div class="didi-checkbox-custom">${isChecked ? '✓' : ''}</div>
              <div style="font-size:12.5px;line-height:1.35;flex:1">
                <span class="xs mono" style="font-weight:700">Step ${idx + 1}: </span>
                <span style="${isChecked ? 'text-decoration:line-through;opacity:0.8' : ''}">${esc(st)}</span>
              </div>
            </div>`;
          }).join('')}
        </div>

        ${!allCompleted ? `
        <div class="note warn" style="margin-bottom:12px;font-size:12px;display:flex;align-items:center;gap:6px">
          <span style="color:#D06828">${icon('alert', 14)}</span>
          <div><b>Step Completion Required:</b> Chef Didi must finish all cooking steps before this meal can be approved and completed.</div>
        </div>
        ` : ''}

        <div class="row wrap" style="gap:8px">
          <button class="btn btn-didi grow" data-action="didi-show-cooking" data-id="${o.id}">${icon('cooking', 15)} Open Cooking View</button>
          ${allCompleted ? `
            <button class="btn btn-primary grow" data-action="didi-status" data-id="${o.id}" data-status="completed">${icon('check', 15)} Approve & Complete</button>
          ` : `
            <button class="btn btn-secondary grow" data-action="didi-status" data-id="${o.id}" data-status="completed" style="opacity:0.5;cursor:not-allowed" title="Complete all steps before approving">${icon('lock', 14)} Complete All Steps to Approve (${completedCount}/${steps.length})</button>
          `}
        </div>
      </div>`;
    } else if (S.modal === 'didi-payment') {
      const m = MEALS.find((x) => x.id === S.pendingPaymentMealId);
      if (!m) { S.modal = null; return ''; }
      const price = 249;
      const savedName = localStorage.getItem('zapfit:saved_name') || S.data?.answers?.name || S.user?.name || '';
      const savedPhone = localStorage.getItem('zapfit:saved_phone') || '';
      const savedEmail = localStorage.getItem('zapfit:saved_email') || (S.user?.uid && S.user.uid.includes('@') ? S.user.uid : '');
      const savedAddress = localStorage.getItem('zapfit:saved_address') || '';

      inner = `<div class="modal didi-qr-modal" style="text-align:center;max-width:460px">
        <div class="modal-head" style="justify-content:center;position:relative">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="didi-avatar-wrap" style="width:34px;height:34px">${icon('chef', 18)}</span>
            <h3 style="font-size:18px;margin:0">Book Chef Didi · Details & QR</h3>
          </div>
          <button class="icon-btn sm" data-action="close-modal" aria-label="Close" style="position:absolute;right:0">${icon('close', 15)}</button>
        </div>

        <div style="background:var(--surface-2);border-radius:12px;padding:12px 14px;margin:10px 0;text-align:left;border:1px solid var(--border)">
          <div class="row-between">
            <span style="font-weight:700;font-size:15px">${esc(m.name)}</span>
            <span class="score-pill" style="font-size:14px">₹${price}</span>
          </div>
          <div class="xs muted" style="margin-top:4px">${m.protein}g Protein · ${m.carbs}g Carbs · ${m.calories} kcal · ${esc(m.prep_time || '8m')} prep</div>
        </div>

        <!-- User Contact & Kitchen Address Inputs -->
        <div style="background:var(--surface-2);border-radius:12px;padding:12px 14px;margin-bottom:12px;text-align:left;border:1px solid var(--border)">
          <div class="row-between" style="margin-bottom:8px">
            <span class="xs muted" style="font-weight:800;letter-spacing:.05em;text-transform:uppercase;display:flex;align-items:center;gap:4px">${icon('pin', 12)} Your Kitchen Address & Contact</span>
            <span class="xs accent-text" style="font-weight:700">For Chef Didi</span>
          </div>

          <div class="stack-sm">
            <div>
              <label class="xs muted" style="font-weight:600;display:block;margin-bottom:2px" for="didi-name">Your Full Name</label>
              <input id="didi-name" class="input" style="font-size:13.5px;padding:8px 10px" placeholder="e.g. Rahul Sharma" value="${esc(savedName)}">
            </div>

            <div class="grid-2" style="gap:8px">
              <div>
                <label class="xs muted" style="font-weight:600;display:block;margin-bottom:2px" for="didi-phone">Phone Number <span style="color:#EA4335">*</span></label>
                <input id="didi-phone" type="tel" class="input" style="font-size:13.5px;padding:8px 10px" placeholder="e.g. 9876543210" value="${esc(savedPhone)}">
              </div>
              <div>
                <label class="xs muted" style="font-weight:600;display:block;margin-bottom:2px" for="didi-email">Email Address <span style="color:#EA4335">*</span></label>
                <input id="didi-email" type="email" class="input" style="font-size:13.5px;padding:8px 10px" placeholder="athlete@example.com" value="${esc(savedEmail)}">
              </div>
            </div>

            <div>
              <label class="xs muted" style="font-weight:600;display:block;margin-bottom:2px" for="didi-address">Complete Delivery / Kitchen Address <span style="color:#EA4335">*</span></label>
              <textarea id="didi-address" class="input" rows="2" style="font-size:13px;padding:8px 10px;resize:vertical;min-height:50px" placeholder="Flat / House No., Apartment / Tower, Street, Landmark...">${esc(savedAddress)}</textarea>
            </div>
          </div>
        </div>

        <!-- Home Kitchen Notice -->
        <div class="didi-food-bag-banner" style="text-align:left;margin-bottom:12px">
          <div class="icon">${icon('cooking', 20)}</div>
          <div style="font-size:12px;line-height:1.4">
            <b style="color:var(--ink);display:block;margin-bottom:2px">Chef Didi Cooks in Your Home Kitchen!</b>
            Chef Didi will come to your home to cook fresh recovery nutrition using raw staples from your pantry. Chef Didi handles all preparation — boiling rice, making fresh batters, chopping, and cooking fresh from scratch!
          </div>
        </div>

        <!-- Dummy UPI QR Code -->
        <div class="qr-frame" style="padding:10px">
          <svg width="150" height="150" viewBox="0 0 180 180" style="display:block;margin:0 auto">
            <rect width="180" height="180" fill="#ffffff" rx="10"/>
            <rect x="14" y="14" width="46" height="46" fill="#121212" rx="4"/>
            <rect x="20" y="20" width="34" height="34" fill="#ffffff" rx="2"/>
            <rect x="26" y="26" width="22" height="22" fill="#D06828" rx="2"/>

            <rect x="120" y="14" width="46" height="46" fill="#121212" rx="4"/>
            <rect x="126" y="20" width="34" height="34" fill="#ffffff" rx="2"/>
            <rect x="132" y="26" width="22" height="22" fill="#D06828" rx="2"/>

            <rect x="14" y="120" width="46" height="46" fill="#121212" rx="4"/>
            <rect x="20" y="126" width="34" height="34" fill="#ffffff" rx="2"/>
            <rect x="26" y="132" width="22" height="22" fill="#D06828" rx="2"/>

            <g fill="#242b35">
              <rect x="68" y="16" width="8" height="8"/><rect x="80" y="16" width="8" height="8"/><rect x="96" y="16" width="16" height="8"/>
              <rect x="68" y="28" width="16" height="8"/><rect x="92" y="28" width="8" height="8"/><rect x="104" y="28" width="8" height="8"/>
              <rect x="76" y="40" width="8" height="8"/><rect x="88" y="40" width="16" height="8"/>
              <rect x="68" y="52" width="8" height="8"/><rect x="84" y="52" width="8" height="8"/><rect x="100" y="52" width="12" height="8"/>

              <rect x="16" y="68" width="8" height="8"/><rect x="28" y="68" width="16" height="8"/><rect x="52" y="68" width="8" height="8"/>
              <rect x="124" y="68" width="16" height="8"/><rect x="148" y="68" width="16" height="8"/>
              <rect x="20" y="80" width="16" height="8"/><rect x="44" y="80" width="16" height="8"/>
              <rect x="120" y="80" width="8" height="8"/><rect x="136" y="80" width="24" height="8"/>
              <rect x="16" y="92" width="8" height="8"/><rect x="32" y="92" width="8" height="8"/><rect x="48" y="92" width="12" height="8"/>
              <rect x="124" y="92" width="16" height="8"/><rect x="152" y="92" width="8" height="8"/>
              <rect x="24" y="104" width="16" height="8"/><rect x="48" y="104" width="8" height="8"/>
              <rect x="120" y="104" width="20" height="8"/><rect x="148" y="104" width="16" height="8"/>

              <rect x="68" y="120" width="16" height="8"/><rect x="92" y="120" width="8" height="8"/><rect x="104" y="120" width="16" height="8"/><rect x="128" y="120" width="16" height="8"/><rect x="152" y="120" width="8" height="8"/>
              <rect x="68" y="132" width="8" height="8"/><rect x="84" y="132" width="16" height="8"/><rect x="112" y="132" width="8" height="8"/><rect x="128" y="132" width="8" height="8"/><rect x="144" y="132" width="16" height="8"/>
              <rect x="76" y="144" width="8" height="8"/><rect x="92" y="144" width="16" height="8"/><rect x="120" y="144" width="16" height="8"/><rect x="144" y="144" width="8" height="8"/>
              <rect x="68" y="156" width="16" height="8"/><rect x="96" y="156" width="8" height="8"/><rect x="112" y="156" width="16" height="8"/><rect x="136" y="156" width="16" height="8"/>
            </g>

            <circle cx="90" cy="90" r="19" fill="#121212" stroke="#F8D858" stroke-width="2.5"/>
            <text x="90" y="94" text-anchor="middle" font-size="12" font-weight="bold" fill="#F8D858" font-family="sans-serif">ZAP</text>
          </svg>
        </div>

        <div class="row wrap" style="justify-content:center;gap:6px;margin:6px 0 10px">
          <span class="badge badge-muted" style="font-size:10.5px">GPay</span>
          <span class="badge badge-muted" style="font-size:10.5px">PhonePe</span>
          <span class="badge badge-muted" style="font-size:10.5px">Paytm</span>
          <span class="badge badge-solid mono" style="font-size:10.5px">UPI: chefdidi@zapfit</span>
        </div>

        <div class="stack-sm">
          <button class="btn btn-didi btn-block btn-lg" data-action="confirm-didi-payment" style="font-size:15px;font-weight:800">
            ${icon('check', 16)} Payment Complete (Confirm Booking)
          </button>
          <button class="btn btn-ghost btn-block btn-sm" data-action="close-modal">Cancel</button>
        </div>
      </div>`;
    } else if (S.modal === 'didi-wallet') {
      const all = S.didiOrders || [];
      const completed = all.filter((o) => o.status === 'completed');
      inner = `<div class="modal" style="max-width:440px">
        <div class="modal-head">
          <div class="row" style="gap:8px">
            <span class="didi-avatar-wrap" style="width:34px;height:34px">${icon('wallet', 18)}</span>
            <h3>Chef Didi Wallet</h3>
          </div>
          <button class="icon-btn sm" data-action="close-modal" aria-label="Close">${icon('close', 15)}</button>
        </div>

        <div class="card" style="background:var(--surface-2);border-radius:14px;padding:16px;text-align:center;margin:12px 0">
          <div class="xs muted" style="text-transform:uppercase;font-weight:700">Available Payout Balance</div>
          <div style="font-size:32px;font-weight:800;color:#F8D858;margin:6px 0">₹${(S.didiWallet || 1250).toLocaleString('en-IN')}</div>
          <div class="xs accent-text" style="font-weight:600;display:flex;align-items:center;justify-content:center;gap:4px">${icon('check', 12)} Linked: HDFC Bank •••• 4092</div>
        </div>

        <div class="row-between" style="margin-bottom:8px">
          <span class="xs muted" style="font-weight:700;text-transform:uppercase">Recent Completed Orders (${completed.length})</span>
          <span class="xs muted">₹250 / order</span>
        </div>
        <div class="stack-sm" style="max-height:220px;overflow-y:auto;margin-bottom:14px">
          ${completed.length ? completed.slice(0, 10).map((o) => `<div class="row-between" style="padding:8px 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px">
            <div>
              <div style="font-size:13px;font-weight:700">${esc(o.mealName)}</div>
              <div class="xs muted">${esc(o.orderNumber || '#DIDI')} · ${esc(o.time || '')}</div>
            </div>
            <span class="xs accent-text" style="font-weight:800">+₹250</span>
          </div>`).join('') : `<div class="empty xs">No orders completed yet today.</div>`}
        </div>

        <button class="btn btn-primary btn-block" data-action="simulate-withdraw">Simulate Instant Bank Transfer</button>
      </div>`;
    } else if (S.modal === 'ai') {
      const msgs = S.chat.length ? S.chat : [{ role: 'assistant', text: `Hi ${firstName(S.data.answers.name)}! I know your targets, today's log, yesterday's history, and your diet. Ask me anything about recovery nutrition.` }];
      inner = `<div class="modal wide">
        <div class="modal-head"><div class="row"><span class="list-icon">${icon('sparkle', 17)}</span><div><h3>ZAP FIT AI coach</h3><span class="xs muted">Personalised to your plan</span></div></div><button class="icon-btn sm" data-action="close-modal" aria-label="Close">${icon('close', 15)}</button></div>
        <div class="chat" id="chatBox">${msgs.map((m) => `<div class="msg ${m.role === 'user' ? 'me' : 'ai'}">${esc(m.text).replace(/\n/g, '<br>')}</div>`).join('')}${S.chatBusy ? '<div class="msg ai muted">Thinking…</div>' : ''}</div>
        <form data-form="ai" class="row"><input class="input" name="q" placeholder="e.g. How did I do yesterday? What should I eat next?" autocomplete="off" ${S.chatBusy ? 'disabled' : ''}><button class="btn btn-primary" type="submit" ${S.chatBusy ? 'disabled' : ''}>${icon('send', 16)}</button></form>
      </div>`;
    }
    return `<div class="modal-overlay" data-action="overlay">${inner}</div>`;
  }

  function buildCoachSystemPrompt() {
    const a = S.data?.answers || {};
    const p = S.data?.profile || {};
    const allMeals = S.data?.meals || [];
    const allWorkouts = S.data?.workouts || [];
    const today = todayKey();
    const yesterday = shiftKey(today, -1);

    // Build last 7 days comprehensive daily summaries (newest first)
    const recentDays = [];
    for (let i = 0; i <= 6; i++) {
      const k = shiftKey(today, -i);
      const isToday = k === today;
      const isYest = k === yesterday;
      const tag = isToday ? 'TODAY' : isYest ? 'YESTERDAY' : shortDay(k).toUpperCase();
      const dayMeals = allMeals.filter((m) => m.date === k);
      const dayWorkouts = allWorkouts.filter((w) => w.date === k);
      const dayP = sum(dayMeals, 'protein');
      const dayC = sum(dayMeals, 'carbs');
      const dayF = sum(dayMeals, 'fat');
      const dayKcal = sum(dayMeals, 'calories');

      const mealsDesc = dayMeals.length
        ? dayMeals.map((m) => `“${m.name}” (${m.protein}g protein, ${m.carbs}g carbs, ${m.fat}g fat, ${m.calories} kcal logged at ${m.time})`).join('; ')
        : 'No meals logged';

      const workoutsDesc = dayWorkouts.length
        ? dayWorkouts.map((w) => `“${w.title || w.type}” (${w.type}, ${w.minutes} min, ${w.intensity} intensity, ~${w.kcal} kcal burned)`).join('; ')
        : 'No workouts logged';

      recentDays.push(`[${tag} — ${prettyDate(k)} (${k})]:
- Workouts: ${workoutsDesc}
- Meals Eaten: ${mealsDesc}
- Nutrition Totals: ${dayP}g Protein (Daily target: ${p.proteinTarget}g), ${dayC}g Carbs (Daily target: ${p.carbsTarget}g), ${dayF}g Fat (Daily target: ${p.fatTarget}g), ${dayKcal} kcal (Daily target: ${p.caloriesTarget} kcal)`);
    }

    // Build athlete pantry inventory & ready meals for AI
    const pantry = S.data?.pantry || {};
    const inStockList = [];
    const missingList = [];
    ALL_PANTRY_INGREDIENTS.forEach((item) => {
      if (pantry[item.name]) inStockList.push(item.name);
      else missingList.push(item.name);
    });

    const readyZeroMissing = [];
    const readyOneMissing = [];
    const readyTwoMissing = [];
    const notEligibleThreePlus = [];

    MEALS.forEach((m) => {
      const match = getMealPantryMatch(m);
      if (match.missing.length === 0) {
        readyZeroMissing.push(m.name);
      } else if (match.missing.length === 1) {
        readyOneMissing.push(`${m.name} (Need only: ${match.missing[0]})`);
      } else if (match.missing.length === 2) {
        readyTwoMissing.push(`${m.name} (Need: ${match.missing.join(', ')})`);
      } else {
        notEligibleThreePlus.push(m.name);
      }
    });

    return `You are ZAP FIT AI, the athlete's dedicated personal sports nutrition and recovery coach.
You have FULL, UNRESTRICTED ACCESS to all of the athlete's personal profile, body metrics, daily targets, today's logs, yesterday's report, and complete past history.
CRITICAL MANDATE: You must NEVER say "I do not have access to yesterday's data" or tell the user to check their own logs. All of their actual logged data is provided right below. Always analyze and quote their actual logged data directly with motivating coaching feedback.

=== ATHLETE PROFILE ===
- Name: ${a.name || S.user?.name || 'Athlete'}
- Age: ${a.age || '—'} | Gender: ${a.gender || '—'} | Height: ${a.height ? a.height + ' cm' : '—'} | Weight: ${a.weight ? a.weight + ' kg' : '—'}
- Activity Level: ${a.activity || '—'}
- Training Disciplines: ${(a.training || []).join(', ') || 'General training'} (${a.days || 4} days/week)
- Primary Goals: ${(a.purpose || []).join(', ') || 'Athletic performance'}
- Dietary Preference: ${a.diet || 'No preference'}
- Allergens to Avoid: ${(a.allergy || []).join(', ') || 'None declared'}
- Disliked Foods: ${a.disliked || 'None'}
- Health Considerations: ${a.health || 'None'}
- Usual Meal Schedule: ${(a.eat || []).join(', ') || '3-4 meals/day'}

=== CALIBRATED RECOVERY TARGETS ===
- Daily Calories: ${p.caloriesTarget || 2400} kcal/day
- Daily Protein: ${p.proteinTarget || 150} g/day
- Daily Carbohydrates: ${p.carbsTarget || 260} g/day
- Daily Fats: ${p.fatTarget || 65} g/day
- Daily Hydration Target: ${p.waterLitres || 3.0} Litres/day
- Recovery Strategy: ${p.primaryStrategy || 'Hypertrophy / Muscle Building'}
- Coach Focus: ${p.focus || 'Optimizing post-workout amino acid delivery and glycogen replenishment'}

=== ATHLETE HOME PANTRY INVENTORY & CHEF DIDI POLICY ===
- Chef Didi Policy: Chef Didi ONLY comes to the athlete's house to cook. She DOES NOT BRING OR PROVIDE INGREDIENTS. She cooks exclusively using the athlete's home pantry items.
- Ingredients IN STOCK in Athlete's Kitchen (${inStockList.length}): ${inStockList.length ? inStockList.join(', ') : 'None marked yet'}
- Ingredients MISSING / NEEDED (${missingList.length}): ${missingList.slice(0, 80).join(', ')}${missingList.length > 80 ? '...' : ''}

=== PANTRY MEAL ELIGIBILITY (ACCEPTANCE RULE: AT MOST 1-2 MISSING INGREDIENTS) ===
* 100% In Stock (0 Missing): ${readyZeroMissing.length ? readyZeroMissing.slice(0, 8).join('; ') : 'None with 100% ingredients'}
* 1 Missing Ingredient (Accepted): ${readyOneMissing.length ? readyOneMissing.slice(0, 8).join('; ') : 'None with 1 missing'}
* 2 Missing Ingredients (Accepted): ${readyTwoMissing.length ? readyTwoMissing.slice(0, 8).join('; ') : 'None with 2 missing'}
* Ineligible (3+ Missing — NEVER RECOMMEND): ${notEligibleThreePlus.length} meals require 3 or more missing items.

=== LOGGED ACTIVITY & MEAL HISTORY (TODAY, YESTERDAY & PAST 7 DAYS) ===
${recentDays.join('\n\n')}

=== COACHING RESPONSE RULES ===
- CRITICAL PANTRY RULE: The athlete STRICTLY wants meals recommended with ingredients actually available in their pantry. An acceptance of at most 1 to 2 missing ingredients is fine (missing <= 2). NEVER recommend any meal that requires 3 or more missing ingredients!
- When the athlete asks what to cook, what to eat, or for a meal recommendation:
  1. Recommend ONLY from the meals listed above that have 0, 1, or at most 2 missing ingredients (prioritize 0 missing first, then 1, then 2).
  2. Clearly state which ingredients the athlete already has ready in their pantry.
  3. Clearly state the 1 or 2 missing ingredients (if any) they need to procure. If 0 ingredients are missing, tell them it is 100% ready to cook right now from their pantry.
  4. Remind them Chef Didi will cook it in their kitchen using their own pantry items.
- If the athlete asks about yesterday (e.g. "what was yesterday's report?", "how did I do yesterday?", "did I hit my macros yesterday?"):
  Examine the [YESTERDAY] section above:
  * If meals or workouts are logged: summarize their exact workouts, meals eaten, total protein and calories consumed vs daily targets, and provide positive reinforcement or advice.
  * If no meals or workouts were logged yesterday: explain politely that no workouts or meals were recorded in ZAP FIT for yesterday (${prettyDate(yesterday)}), remind them of their target (${p.proteinTarget}g protein, ${p.caloriesTarget} kcal), and ask about today's training.
- If asked about today: reference [TODAY] and calculate remaining protein and calories needed to hit their targets.
- Never suggest foods that violate the athlete's diet (${a.diet}) or contain their allergens (${(a.allergy || []).join(', ')}).
- Answer in 2-4 clear, friendly, expert sentences. Do not use markdown headers, asterisks, or vendor names.`;
  }

  async function sendChat(q) {
    S.chat.push({ role: 'user', text: q });
    S.chatBusy = true; S.modal = 'ai'; render();
    const system = buildCoachSystemPrompt();
    try {
      const txt = await askAI([{ role: 'system', content: system }, ...S.chat.slice(-6).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))], 350);
      S.chat.push({ role: 'assistant', text: cleanText(txt) || 'Sorry, I could not answer that. Please try rephrasing.' });
    } catch (e) {
      S.chat.push({ role: 'assistant', text: 'I could not reach the coach right now. Please check your connection and try again.' });
    }
    S.chatBusy = false; render();
  }

  // ------------------------------------------------------------------
  // Master render
  // ------------------------------------------------------------------
  let currentRenderedModalKey = '__NONE__';
  function render() {
    const app = $('app');
    if (!app) return;
    if (isDidiRoute()) S.view = 'didi';

    if (S.view !== 'didi') {
      if (S.view === 'dashboard' && (!S.user || !S.data?.onboarded || !S.data?.profile)) S.view = S.user ? 'onboarding' : 'landing';
      if (['onboarding', 'calibrating', 'calibrated'].includes(S.view) && !S.user) S.view = 'landing';
    }

    if (!S.modal) {
      if (S.view === 'didi') app.innerHTML = renderDidiPlatform();
      else if (S.view === 'boot') app.innerHTML = '<div class="boot"><div class="spinner" aria-label="Loading"></div></div>';
      else if (S.view === 'landing') app.innerHTML = renderLanding();
      else if (S.view === 'onboarding') app.innerHTML = renderOnboarding();
      else if (S.view === 'calibrating') app.innerHTML = renderCalibrating();
      else if (S.view === 'calibrated') app.innerHTML = renderCalibrated();
      else app.innerHTML = renderDashboard();
    }

    const mc = $('modalsContainer');
    if (mc) {
      const modalKey = S.modal
        ? `${S.modal}_${S.authTab || ''}_${S.selectedMealId || ''}_${S.pendingPaymentMealId || ''}_${S.chat?.length || 0}_${S.didiActiveOrderId || ''}`
        : null;
      if (currentRenderedModalKey !== modalKey) {
        currentRenderedModalKey = modalKey;
        mc.innerHTML = renderModal();
      }
    }
    const chat = $('chatBox');
    if (chat) chat.scrollTop = chat.scrollHeight;
    renderToast();
  }

  // ------------------------------------------------------------------
  // Events (delegated once — survives every re-render)
  // ------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const act = el.dataset.action;
    if (act === 'overlay' && e.target !== el) return;
    switch (act) {
      case 'theme':
        S.theme = S.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('zapfit_theme_v3', S.theme);
        document.documentElement.setAttribute('data-theme', S.theme);
        render(); break;
      case 'logo':
        if (S.view === 'dashboard') { S.tab = 'today'; render(); }
        else if (S.view === 'landing') window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'scroll': { const t = $(el.dataset.target); if (t) t.scrollIntoView({ behavior: 'smooth' }); break; }
      case 'open-auth': S.authTab = el.dataset.tab || 'signin'; S.authError = ''; S.modal = 'auth'; render(); setTimeout(() => $('au-email')?.focus(), 50); break;
      case 'auth-tab': S.authTab = el.dataset.tab; S.authError = ''; render(); break;
      case 'google': signInGoogle(); break;
      case 'signout': signOut(); break;
      case 'close-modal': case 'overlay':
        if (S.authBusy) return;
        S.modal = null; render(); break;

      // Onboarding
      case 'ob-opt': {
        const st = ONB[S.onb.step], v = el.dataset.v, a = S.onb.answers;
        if (st.multi) {
          let arr = a[st.k].slice();
          if (v === 'None') arr = arr.includes('None') ? [] : ['None'];
          else { arr = arr.filter((x) => x !== 'None'); arr = arr.includes(v) ? arr.filter((x) => x !== v) : arr.concat(v); }
          a[st.k] = arr;
        } else a[st.k] = v;
        if (st.k === 'diet') readBasicInputs();
        S.onb.error = ''; render(); break;
      }
      case 'ob-days': S.onb.answers.days = Number(el.dataset.d); render(); break;
      case 'ob-back': readBasicInputs(); S.onb.step = Math.max(0, S.onb.step - 1); S.onb.error = ''; render(); window.scrollTo(0, 0); break;
      case 'ob-next': {
        readBasicInputs();
        const err = validateStep();
        if (err) { S.onb.error = err; render(); return; }
        S.onb.error = '';
        if (S.onb.step < ONB.length - 1) { S.onb.step++; render(); window.scrollTo(0, 0); }
        else finishOnboarding();
        break;
      }
      case 'restart-onb': S.modal = null; startOnboarding(); render(); break;
      case 'go-dashboard': S.view = 'dashboard'; S.tab = 'today'; render(); window.scrollTo(0, 0); toast('Your plan is live'); break;

      // Dashboard & Chef Didi Actions
      case 'tab': S.tab = el.dataset.tab; S.modal = null; render(); window.scrollTo(0, 0); break;
      case 'open-workout': S.modal = 'workout'; render(); break;
      case 'open-ai': S.modal = 'ai'; render(); setTimeout(() => document.querySelector('[data-form="ai"] input')?.focus(), 50); break;
      case 'open-meal': S.selectedMealId = el.dataset.id; S.modal = 'meal'; render(); break;
      case 'log-meal': logMeal(el.dataset.id, S.tab === 'history' ? S.historyDate : todayKey()); break;
      case 'order-didi': openDidiPaymentModal(el.dataset.id); break;
      case 'confirm-didi-payment': confirmDidiPayment(S.pendingPaymentMealId); break;
      case 'didi-go': didiStartTrip(el.dataset.id); break;
      case 'didi-reached': didiMarkReached(el.dataset.id); break;
      case 'didi-complete': didiCompleteOrder(el.dataset.id); break;
      case 'didi-show-map': S.didiActiveOrderId = el.dataset.id; S.didiView = 'map'; render(); break;
      case 'didi-show-cooking': S.didiActiveOrderId = el.dataset.id; S.didiView = 'cooking'; render(); break;
      case 'didi-view-orders': S.didiView = 'orders'; render(); break;
      case 'didi-toggle-step': {
        const orderId = el.dataset.id || S.didiActiveOrderId || S.selectedOrderId;
        const st = Number(el.dataset.step);
        toggleOrderStep(orderId, st);
        render();
        break;
      }
      case 'didi-wallet': S.modal = 'didi-wallet'; render(); break;
      case 'simulate-withdraw': {
        const amt = S.didiWallet || 1250;
        toast(`₹${amt.toLocaleString('en-IN')} transferred to HDFC Bank •••• 4092! Available in 1 min.`);
        S.modal = null;
        render();
        break;
      }
      case 'dismiss-reached-banner': S.dismissedReachedBanner = true; render(); break;
      case 'didi-status': updateDidiOrderStatus(el.dataset.id, el.dataset.status); break;
      case 'didi-delete': deleteDidiOrder(el.dataset.id); break;
      case 'didi-clear-all': clearAllDidiOrders(); break;
      case 'didi-filter': S.didiFilter = el.dataset.f; render(); break;
      case 'didi-refresh': fetchDidiOrders().then(() => toast('Synced orders with database')); break;
      case 'didi-open-order': S.selectedOrderId = el.dataset.id; S.modal = 'didi-recipe'; render(); break;
      case 'del-meal': S.data.meals = S.data.meals.filter((m) => m.id !== el.dataset.id); persist(); toast('Meal removed'); render(); break;
      case 'del-workout': S.data.workouts = S.data.workouts.filter((w) => w.id !== el.dataset.id); persist(); toast('Workout removed'); render(); break;
      case 'day': { const n = Number(el.dataset.n); const k = shiftKey(S.historyDate, n); if (k <= todayKey()) { S.historyDate = k; render(); } break; }
      case 'day-today': S.historyDate = todayKey(); render(); break;
      case 'pick-day': S.historyDate = el.dataset.d; render(); break;
      case 'lib-filter': S.libFilter = el.dataset.f; render(); break;
      case 'toggle-pantry-item': {
        const name = el.dataset.name;
        if (!name) break;
        if (!S.data.pantry) S.data.pantry = {};
        S.data.pantry[name] = !S.data.pantry[name];
        Store.savePantry(S.data.pantry);
        persist();
        render();
        break;
      }
      case 'pantry-staples': {
        if (!S.data.pantry) S.data.pantry = {};
        COMMON_KITCHEN_STAPLES.forEach((s) => { S.data.pantry[s] = true; });
        Store.savePantry(S.data.pantry);
        persist();
        toast('Common kitchen staples checked in your pantry!');
        render();
        break;
      }
      case 'pantry-select-all': {
        if (!S.data.pantry) S.data.pantry = {};
        ALL_PANTRY_INGREDIENTS.forEach((item) => { S.data.pantry[item.name] = true; });
        Store.savePantry(S.data.pantry);
        persist();
        toast('All 234 ingredients marked in stock');
        render();
        break;
      }
      case 'pantry-clear-all': {
        S.data.pantry = {};
        Store.savePantry({});
        persist();
        toast('Pantry cleared');
        render();
        break;
      }
      case 'pantry-filter': {
        S.pantryFilter = el.dataset.category || 'all';
        render();
        break;
      }
      case 'pantry-clear-search': {
        S.pantrySearch = '';
        render();
        break;
      }
      case 'ask-ai-pantry': {
        sendChat('What meals can I make right now with the ingredients in my pantry? Recommend meals where I already have the majority of ingredients.');
        break;
      }
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form).entries());
    const kind = form.dataset.form;
    if (kind === 'email-auth') signInEmail(String(fd.email || '').trim(), String(fd.password || ''));
    else if (kind === 'workout') logWorkout(fd);
    else if ((kind === 'ai' || kind === 'quick-ai') && String(fd.q || '').trim()) sendChat(String(fd.q).trim());
  });

  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (!el) return;
    if (el.dataset.input === 'lib-search') {
      S.libQuery = el.value;
      const grid = $('mealGrid');
      if (grid) grid.innerHTML = mealGridHTML();
    } else if (el.dataset.input === 'didi-search') {
      S.didiQuery = el.value;
      const cont = $('didiOrdersContainer');
      if (cont) cont.innerHTML = renderDidiOrderCardsHTML();
    } else if (el.dataset.input === 'pantry-search') {
      S.pantrySearch = el.value;
      const pantryGrid = $('pantryGrid');
      if (pantryGrid) {
        const pantry = S.data?.pantry || {};
        const activeFilter = S.pantryFilter || 'all';
        const searchQuery = S.pantrySearch.trim().toLowerCase();
        const filtered = ALL_PANTRY_INGREDIENTS.filter((item) => {
          const isChecked = Boolean(pantry[item.name]);
          if (activeFilter === 'in_stock' && !isChecked) return false;
          if (activeFilter === 'missing' && isChecked) return false;
          if (activeFilter !== 'all' && activeFilter !== 'in_stock' && activeFilter !== 'missing') {
            if (item.category !== activeFilter) return false;
          }
          if (searchQuery) {
            if (!item.name.toLowerCase().includes(searchQuery) && !item.category.toLowerCase().includes(searchQuery)) {
              return false;
            }
          }
          return true;
        });
        pantryGrid.innerHTML = filtered.map((item) => {
          const isChecked = Boolean(pantry[item.name]);
          return `
            <div class="pantry-item-card ${isChecked ? 'in-stock' : ''}" data-action="toggle-pantry-item" data-name="${esc(item.name)}">
              <div class="pantry-checkbox" aria-checked="${isChecked ? 'true' : 'false'}">
                ${isChecked ? '✓' : ''}
              </div>
              <div class="pantry-item-info">
                <div class="pantry-item-name" title="${esc(item.name)}">${esc(item.name)}</div>
                <div class="pantry-item-meta">
                  <span class="muted">${item.category}</span>
                  <span class="muted">·</span>
                  <span class="muted">${item.mealsCount} meal${item.mealsCount === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-input="history-date"]');
    if (el && el.value) { S.historyDate = el.value > todayKey() ? todayKey() : el.value; render(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && S.modal && !S.authBusy) { S.modal = null; render(); }
  });
  window.addEventListener('popstate', () => {
    if (isDidiRoute()) { S.view = 'didi'; render(); }
  });
  window.addEventListener('hashchange', () => {
    if (isDidiRoute()) { S.view = 'didi'; render(); }
  });

  // ------------------------------------------------------------------
  // Boot (Backend-Managed Session & Real-Time Order Polling)
  // ------------------------------------------------------------------
  async function boot() {
    if (isDidiRoute()) S.view = 'didi';
    render();
    subscribeDidiOrders();
    getGoogleAuth().catch(() => {});

    const savedUser = Store.loadSession();
    if (savedUser && savedUser.uid) {
      await handleSignedIn(savedUser);
    } else {
      S.view = isDidiRoute() ? 'didi' : 'landing';
      render();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

