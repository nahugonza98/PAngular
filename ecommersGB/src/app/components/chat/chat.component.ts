import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material (si ya lo venías usando)
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
  <div *ngIf="!browser" class="p-3">Chat deshabilitado en SSR.</div>

  <mat-card *ngIf="browser" class="chat-shell">
    <mat-card-header class="chat-header">
      <mat-icon>chat</mat-icon>
      <span>Sala Global</span>
    </mat-card-header>

    <!-- Auth -->
    <div class="auth" *ngIf="!loggedIn; else loggedTpl">
      <mat-form-field appearance="outline" class="fw">
        <mat-label>Email</mat-label>
        <input matInput [(ngModel)]="email" autocomplete="email" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="fw">
        <mat-label>Password</mat-label>
        <input matInput [(ngModel)]="password" type="password" autocomplete="current-password" />
      </mat-form-field>

      <button mat-raised-button color="primary" (click)="login()" [disabled]="!email || !password">
        Iniciar sesión
      </button>
    </div>

    <ng-template #loggedTpl>
      <div class="auth">
        <span>Hola, {{ userLabel }}</span>
        <button mat-stroked-button color="warn" (click)="logout()">Salir</button>
      </div>
    </ng-template>

    <!-- Mensajes -->
    <div class="messages">
      <div *ngFor="let m of messages" class="msg">
        <b>{{ m.username || 'Anon' }}:</b> {{ m.text }}
      </div>
    </div>

    <!-- Composer -->
    <div class="composer" *ngIf="loggedIn">
      <mat-form-field appearance="fill" class="fw">
        <mat-label>Escribe un mensaje...</mat-label>
        <input
          matInput
          [(ngModel)]="draft"
          (keyup.enter)="send()"
          autocomplete="off"
        />
        <button
          mat-icon-button
          matSuffix
          (click)="send()"
          [disabled]="!draft.trim()"
          aria-label="Enviar"
        >
          <mat-icon>send</mat-icon>
        </button>
      </mat-form-field>
    </div>
  </mat-card>
  `,
  styles: [`
    .chat-shell { display:flex; flex-direction:column; max-width: 760px; height: 78vh; margin: 16px auto; border-radius: 16px; }
    .chat-header { display:flex; align-items:center; gap:8px; font-weight:600; }
    .auth { display:flex; gap:12px; align-items:center; padding:12px; }
    .fw { flex:1; }
    .messages { flex:1; overflow-y:auto; padding:12px; border-top:1px solid rgba(0,0,0,0.08); border-bottom:1px solid rgba(0,0,0,0.08); }
    .msg { margin-bottom:8px; }
    .composer { padding:12px; }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  browser = false;

  // estado UI
  loggedIn = false;
  userLabel = '';

  // form
  email = '';
  password = '';
  draft = '';

  // mensajes
  messages: Array<any> = [];
  private unsubMessages: (() => void) | null = null;
  private unsubAuth: (() => void) | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private authSvc: AuthService
  ) {
    this.browser = isPlatformBrowser(platformId);
  }

  async ngOnInit() {
    if (!this.browser) return;

    await this.authSvc.ready();

    // Escuchar cambios de auth y controlar la UI
    this.unsubAuth = this.authSvc.onAuthStateChanged((u) => {
      this.loggedIn = !!u;
      this.userLabel = u?.displayName || u?.email || '';

      // cortar suscripción previa
      if (this.unsubMessages) { this.unsubMessages(); this.unsubMessages = null; }

      if (this.loggedIn) {
        this.startMessages();
      } else {
        this.messages = [];
      }
    });
  }

  ngOnDestroy() {
    if (this.unsubMessages) this.unsubMessages();
    if (this.unsubAuth) this.unsubAuth();
  }

  private async startMessages() {
    this.unsubMessages = await this.authSvc.watchMessages(100, (msgs) => {
      this.messages = msgs;
      // autoscroll
      setTimeout(() => {
        const box = document.querySelector('.messages');
        box?.scrollTo({ top: (box as HTMLElement).scrollHeight });
      }, 0);
    });
  }

  async login() {
    if (!this.email || !this.password) return;
    await this.authSvc.signInWithEmailPassword(this.email, this.password);
    this.password = '';
  }

  async logout() {
    await this.authSvc.signOut();
  }

  async send() {
    const text = this.draft.trim();
    if (!text) return;
    await this.authSvc.sendMessage(text);
    this.draft = '';
  }
}
