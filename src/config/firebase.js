/**
 * Firebase Configuration
 * Initialize Firebase with environment variables
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase config from environment variables
// These will be set in Vercel dashboard
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
function validateFirebaseConfig() {
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
  const missing = required.filter(key => !firebaseConfig[key]);

  if (missing.length > 0) {
    console.warn('⚠️  Firebase not fully configured. Missing:', missing);
    console.warn('📋 Set these environment variables in Vercel:');
    missing.forEach(key => console.warn(`   VITE_FIREBASE_${key.toUpperCase().replace(/([A-Z])/g, '_$1').slice(1)}`));
    return false;
  }

  return true;
}

// Initialize Firebase
let app = null;
let db = null;
let storage = null;
let auth = null;

function initializeFirebase() {
  if (!app && validateFirebaseConfig()) {
    console.log('🔥 Initializing Firebase...');
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      storage = getStorage(app);
      auth = getAuth(app);
      console.log('✅ Firebase initialized');
      return true;
    } catch (err) {
      console.error('❌ Firebase initialization error:', err);
      return false;
    }
  }
  return Boolean(app);
}

// Get Firebase services
export function getFirebaseApp() {
  if (!app) initializeFirebase();
  return app;
}

export function getFirestoreDB() {
  if (!db) initializeFirebase();
  return db;
}

export function getStorageService() {
  if (!storage) initializeFirebase();
  return storage;
}

export function getAuthService() {
  if (!auth) initializeFirebase();
  return auth;
}

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.projectId);
}

export default {
  firebaseConfig,
  initializeFirebase,
  getFirebaseApp,
  getFirestoreDB,
  getStorageService,
  getAuthService,
  isFirebaseConfigured,
};
