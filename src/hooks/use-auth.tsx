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
  const [isFirebaseConfigured] = useState(!!auth && !!db);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, async (fbUser) => {
      try {
        setFirebaseUser(fbUser);
        if (fbUser) {
          const userDocRef = doc(db!, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            // This case handles new users (from any provider) where a Firestore doc doesn't exist yet.
            // For email signup, we ensure `updateProfile` is called first.
            // For Google sign-in, `displayName` is usually available from the provider.
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
      } catch (error) {
        console.error("Error in onAuthStateChanged:", error);
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
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Please check your .env.local file.");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth!, email, pass);
        // After creating user, update their profile with the name.
        // This makes the name available to the onAuthStateChanged listener.
        await updateProfile(userCredential.user, { displayName: name });
        // onAuthStateChanged will now fire and handle creating the user document in Firestore.
    } catch (error) {
        console.error("Error signing up with email:", error);
        throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Please check your .env.local file.");
    try {
        await signInWithEmailAndPassword(auth!, email, pass);
        // onAuthStateChanged will handle the rest
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
    <AuthContext.Provider value={{ user, firebaseUser, loading, isFirebaseConfigured, signInWithGoogle, signUpWithEmail, signInWithEmail, signOut }}>
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
