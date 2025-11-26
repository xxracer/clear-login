
import { initializeApp, getApps, App, AppOptions } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-for-studio';

// This function is now designed to be robust for both local dev and Vercel.
async function getFirebaseAdminApp(): Promise<App> {
  const apps = getApps();
  const adminApp = apps.find(app => app.name === FIREBASE_ADMIN_APP_NAME);

  if (adminApp) {
    return adminApp;
  }

  // Vercel (and our local dev environment) provides this environment variable.
  // This is the most reliable and secure way to authenticate.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT environment variable is not set. " +
      "The Admin SDK requires this credential to function."
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const appOptions: AppOptions = {
      credential: credential.cert(serviceAccount),
    };
    
    return initializeApp(appOptions, FIREBASE_ADMIN_APP_NAME);

  } catch (error: any) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT or initialize admin app:", error);
    throw new Error(
        "Could not initialize Firebase Admin SDK. " +
        "Ensure FIREBASE_SERVICE_ACCOUNT is a valid JSON service account key. " +
        `Parse Error: ${error.message}`
    );
  }
}

export const initFirebaseAdmin = getFirebaseAdminApp;
