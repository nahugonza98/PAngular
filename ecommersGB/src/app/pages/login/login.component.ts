// src/app/pages/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AppUser } from '../../servicios/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent {
  formulario: FormGroup;
  mensaje = '';
  mostrarToast = false;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.formulario = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  campoInvalido(nombre: string): boolean {
    const c = this.formulario.get(nombre);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  async iniciarSesion(): Promise<void> {
    this.mensaje = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const { email, password } = this.formulario.value;

    try {
      const user: AppUser = await this.auth.login(email, password);

      // Feedback visual
      this.mostrarToast = true;
      setTimeout(() => (this.mostrarToast = false), 2000);

      // Navegación según rol
      if (user.role === 'admin' || user.role === 'moderator') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    } catch (err: any) {
      console.error('Error de login (componente):', err?.code || err);
      this.mensaje = this.mapError(err);
    } finally {
      this.cargando = false;
    }
  }

  private mapError(e: any): string {
    const code = e?.code || e?.error?.message;
    switch (code) {
      case 'auth/invalid-email':
      case 'INVALID_EMAIL': return 'El email no es válido.';
      case 'auth/missing-password':
      case 'MISSING_PASSWORD': return 'Ingresá la contraseña.';
      case 'auth/user-not-found':
      case 'EMAIL_NOT_FOUND': return 'No existe un usuario con ese email.';
      case 'auth/wrong-password':
      case 'INVALID_PASSWORD': return 'Contraseña incorrecta.';
      case 'auth/invalid-api-key':
      case 'INVALID_API_KEY': return 'API key inválida en environment.';
      default: return 'No se pudo iniciar sesión. Revisá los datos.';
    }
  }
}
