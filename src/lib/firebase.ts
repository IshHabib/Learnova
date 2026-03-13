/**
 * @deprecated Use hooks from '@/firebase' instead (e.g., useAuth, useFirestore).
 * This file is maintained for backward compatibility during migration.
 */
import { initializeFirebase } from '@/firebase';

const { auth, firestore: db } = initializeFirebase();

export { auth, db };
