import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-for-studio';

async function getFirebaseAdminApp(): Promise<App> {
  const apps = getApps();
  const adminApp = apps.find(app => app.name === FIREBASE_ADMIN_APP_NAME);

  if (adminApp) {
    return adminApp;
  }

  // This fallback is for local development and should not be used in production
  // In a deployed environment, service account credentials will be automatically discovered.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  return initializeApp({
    credential: credential.applicationDefault(),
  }, FIREBASE_ADMIN_APP_NAME);
}

export const initFirebaseAdmin = getFirebaseAdminApp;
