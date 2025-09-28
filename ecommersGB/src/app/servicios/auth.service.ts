import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { get, ref } from 'firebase/database';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { getFirebase } from '../firebase.init';

export interface AppUser {
  uid: string;
  email: string | null;
  role: 'admin' | 'user' | 'moderator' | string;
  displayName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usuarioSubject = new BehaviorSubject<AppUser | null>(null);
  usuario$ = this.usuarioSubject.asObservable();

  constructor() {
    // Rehidratar sesión desde Firebase Auth (después de recarga)
    getFirebase().then(({ auth, database }) => {
      onAuthStateChanged(auth, async (u) => {
        if (!u) {
          this.usuarioSubject.next(null);
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('usuarioActual');
          }
          return;
        }

        // 🔍 Leer el rol desde RTDB (/users/{uid})
        let role: string = 'user';
        try {
          const snap = await get(ref(database, `users/${u.uid}`));
          if (snap.exists()) {
            const data = snap.val();
            role = data?.role ?? 'user';
          }
        } catch {
          role = 'user';
        }

        const usuario: AppUser = {
          uid: u.uid,
          email: u.email,
          role,
          displayName: u.displayName ?? u.email ?? ''
        };

        this.usuarioSubject.next(usuario);

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        }
      });
    });
  }

  /** Login con email y password + carga de rol */
  async login(email: string, password: string): Promise<AppUser> {
    const { auth, database } = await getFirebase();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const u = cred.user;

    let role: string = 'user';
    try {
      const snap = await get(ref(database, `users/${u.uid}`));
      if (snap.exists()) {
        const data = snap.val();
        role = data?.role ?? 'user';
      }
    } catch {
      role = 'user';
    }

    const usuario: AppUser = {
      uid: u.uid,
      email: u.email,
      role,
      displayName: u.displayName ?? u.email ?? ''
    };

    this.usuarioSubject.next(usuario);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('usuarioActual', JSON.stringify(usuario));
    }

    return usuario;
  }

  /** Logout general */
  logout(): void {
    this.usuarioSubject.next(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('usuarioActual');
    }

    // Descomentá si querés cerrar sesión Firebase también:
    // getFirebase().then(({ auth }) => signOut(auth));
  }

  /** Devuelve el usuario actual (sincrónico) */
  getUsuarioActual(): AppUser | null {
    return this.usuarioSubject.value;
  }

  /** Devuelve el usuario de Firebase (asincrónico) */
  async getCurrentAuthUser(): Promise<User | null> {
    const { auth } = await getFirebase();
    if (auth.currentUser) return auth.currentUser;
    return new Promise<User | null>((resolve) => {
      const off = onAuthStateChanged(auth, (u) => {
        off(); // desuscribir
        resolve(u);
      });
    });
  }
}
