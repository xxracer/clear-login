
import { initializeApp, getApps, App, AppOptions } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-for-studio';

// This function is now designed to be robust for both local dev and Vercel.
async function getFirebaseAdminApp(): Promise<App> {
  const apps = getApps();
  const adminApp = apps.find(app => app.name === FIREBASE_ADMIN_APP_NAME);

  if (adminApp) {
    return adminApp;
  }

  try {
    // Construct the path to the service account key file
    const serviceAccountPath = path.resolve(process.cwd(), '.secure', 'serviceAccountKey.json');
    
    // Check if the file exists before trying to read it
    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error("serviceAccountKey.json not found in the .secure directory at the root of the project.");
    }
      
    // Read and parse the service account key from the filesystem
    const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountString);

    const appOptions: AppOptions = {
      credential: credential.cert(serviceAccount as any),
    };
    
    const newAdminApp = initializeApp(appOptions, FIREBASE_ADMIN_APP_NAME);
    return newAdminApp;

  } catch (error: any) {
    console.error("Failed to initialize admin app:", error);
    throw new Error(
        "Could not initialize Firebase Admin SDK. " +
        `Error: ${error.message}`
    );
  }
}

export const initFirebaseAdmin = getFirebaseAdminApp;
