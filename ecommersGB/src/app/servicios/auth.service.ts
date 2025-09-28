// src/app/servicios/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebase } from '../firebase.init';

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
    
    const { auth } = await getFirebase();

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    const usuario: AppUser = {
      uid: user.uid,
      email: user.email,
      rol: 'admin', // más adelante cargar desde la DB
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
