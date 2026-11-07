# Firebase & Groq Setup Guide for ZAP FIT

This guide walks you through setting up **Firebase Authentication**, **Cloud Firestore Database**, and getting a free **Groq API key** for AI-powered meal recommendations.

---

## Part 1: Setting Up Firebase (Auth & Database)

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.
2. Click **Add project** (or **Create a project**).
3. Enter a project name, e.g., `zap-fit-app`.
4. (Optional) Disable Google Analytics for faster setup, then click **Create Project**.
5. Wait a few seconds until the project is ready, then click **Continue**.

---

### Step 2: Register Your Web App & Get Config Keys
1. In the project overview dashboard, click the **Web icon (`</>`)** under *"Get started by adding Firebase to your app"*.
2. App nickname: `zap-fit-web`.
3. Check or leave unchecked "Firebase Hosting", then click **Register app**.
4. You will see a `firebaseConfig` object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "your_firebase_api_key_here",
     authDomain: "zap-fit-app.firebaseapp.com",
     projectId: "zap-fit-app",
     storageBucket: "zap-fit-app.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:xxxxxxxxxxxx"
   };
   ```
5. Copy these values into your `.env` file (kept out of git via `.gitignore`) or your Vercel Project Environment Variables:
   ```env
   FIREBASE_API_KEY=your_firebase_api_key_here
   FIREBASE_AUTH_DOMAIN=zap-fit-app.firebaseapp.com
   FIREBASE_PROJECT_ID=zap-fit-app
   FIREBASE_DATABASE_URL=https://zap-fit-app-default-rtdb.asia-southeast1.firebasedatabase.app
   FIREBASE_STORAGE_BUCKET=zap-fit-app.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789012
   FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxx
   ```

---

### Step 3: Enable Authentication (Google & Email/Password)
1. In the left navigation menu, click **Build** > **Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab:
   - **Email/Password**: Click it, toggle **Enable**, and click **Save**.
   - **Google**: Click **Add new provider** > **Google**, toggle **Enable**, select your project support email, and click **Save**.
4. (Important for Web/Localhost): Under the **Settings** tab in Authentication, click **Authorized domains** and verify `localhost` is listed.

---

### Step 4: Create Cloud Firestore Database
1. In the left navigation menu, click **Build** > **Firestore Database**.
2. Click **Create database**.
3. **Database location**: Choose a region close to you (e.g., `asia-south1` (Mumbai) or default).
4. **Security rules**:
   - For quick development & exhibition testing, select **Start in test mode** (allows read/write for 30 days).
   - Click **Create**.
5. Your Firestore database is now ready!
   - The app will automatically create and sync collections:
     - `users/{uid}`: Stores user preferences (diet, allergies, goal, daily macros, pantry).
     - `users/{uid}/workouts`: Logs training sessions.
     - `users/{uid}/meals`: Logs meals eaten.

---

## Part 2: Getting a Free Groq AI Key

1. Go to the [Groq Console](https://console.groq.com/).
2. Sign in with Google or GitHub (it's 100% free with instant access).
3. In the left sidebar, click **API Keys**.
4. Click **Create API Key**, name it `zap-fit-ai`, and copy the key starting with `gsk_...`.
5. Paste it in your `.env` file (or Vercel Environment Variables):
   ```env
   GROQ_API_KEY=gsk_your_groq_api_key_here
   ```

---

## Part 3: Running the App

Once you have filled in your `.env` file:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. 
Sign in with Google or Email, and your preferences will immediately feed into the Groq AI meal recommendation engine!
