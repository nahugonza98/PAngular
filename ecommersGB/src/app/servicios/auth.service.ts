// src/app/servicios/auth.service.ts
import { Injectable } from '@angular/core';
import { signInWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { getFirebase } from '../firebase.init' // ruta según tu estructura

export interface AppUser {
  uid: string;
  email: string | null;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor() {}

  async login(email: string, password: string): Promise<AppUser> {
    try {
      const { auth } = await getFirebase();

      const cred: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = cred.user;

      const appUser: AppUser = {
        uid: user.uid,
        email: user.email,
        role: 'buyer', // Ajustá si tenés roles en tu RTDB
      };

      return appUser;
    } catch (error: any) {
      console.error('Firebase error:', error.code, error.message, error);
      throw error;
    }
  }
}
