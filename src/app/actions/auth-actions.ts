'use server';

import { initializeFirebase } from '@/firebase';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from '@/firebase/admin-config';

/**
 * Creates a new user in Firebase Authentication and a corresponding user profile in Firestore.
 * This is intended to be called by a super-admin.
 *
 * @param email The new user's email.
 * @param password The new user's initial password.
 * @param companyId The ID of the company this user will administrate.
 * @returns An object indicating success or failure.
 */
export async function createAdminUser(email: string, password: string, companyId: string) {
  try {
    const adminApp = await initFirebaseAdmin();
    const adminAuth = getAuth(adminApp);
    const adminFirestore = getFirestore(adminApp);

    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
    });

    // Create the user profile document in Firestore
    const userRef = adminFirestore.collection('users').doc(userRecord.uid);
    await userRef.set({
      uid: userRecord.uid,
      email: email,
      companyId: companyId,
      role: 'admin', // Assign the 'admin' role
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    // Provide a more specific error message if available
    const message = error.code === 'auth/email-already-exists'
      ? 'A user with this email already exists.'
      : error.message || 'An unexpected error occurred.';
    return { success: false, error: message };
  }
}
