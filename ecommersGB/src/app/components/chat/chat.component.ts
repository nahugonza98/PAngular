import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { getFirebase } from '../../firebase.init'; 

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import {
  ref as dbRef,
  onValue,
  off,
  update,
  push,
  query,
  orderByChild,
  Database
} from 'firebase/database';

type UsersMap = Record<string, { displayName?: string; email?: string }>;

interface ChatMsg {
  id: string;
  uid: string;
  text: string;
  timestamp: number;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  currentUid: string | null = null;

  loginForm: FormGroup;
  form: FormGroup;
  loadingLogin = false;
  loginErrorMsg = '';

  chats: ChatMsg[] = [];
  usersMap: UsersMap = {};

  private auth: any;
  private db: Database | null = null;

  private authUnsub: (() => void) | null = null;
  private usersOff: (() => void) | null = null;
  private msgsOff: (() => void) | null = null;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      username: ['', [Validators.minLength(3), Validators.maxLength(24)]]
    });

    this.form = this.fb.group({
      username: ['', [Validators.minLength(3), Validators.maxLength(24)]],
      message: ['', [Validators.required]]
    });
  }

  async ngOnInit() {
    const { auth, db } = await getFirebase();
    this.auth = auth;
    this.db = db;

    this.authUnsub = onAuthStateChanged(this.auth, (user: User | null) => {
      this.isLoggedIn = !!user;
      this.currentUid = user?.uid ?? null;

      if (this.isLoggedIn) {
        this.subUsers();
        this.subMensajes();
      } else {
        this.unsubUsers();
        this.unsubMensajes();
        this.chats = [];
      }
    });
  }

  ngOnDestroy() {
    this.authUnsub?.();
    this.unsubUsers();
    this.unsubMensajes();
  }

  // -------- SUBS ----------
  private subUsers() {
    if (!this.db) return;
    const cb = (snap: any) => {
      this.usersMap = snap.val() ?? {};
      this.chats = [...this.chats]; // refresca vista
    };
    const ref = dbRef(this.db, 'users');
    onValue(ref, cb);
    this.usersOff = () => off(ref, 'value', cb);
  }
  private unsubUsers() { this.usersOff?.(); this.usersOff = null; }

  private subMensajes() {
    if (!this.db) return;
    const cb = (snap: any) => {
      const raw = snap.val() ?? {};
      this.chats = Object.entries(raw).map(([id, m]: any) => ({
        id,
        uid: m.uid,
        text: m.text,
        timestamp: typeof m.timestamp === 'number' ? m.timestamp : Date.now()
      }));
    };
    const ref = query(dbRef(this.db, 'rooms/global/messages'), orderByChild('timestamp'));
    onValue(ref, cb);
    this.msgsOff = () => off(ref, 'value', cb);
  }
  private unsubMensajes() { this.msgsOff?.(); this.msgsOff = null; }

  // -------- LOGIN ----------
  async login() {
    if (!this.db || this.loginForm.invalid) return;
    this.loadingLogin = true;
    this.loginErrorMsg = '';
    const { email, password, username } = this.loginForm.value;

    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      const uid = cred.user.uid;

      const alias = (username ?? '').toString().trim();
      if (alias.length >= 3 && alias.length <= 24) {
        await update(dbRef(this.db, `users/${uid}`), { displayName: alias, email });
      } else {
        await update(dbRef(this.db, `users/${uid}`), { email });
      }
    } catch (e: any) {
      this.loginErrorMsg = e?.message ?? 'Error al iniciar sesión';
    } finally {
      this.loadingLogin = false;
    }
  }

  async logout() { await signOut(this.auth); }

  // -------- MENSAJES ----------
  async send() {
    if (!this.db || !this.currentUid || this.form.invalid) return;
    const message: string = (this.form.value.message ?? '').toString().trim();
    if (!message) return;

    const alias = (this.form.value.username ?? '').toString().trim();
    if (alias.length >= 3 && alias.length <= 24) {
      await update(dbRef(this.db, `users/${this.currentUid}`), { displayName: alias });
    }

    await push(dbRef(this.db, 'rooms/global/messages'), {
      uid: this.currentUid,
      text: message,
      timestamp: Date.now()
    });

    this.form.patchValue({ message: '' });
  }

  // -------- HELPERS ----------
  trackById(_i: number, m: ChatMsg) { return m.id; }
  nombreDe(uid: string) { return this.usersMap[uid]?.displayName || 'Anon'; }
}
