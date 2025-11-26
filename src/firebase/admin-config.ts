
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-for-studio';

async function getFirebaseAdminApp(): Promise<App> {
  const apps = getApps();
  const adminApp = apps.find(app => app.name === FIREBASE_ADMIN_APP_NAME);

  if (adminApp) {
    return adminApp;
  }

  // Vercel (and other environments) will provide this environment variable.
  // This is the most reliable and secure way to authenticate.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    // Explicitly use the service account if available
    return initializeApp({
      credential: credential.cert(serviceAccount),
    }, FIREBASE_ADMIN_APP_NAME);
  } else {
    // Fallback for environments where Application Default Credentials (ADC) is expected to work.
    // This might work in Google Cloud environments but can be unreliable locally.
    // The service account method is preferred.
    console.warn(
        "FIREBASE_SERVICE_ACCOUNT environment variable not found. " +
        "Falling back to Application Default Credentials. " +
        "This may fail in some environments."
    );
    return initializeApp({
      credential: credential.applicationDefault(),
    }, FIREBASE_ADMIN_APP_NAME);
  }
}

export const initFirebaseAdmin = getFirebaseAdminApp;
