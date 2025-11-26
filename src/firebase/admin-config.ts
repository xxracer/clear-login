
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-for-studio';

async function getFirebaseAdminApp(): Promise<App> {
  const apps = getApps();
  const adminApp = apps.find(app => app.name === FIREBASE_ADMIN_APP_NAME);

  if (adminApp) {
    return adminApp;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    // Explicitly use the service account if available
    return initializeApp({
      credential: credential.cert(serviceAccount),
    }, FIREBASE_ADMIN_APP_NAME);
  } else {
    // Fallback for environments where ADC is expected to work
    // In a deployed environment, service account credentials will be automatically discovered.
    return initializeApp({
      credential: credential.applicationDefault(),
    }, FIREBASE_ADMIN_APP_NAME);
  }
}

export const initFirebaseAdmin = getFirebaseAdminApp;
