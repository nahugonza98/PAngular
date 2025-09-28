import { Component, OnDestroy, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { getFirebase } from '../../firebase.init';

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  Auth
} from 'firebase/auth';
import {
  ref as dbRef,
  onValue,
  off,
  update,
  push,
  query,
  orderByChild,
  Database,
  get
} from 'firebase/database';

type UsersMap = Record<string, { displayName?: string; email?: string; role?: 'user' | 'admin' | 'moderator' }>;

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
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  isLoggedIn = false;
  currentUid: string | null = null;

  loginForm: FormGroup;
  form: FormGroup;
  loadingLogin = false;
  loginErrorMsg = '';

  chats: ChatMsg[] = [];
  usersMap: UsersMap = {};

  private auth!: Auth;
  private db: Database | null = null;

  private authUnsub: (() => void) | null = null;
  private usersOff: (() => void) | null = null;
  private msgsOff: (() => void) | null = null;

  @ViewChild('historyRef') historyRef!: ElementRef<HTMLDivElement>;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      username: ['', [Validators.minLength(3), Validators.maxLength(24)]]
    });

    this.form = this.fb.group({
      message: ['', [Validators.required]]
    });
  }

  async ngOnInit() {
    const { auth, database } = await getFirebase();
    this.auth = auth;
    this.db = database;

    this.authUnsub = onAuthStateChanged(this.auth, async (user: User | null) => {
      this.isLoggedIn = !!user;
      this.currentUid = user?.uid ?? null;

      if (this.isLoggedIn) {
        await this.ensureDefaultRole();
        this.subUsers();
        this.subMensajes();
      } else {
        this.unsubUsers();
        this.unsubMensajes();
        this.chats = [];
      }
    });
  }

  ngAfterViewInit() {
    // asegura que si ya hay mensajes, se haga scroll
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.authUnsub?.();
    this.unsubUsers();
    this.unsubMensajes();
  }

  // -------- SUBS ----------
  private subUsers() {
    if (!this.db) return;
    const ref = dbRef(this.db, 'users');
    const cb = (snap: any) => {
      this.usersMap = snap.val() ?? {};
      this.chats = [...this.chats];
    };
    onValue(ref, cb);
    this.usersOff = () => off(ref, 'value', cb);
  }
  private unsubUsers() { this.usersOff?.(); this.usersOff = null; }

  private subMensajes() {
    if (!this.db) return;
    const ref = query(dbRef(this.db, 'rooms/global/messages'), orderByChild('timestamp'));
    const cb = (snap: any) => {
      const list: ChatMsg[] = [];
      snap.forEach((child: any) => {
        const m = child.val();
        list.push({
          id: child.key as string,
          uid: m.uid,
          text: m.text,
          timestamp: typeof m.timestamp === 'number' ? m.timestamp : Date.now()
        });
      });
      this.chats = list;
      this.scrollToBottom(); // auto scroll al recibir mensajes
    };
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
      const payload: any = { email };
      if (alias.length >= 3 && alias.length <= 24) {
        payload.displayName = alias;
        localStorage.setItem('chatAlias', alias);
      }
      await update(dbRef(this.db, `users/${uid}`), payload);

      await this.ensureDefaultRole(uid);
    } catch (e: any) {
      this.loginErrorMsg = e?.message ?? 'Error al iniciar sesión';
    } finally {
      this.loadingLogin = false;
    }
  }

  async logout() {
    await signOut(this.auth);
  }

  // -------- MENSAJES ----------
  async send() {
    if (!this.db || !this.currentUid || this.form.invalid) return;
    const message: string = (this.form.value.message ?? '').toString().trim();
    if (!message) return;

    await push(dbRef(this.db, 'rooms/global/messages'), {
      uid: this.currentUid,
      text: message,
      timestamp: Date.now()
    });

    this.form.patchValue({ message: '' });
    this.scrollToBottom(); // auto scroll al enviar
  }

  // -------- HELPERS ----------
  trackById(_i: number, m: ChatMsg) { return m.id; }
  nombreDe(uid: string) { return this.usersMap[uid]?.displayName || 'Anon'; }
  rolDe(uid: string): 'user' | 'admin' | 'moderator' {
    const r = this.usersMap[uid]?.role;
    return (r === 'admin' || r === 'moderator') ? r : 'user';
  }

  // -------- UTIL: asegurar rol por defecto ----------
  private async ensureDefaultRole(forceUid?: string) {
    if (!this.db) return;
    const uid = forceUid ?? this.currentUid;
    if (!uid) return;

    const roleSnap = await get(dbRef(this.db, `users/${uid}/role`));
    if (!roleSnap.exists()) {
      await update(dbRef(this.db, `users/${uid}`), { role: 'user' });
    }
  }

  // -------- Auto-scroll ----------
  private scrollToBottom() {
    setTimeout(() => {
      if (this.historyRef?.nativeElement) {
        const el = this.historyRef.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50); // delay corto para que Angular pinte primero
  }
}
