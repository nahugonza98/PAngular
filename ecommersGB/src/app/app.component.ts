import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './servicios/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'ecommersGB';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authSvc: AuthService
  ) {}

  ngOnInit(): void {
    // Ejecutar solo en navegador (evita SSR)
    if (!isPlatformBrowser(this.platformId)) return;

    // ⚠️ Solo inicializamos Firebase; NO login anónimo.
    // No uses await en ngOnInit; no hace falta bloquear la UI.
  }
}
