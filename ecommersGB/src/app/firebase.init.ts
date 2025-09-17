import { initializeApp, getApps } from 'firebase/app';
import { environment } from '../environments/environments';

export function initFirebase() {
  if (!getApps().length) initializeApp(environment.firebase);
}
