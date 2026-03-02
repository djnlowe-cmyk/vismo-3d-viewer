# Firebase Setup for Vismo 3D Viewer

## Quick Start

This app uses **Firebase Firestore** for project data and **Firebase Storage** for IFC files.

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it `vismo-3d-viewer` (or any name you like)
4. Accept the defaults and create

### Step 2: Get Configuration

1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Scroll to "Your apps" section
3. Click on the Web app icon (`</>`)
4. Copy the config object
5. You'll need these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 3: Set Up Environment Variables

#### For Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase config values:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

#### For Vercel Deployment

1. Go to your Vercel project settings
2. Go to **Environment Variables**
3. Add these variables (with `VITE_` prefix):
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```
4. Push to GitHub - Vercel will automatically redeploy

### Step 4: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Start in **test mode** (for development)
4. Choose region (us-central1 is fine)
5. Click **Create**

### Step 5: Enable Cloud Storage

1. In Firebase Console, go to **Storage**
2. Click **Create Bucket**
3. Accept defaults
4. Click **Create**

### Step 6: Set Security Rules (Important!)

#### Firestore Rules

In **Firestore Database → Rules**, replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
      allow read: if true;  // Allow anonymous read (demo mode)
    }
  }
}
```

#### Storage Rules

In **Storage → Rules**, replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 7: Test It Out

1. Visit your app (locally or on Vercel)
2. Click "New Project"
3. Fill in name and upload an IFC file
4. You should see it in Firestore and Storage in Firebase Console

## Troubleshooting

### "Firebase not configured" message

- Check that environment variables are set correctly
- Verify they don't have typos
- For Vercel, you may need to redeploy after adding env vars

### Upload fails silently

- Check Firebase Storage rules (step above)
- Check browser console for detailed error messages
- Make sure storage bucket is created

### Can't create projects

- Check Firestore rules (step above)
- Ensure "Test mode" or proper auth rules are set
- Check browser console

## Free Tier Limits

Firebase free tier includes:
- **Firestore**: 1GB storage, 50k reads/day, 20k writes/day
- **Storage**: 5GB total storage, 1GB/day downloads
- **Auth**: Up to 50 users

Perfect for development and demo projects!

## Moving to Production

When going live:
1. Switch Firestore from test mode to production rules with proper auth
2. Enable email/password auth or third-party (Google, GitHub)
3. Set up proper security rules
4. Monitor usage in Firebase Console

## Need Help?

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Query Guide](https://firebase.google.com/docs/firestore/query-data/queries)
- [Storage Upload Guide](https://firebase.google.com/docs/storage/web/upload-files)
