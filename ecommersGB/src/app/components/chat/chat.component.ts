import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../servicios/auth.service';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
  // Login
  loginForm!: FormGroup;
  loadingLogin = false;
  loginErrorMsg: string | null = null;

  // Chat
  form!: FormGroup;
  chats: Array<{ username: string; text: string; timestamp: number }> = [];

  // Estado de sesión
  isLoggedIn = false;

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Solo definimos los forms en el ctor (no tocamos auth acá)
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      username: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      message: ['', [Validators.required]],
    });
  }

  async ngOnInit() {
    // Evita inicializar Firebase en SSR
    if (!isPlatformBrowser(this.platformId)) return;

    // *** Inicializa Firebase antes de leer this.auth.auth ***
    await this.auth.ready();

    // Recién ahora podemos usar this.auth.auth
    onAuthStateChanged(this.auth.auth, (u) => (this.isLoggedIn = !!u));
  }

  // ===== Login =====
  async login() {
    if (this.loginForm.invalid) return;
    if (!isPlatformBrowser(this.platformId)) return;

    this.loadingLogin = true;
    this.loginErrorMsg = null;

    const { email, password, username } = this.loginForm.value as {
      email: string;
      password: string;
      username: string;
    };

    try {
      await this.auth.ready(); // por si entran directo a la ruta /chat
      await signInWithEmailAndPassword(this.auth.auth, email, password);
      this.form.patchValue({ username });
    } catch {
      this.loginErrorMsg = 'Credenciales inválidas o acceso bloqueado. Intenta nuevamente.';
    } finally {
      this.loadingLogin = false;
    }
  }

  async logout() {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.auth.ready();
    await signOut(this.auth.auth);
  }

  // ===== Chat =====
  async send() {
    if (this.form.invalid) return;
    const { username, message } = this.form.value as { username: string; message: string };

    this.chats.push({
      username: (username || 'Anon').trim(),
      text: (message || '').trim(),
      timestamp: Date.now(),
    });
    this.form.patchValue({ message: '' });

    setTimeout(() => {
      const el = document.getElementById('history');
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }
}
