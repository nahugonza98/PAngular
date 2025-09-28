// src/app/servicios/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebase } from '../firebase.init';
import { get, ref, getDatabase } from 'firebase/database';

export interface AppUser {
  uid: string;
  email: string | null;
  rol: 'admin' | 'buyer' | 'moderator' | string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usuarioSubject = new BehaviorSubject<AppUser | null>(null);
  usuario$ = this.usuarioSubject.asObservable();

  constructor() {}

  async login(email: string, password: string): Promise<AppUser> {
  const { auth, database } = await getFirebase(); // database = RTDB

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // 🔍 Traer datos del usuario desde RTDB (/users/{uid})
  const dbRef = ref(database, `users/${user.uid}`);
  const snapshot = await get(dbRef);

  let rol: string = 'buyer'; // Rol por defecto

  if (snapshot.exists()) {
    const data = snapshot.val();
    rol = data.role || 'buyer'; // si no tiene campo 'role', usar 'buyer'
  }

  const usuario: AppUser = {
    uid: user.uid,
    email: user.email,
    rol: rol,
  };

   localStorage.setItem('usuarioActual', JSON.stringify(usuario));
  this.usuarioSubject.next(usuario);
  return usuario;
}
  
  logout(): void {
    this.usuarioSubject.next(null);
    localStorage.removeItem('usuarioActual');
  }

  getUsuarioActual(): AppUser | null {
    return this.usuarioSubject.value;
  }
}
