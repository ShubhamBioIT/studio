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
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { USER_ROLES } from '@/lib/constants';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
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

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          // This case handles a new Google sign-in where user doc is not yet created
          const newUserProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            role: USER_ROLES.VIEWER, // Default role
            createdAt: serverTimestamp(),
          };
          await setDoc(userDocRef, newUserProfile, { merge: true });
          setUser(newUserProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase is not configured. Please check your .env.local file.");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!auth || !db) throw new Error("Firebase is not configured. Please check your .env.local file.");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser = userCredential.user;
        const newUserProfile: UserProfile = {
            uid: newUser.uid,
            email: newUser.email,
            displayName: name,
            role: USER_ROLES.VIEWER, // Default role
            createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, "users", newUser.uid), newUserProfile);
        setUser(newUserProfile);
    } catch (error) {
        console.error("Error signing up with email:", error);
        throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase is not configured. Please check your .env.local file.");
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will handle the rest
    } catch (error) {
        console.error("Error signing in with email:", error);
        throw error;
    }
  };

  const signOut = async () => {
    if (!auth) {
        console.warn("Firebase not configured, cannot sign out.");
        return;
    }
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut }}>
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
