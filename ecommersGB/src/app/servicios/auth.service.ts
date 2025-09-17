// src/app/servicios/auth.service.ts
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { User } from 'firebase/auth';
import { getFirebase } from '../firebase.init';

type ChatMsg = {
  id?: string;
  uid: string;
  username: string;
  text: string;
  timestamp: number;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isBrowser = false;
  private initPromise: Promise<void> | null = null;

  private _auth: import('firebase/auth').Auth | null = null;
  private _db: import('firebase/database').Database | null = null;

  /** cache de usuario actual */
  currentUser: User | null = null;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    // ✅ mover la detección de plataforma al constructor (evita “used before initialization”)
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /** Inicializa Firebase solo en navegador (idempotente) */
  async ready(): Promise<void> {
    if (!this.isBrowser) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const { auth, db } = await getFirebase();
      this._auth = auth;
      this._db = db;

      // Mantener currentUser sincronizado siempre
      const mod = await import('firebase/auth');
      mod.onAuthStateChanged(this._auth, (u) => (this.currentUser = u));
    })();

    return this.initPromise;
  }

  // Getters seguros
  private get auth() {
    if (!this._auth) throw new Error('Auth no inicializado. Llama a ready() en el navegador.');
    return this._auth;
  }
  private get db() {
    if (!this._db) throw new Error('DB no inicializada. Llama a ready() en el navegador.');
    return this._db;
  }

  // ===== AUTH =====
  async signInWithEmailPassword(email: string, password: string) {
    await this.ready();
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async signOut() {
    await this.ready();
    const { signOut } = await import('firebase/auth');
    return signOut(this.auth);
  }

  /**
   * Suscribirse a cambios de sesión.
   * Devuelve unsubscribe: () => void (no Promise)
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!this.isBrowser) return () => {};

    // Puede que todavía no esté listo: devolvemos un wrapper que se convierte en real
    let unsub: () => void = () => {};

    if (!this._auth) {
      this.ready().then(async () => {
        const mod = await import('firebase/auth');
        unsub = mod.onAuthStateChanged(this.auth, callback);
      });
      return () => unsub();
    }

    // Ya está listo: suscribimos ahora, pero sin await (no romper la firma)
    import('firebase/auth').then((mod) => {
      unsub = mod.onAuthStateChanged(this.auth, callback);
    });
    return () => unsub();
  }

  // ===== CHAT (RTDB) =====
  async sendMessage(text: string) {
    await this.ready();
    const user = this.currentUser;
    if (!user) throw new Error('Debes iniciar sesión.');

    const { ref, push, serverTimestamp } = await import('firebase/database');

    const msg = {
      uid: user.uid,
      username: user.displayName || user.email || 'Usuario',
      text,
      timestamp: serverTimestamp(), // resuelto por RTDB
    };

    const messagesRef = ref(this.db, 'rooms/global/messages');
    await push(messagesRef, msg);
  }

  /**
   * Escuchar mensajes ordenados por timestamp (últimos N)
   * Devuelve unsubscribe: () => void
   */
  async watchMessages(
    limit = 50,
    onData: (msgs: ChatMsg[]) => void
  ): Promise<() => void> {
    await this.ready();

    const { ref, query, limitToLast, onValue, orderByChild } = await import('firebase/database');

    const q = query(
      ref(this.db, 'rooms/global/messages'),
      orderByChild('timestamp'),
      limitToLast(limit)
    );

    const unsubscribe = onValue(q, (snap) => {
      const out: ChatMsg[] = [];
      snap.forEach((child) => {
        const v = child.val();
        out.push({
          id: child.key || undefined,
          uid: v?.uid,
          username: v?.username ?? 'Anon',
          text: v?.text ?? '',
          timestamp: Number(v?.timestamp ?? 0),
        });
      });
      out.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      onData(out);
    });

    return unsubscribe;
  }
}
