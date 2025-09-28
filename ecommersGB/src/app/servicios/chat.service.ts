import { Injectable } from '@angular/core';
import {
  ref, push, query, orderByChild, onValue, limitToLast,
  get, set
} from 'firebase/database';
import { Observable } from 'rxjs';
import { getFirebase } from '../firebase.init';

export interface ChatMessage {
  id?: string;
  uid: string;
  username: string;
  text: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor() {}

  /**
   * Crea el perfil si NO existe (no pisa un alias ya guardado).
   * Usa el `preferred` EXACTO que vos pases (respetando mayúsculas/minúsculas).
   */
  async ensureUserProfile(preferred?: string): Promise<string> {
    const { auth, database } = await getFirebase();
    const u = auth.currentUser;
    if (!u) throw new Error('No hay usuario autenticado');

    const uid = u.uid;
    const email = u.email || '';
    const suggested =
      (preferred?.trim().slice(0, 40)) ||
      (u.displayName?.slice(0, 40)) ||
      (email ? email.split('@')[0].slice(0, 40) : `Usuario${uid.slice(0, 6)}`);

    const userRef = ref(database, `users/${uid}`);
    const snap = await get(userRef);

    if (!snap.exists() || !snap.val()?.username) {
      await set(userRef, {
        username: suggested,
        email,
        createdAt: Date.now()
      });
      return suggested;
    }
    return snap.val().username;
  }

  /**
   * SOLO LEE el alias actual. Si no existe, devuelve null.
   * (No crea nada acá para evitar condiciones de carrera).
   */
  async getCurrentAlias(): Promise<string | null> {
    const { auth, database } = await getFirebase();
    const uid = auth.currentUser?.uid;
    if (!uid) return null;
    const snap = await get(ref(database, `users/${uid}/username`));
    return snap.exists() ? snap.val() : null;
  }

  /** Actualiza el alias exactamente como lo escribas (una vez logueado). */
  async updateAlias(newAlias: string): Promise<string> {
    const { auth, database } = await getFirebase();
    const u = auth.currentUser;
    if (!u) throw new Error('No hay usuario autenticado');

    const clean = (newAlias || '').trim().slice(0, 40);
    if (!clean) throw new Error('Alias inválido');

    await set(ref(database, `users/${u.uid}/username`), clean);
    return clean;
  }

  /** Envía mensaje usando SIEMPRE el alias guardado en /users/$uid/username. */
  async sendMessage(roomId: string, text: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const { auth, database } = await getFirebase();
    const user = auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    // Si por algún motivo no hay alias aún, crea uno básico (sin forzar minúsculas).
    let alias = await this.getCurrentAlias();
    if (!alias) alias = await this.ensureUserProfile();

    await push(ref(database, `rooms/${roomId}/messages`), {
      uid: user.uid,
      username: alias,
      text: (text || '').trim(),
      timestamp: Date.now(),
    });
  }

  /** Escucha mensajes en tiempo real. */
  getMessages(roomId: string, lastN: number = 200): Observable<ChatMessage[]> {
    return new Observable<ChatMessage[]>((observer) => {
      if (typeof window === 'undefined') { observer.next([]); observer.complete(); return; }
      getFirebase().then(({ database }) => {
        const q = query(ref(database, `rooms/${roomId}/messages`), orderByChild('timestamp'), limitToLast(lastN));
        const off = onValue(q, (snap) => {
          const raw = snap.val() || {};
          const list: ChatMessage[] = Object.keys(raw).map((k) => ({ id: k, ...raw[k] }));
          observer.next(list);
        }, (err) => observer.error(err));
        return () => off();
      });
    });
  }
}
