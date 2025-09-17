import { environment } from '../environments/environments';

export type FirebaseKit = {
  app: import('firebase/app').FirebaseApp;
  auth: import('firebase/auth').Auth;
  db: import('firebase/database').Database;
};

let cached: FirebaseKit | null = null;

export async function getFirebase(): Promise<FirebaseKit> {
  if (cached) return cached;

  // Importes dinámicos (no se ejecutan en SSR)
  const { getApps, getApp, initializeApp } = await import('firebase/app');
  const { getAuth } = await import('firebase/auth');
  const { getDatabase } = await import('firebase/database');

  const app = getApps().length ? getApp() : initializeApp(environment.firebase);
  cached = {
    app,
    auth: getAuth(app),
    db: getDatabase(app),
  };
  return cached;
}
