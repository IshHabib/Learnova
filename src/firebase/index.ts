
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services.
 * Checks for existing apps to prevent multiple initialization.
 * Also validates that the config is present to avoid runtime crashes.
 */
export function initializeFirebase() {
  let app: FirebaseApp;
  
  // Basic validation to prevent crashing if environment variables aren't loaded yet
  const isValidConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined';

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Only initialize services if we have a valid config, otherwise return nulls
  // This allows the Provider to mount without crashing the entire app tree.
  const auth = isValidConfig ? getAuth(app) : (null as unknown as Auth);
  const firestore = isValidConfig ? getFirestore(app) : (null as unknown as Firestore);

  return { app, auth, firestore };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
