'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { USER_ROLES } from '@/lib/constants';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFirebaseConfigured] = useState(!!auth && !!db);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, async (fbUser) => {
      setError(null);
      try {
        setFirebaseUser(fbUser);
        if (fbUser) {
          const userDocRef = doc(db!, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            const newUserProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              role: USER_ROLES.VIEWER,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newUserProfile, { merge: true });
            setUser(newUserProfile);
          }
        } else {
          setUser(null);
        }
      } catch (e: any) {
        console.error("Error in onAuthStateChanged:", e);
        setError(e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isFirebaseConfigured]);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Please check your .env.local file.");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth!, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Please check your .env.local file.");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth!, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
    } catch (error) {
        console.error("Error signing up with email:", error);
        throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Please check your .env.local file.");
    try {
        await signInWithEmailAndPassword(auth!, email, pass);
    } catch (error) {
        console.error("Error signing in with email:", error);
        throw error;
    }
  };

  const signOut = async () => {
    if (!isFirebaseConfigured) {
        console.warn("Firebase not configured, cannot sign out.");
        return;
    }
    await firebaseSignOut(auth!);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, isFirebaseConfigured, error, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
