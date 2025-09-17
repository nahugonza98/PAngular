import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

import { getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'ecommersGB';

  ngOnInit(): void {
    // Ejecutar solo en navegador (evita errores con SSR)
    if (typeof window !== 'undefined') {
      const auth = getAuth(getApp());
      if (!auth.currentUser) {
        signInAnonymously(auth).catch(err => console.error('Anon auth error:', err));
      }
    }
  }
}
