
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export function initializeFirebase() {
  let app: FirebaseApp;
  
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = getApp();
  } else {
    // Attempt initialization with the standard config
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      // Fallback for environments where initializeApp() handles config automatically
      app = initializeApp();
    }
  }

  // Ensure we are connecting to production services only, as per instructions
  return getSdks(app);
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
