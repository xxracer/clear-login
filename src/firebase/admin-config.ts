
import { initializeApp, getApps, App, AppOptions } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import serviceAccount from '@/../.secure/serviceAccountKey.json';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-for-studio';

// This function is now designed to be robust for both local dev and Vercel.
async function getFirebaseAdminApp(): Promise<App> {
  const apps = getApps();
  const adminApp = apps.find(app => app.name === FIREBASE_ADMIN_APP_NAME);

  if (adminApp) {
    return adminApp;
  }

  try {
    const appOptions: AppOptions = {
      credential: credential.cert(serviceAccount as any),
    };
    
    const newAdminApp = initializeApp(appOptions, FIREBASE_ADMIN_APP_NAME);
    return newAdminApp;

  } catch (error: any) {
    console.error("Failed to initialize admin app from serviceAccountKey.json:", error);
    throw new Error(
        "Could not initialize Firebase Admin SDK. " +
        "Ensure .secure/serviceAccountKey.json is a valid service account key. " +
        `Error: ${error.message}`
    );
  }
}

export const initFirebaseAdmin = getFirebaseAdminApp;
