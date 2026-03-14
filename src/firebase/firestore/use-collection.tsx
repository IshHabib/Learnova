'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 *
 * IMPORTANT:
 * The query/reference MUST be memoized using useMemo.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery:
    | ((CollectionReference<DocumentData> | Query<DocumentData>) & {
        __memo?: boolean;
      })
    | null
    | undefined
): UseCollectionResult<T> {

  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {

    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,

      (snapshot: QuerySnapshot<DocumentData>) => {

        const results = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));

        setData(results);
        setIsLoading(false);
        setError(null);
      },

      (firebaseError: FirestoreError) => {

        let path = 'unknown';

        if ('path' in memoizedTargetRefOrQuery) {
          path = memoizedTargetRefOrQuery.path;
        }

        setError(firebaseError);
        setData(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', firebaseError);
      }
    );

    return () => unsubscribe();

  }, [memoizedTargetRefOrQuery]);

  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(
      'Firestore query was not properly memoized. Use useMemoFirebase before passing it to useCollection.'
    );
  }

  return { data, isLoading, error };
}