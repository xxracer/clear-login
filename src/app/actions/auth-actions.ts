'use server';

import { getAuth, UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from '@/firebase/admin-config';

/**
 * Creates a new user in Firebase Authentication and a corresponding user profile in Firestore.
 * This is intended to be called by a super-admin.
 *
 * @param email The new user's email.
 * @param password The new user's initial password.
 * @param companyId The ID of the company this user will administrate.
 * @param subscriptionStartDate The start date of the company's subscription.
 * @param subscriptionEndDate The end date of the company's subscription.
 * @returns An object indicating success or failure.
 */
export async function createAdminUser(
  email: string, 
  password: string, 
  companyId: string,
  subscriptionStartDate?: Date,
  subscriptionEndDate?: Date
) {
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
      subscriptionStartDate: subscriptionStartDate?.toISOString() || null,
      subscriptionEndDate: subscriptionEndDate?.toISOString() || null,
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


/**
 * Deletes a user from Firebase Authentication and their profile from Firestore.
 * @param uid The UID of the user to delete.
 * @returns An object indicating success or failure.
 */
export async function deleteUser(uid: string) {
    try {
        const adminApp = await initFirebaseAdmin();
        const adminAuth = getAuth(adminApp);
        const adminFirestore = getFirestore(adminApp);

        // Delete user from Firebase Auth
        await adminAuth.deleteUser(uid);

        // Delete user profile from Firestore
        await adminFirestore.collection('users').doc(uid).delete();

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

/**
 * Sets a custom claim on a Firebase user to mark them as a superuser.
 * @param uid The UID of the user to grant superuser privileges.
 * @returns An object indicating success or failure.
 */
export async function setSuperUserClaim(uid: string) {
    try {
        const adminApp = await initFirebaseAdmin();
        const adminAuth = getAuth(adminApp);
        
        await adminAuth.setCustomUserClaims(uid, { superuser: true });

        return { success: true };
    } catch (error: any) {
        console.error('Error setting superuser claim:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

/**
 * Lists all users from Firebase Authentication.
 * Intended for superuser dashboard.
 * @returns An object with the list of users or an error.
 */
export async function listAuthUsers(): Promise<{ success: boolean; users?: UserRecord[]; error?: string; }> {
    try {
        const adminApp = await initFirebaseAdmin();
        const adminAuth = getAuth(adminApp);
        
        const userRecords = await adminAuth.listUsers();
        // The users object within ListUsersResult is the array we want.
        return { success: true, users: userRecords.users };

    } catch (error: any) {
        console.error('Error listing auth users:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
