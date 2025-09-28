import { environment } from '../environments/environments';

export type FirebaseKit = {
  app: import('firebase/app').FirebaseApp;
  auth: import('firebase/auth').Auth;
  database: import('firebase/database').Database; // ✅ CAMBIO: era "db", ahora "database"
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
    database: getDatabase(app), // ✅ CAMBIO
  };
  return cached;
}

// ----------------- HELPERS PARA RTDB -----------------

/** Devuelve una referencia a un path de la Realtime Database */
export async function getDbReference(path: string) {
  const { ref } = await import('firebase/database');
  const { database } = await getFirebase(); // ✅ CAMBIO
  return ref(database, path);
}

/** Lee una vez el valor de un nodo (una snapshot puntual) */
export async function getNodeValue<T = any>(path: string): Promise<T | null> {
  const { get } = await import('firebase/database');
  const reference = await getDbReference(path);
  const snapshot = await get(reference);
  return snapshot.exists() ? (snapshot.val() as T) : null;
}

/** Escucha en tiempo real los cambios de un nodo. Devuelve una función para cancelar la suscripción */
export async function listenToNode<T = any>(
  path: string,
  callback: (value: T | null) => void
): Promise<() => void> {
  const { onValue } = await import('firebase/database');
  const reference = await getDbReference(path);
  const unsubscribe = onValue(reference, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as T) : null);
  });
  return () => unsubscribe();
}

/** Convierte un objeto {id: {...}} en un array [{id, ...}] para trabajar más fácil en Angular */
export async function getListFromNode<T = any>(
  path: string
): Promise<Array<T & { id: string }>> {
  const data = await getNodeValue<Record<string, T>>(path);
  return Object.entries(data ?? {}).map(([id, value]) => ({
    id,
    ...(value as T),
  }));
}
