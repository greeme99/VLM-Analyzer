/**
 * Firebase Authentication Integration
 * Provides authentication helpers for Firebase Auth
 */

import * as admin from "firebase-admin";
import { getAuth, Auth } from "firebase-admin/auth";

let auth: Auth | null = null;

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth | null {
  if (!auth) {
    try {
      auth = getAuth();
      console.log("[Firebase Auth] Initialized");
    } catch (error) {
      console.error("[Firebase Auth] Initialization failed:", error);
      return null;
    }
  }
  return auth;
}

/**
 * Create a custom token for a user
 */
export async function createCustomToken(uid: string, claims?: Record<string, any>): Promise<string | null> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  try {
    const token = await firebaseAuth.createCustomToken(uid, claims);
    console.log(`[Firebase Auth] Created custom token for user: ${uid}`);
    return token;
  } catch (error) {
    console.error("[Firebase Auth] Error creating custom token:", error);
    throw error;
  }
}

/**
 * Verify an ID token
 */
export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken | null> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    console.log(`[Firebase Auth] Verified token for user: ${decodedToken.uid}`);
    return decodedToken;
  } catch (error) {
    console.error("[Firebase Auth] Error verifying token:", error);
    return null;
  }
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string): Promise<admin.auth.UserRecord | null> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  try {
    const user = await firebaseAuth.getUser(uid);
    return user;
  } catch (error) {
    console.error("[Firebase Auth] Error getting user:", error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  try {
    const user = await firebaseAuth.getUserByEmail(email);
    return user;
  } catch (error) {
    console.error("[Firebase Auth] Error getting user by email:", error);
    return null;
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: {
  email: string;
  password?: string;
  displayName?: string;
  photoURL?: string;
}): Promise<admin.auth.UserRecord | null> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  try {
    const user = await firebaseAuth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
    });

    console.log(`[Firebase Auth] Created new user: ${user.uid}`);
    return user;
  } catch (error) {
    console.error("[Firebase Auth] Error creating user:", error);
    throw error;
  }
}

/**
 * Update user
 */
export async function updateUser(
  uid: string,
  updates: {
    email?: string;
    password?: string;
    displayName?: string;
    photoURL?: string;
  }
): Promise<admin.auth.UserRecord | null> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  try {
    const user = await firebaseAuth.updateUser(uid, updates);
    console.log(`[Firebase Auth] Updated user: ${uid}`);
    return user;
  } catch (error) {
    console.error("[Firebase Auth] Error updating user:", error);
    throw error;
  }
}

/**
 * Delete user
 */
export async function deleteUser(uid: string): Promise<boolean> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return false;

  try {
    await firebaseAuth.deleteUser(uid);
    console.log(`[Firebase Auth] Deleted user: ${uid}`);
    return true;
  } catch (error) {
    console.error("[Firebase Auth] Error deleting user:", error);
    throw error;
  }
}

/**
 * Set custom claims for a user
 */
export async function setCustomClaims(uid: string, customClaims: Record<string, any>): Promise<boolean> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return false;

  try {
    await firebaseAuth.setCustomUserClaims(uid, customClaims);
    console.log(`[Firebase Auth] Set custom claims for user: ${uid}`);
    return true;
  } catch (error) {
    console.error("[Firebase Auth] Error setting custom claims:", error);
    throw error;
  }
}

/**
 * Create a session cookie
 */
export async function createSessionCookie(
  idToken: string,
  expiresIn: number = 1000 * 60 * 60 * 24 // 24 hours
): Promise<string | null> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  try {
    const sessionCookie = await firebaseAuth.createSessionCookie(idToken, { expiresIn });
    console.log("[Firebase Auth] Created session cookie");
    return sessionCookie;
  } catch (error) {
    console.error("[Firebase Auth] Error creating session cookie:", error);
    throw error;
  }
}

/**
 * Verify a session cookie
 */
export async function verifySessionCookie(
  sessionCookie: string,
  checkRevoked: boolean = true
): Promise<admin.auth.DecodedIdToken | null> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  try {
    const decodedClaims = await firebaseAuth.verifySessionCookie(sessionCookie, checkRevoked);
    console.log(`[Firebase Auth] Verified session cookie for user: ${decodedClaims.uid}`);
    return decodedClaims;
  } catch (error) {
    console.error("[Firebase Auth] Error verifying session cookie:", error);
    return null;
  }
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeRefreshTokens(uid: string): Promise<boolean> {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return false;

  try {
    await firebaseAuth.revokeRefreshTokens(uid);
    console.log(`[Firebase Auth] Revoked refresh tokens for user: ${uid}`);
    return true;
  } catch (error) {
    console.error("[Firebase Auth] Error revoking refresh tokens:", error);
    throw error;
  }
}
