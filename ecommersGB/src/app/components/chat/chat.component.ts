import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatIconModule,
    MatCardModule, MatDividerModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  chats: Chat[] = [];

  // refs de Firebase cuando estemos en browser
  private isBrowser: boolean;
  private db: any;
  private msgsRef: any;
  private offChildAdded?: () => void;

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.form = this.fb.group({
      username: [''],
      message: ['', [Validators.required, Validators.maxLength(1000)]],
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;

    // 👉 Cargamos Firebase SOLO en el navegador
    const { getDatabase, ref, onChildAdded, query, limitToLast } =
      await import('firebase/database');

    this.db = getDatabase();
    this.msgsRef = ref(this.db, 'rooms/global/messages');

    const q = query(this.msgsRef, limitToLast(50));
    const unsubscribe = onChildAdded(q, (snap: any) => {
      const data = snap.val();
      this.chats.push({ id: snap.key!, ...data });
    });
    // guardo para soltarlo en destroy
    this.offChildAdded = () => unsubscribe();
  }

  ngOnDestroy(): void {
    if (this.offChildAdded) this.offChildAdded();
  }

  async send(): Promise<void> {
    if (this.form.invalid || !this.isBrowser) {
      this.form.markAllAsTouched();
      return;
    }
    const text = (this.form.value.message ?? '').toString().trim();
    if (!text) return;

    const username = (this.form.value.username ?? 'Anon').toString().trim() || 'Anon';

    const { ref, push } = await import('firebase/database');
    await push(this.msgsRef, {
      uid: 'anon',
      username,
      text,
      timestamp: Date.now(),
    });

    this.form.patchValue({ message: '' });
  }
}

export interface Chat {
  id?: string;
  uid?: string;
  username: string;
  text: string;
  timestamp: number;
}
