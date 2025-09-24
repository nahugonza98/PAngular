import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  formulario!: FormGroup;
  mensaje = '';
  mostrarToast = false;


  /* Constructor FormBuilder */
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.formulario = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  iniciarSesion() {
  if (this.formulario.invalid) {
    this.mensaje = '⚠️ Completá todos los campos.';
    return;
  }

  const credenciales = this.formulario.value;

  this.http.post<any>('http://localhost:4000/api/login', credenciales).subscribe({
    next: (res) => {

      // el back puede responder { usuario: {...} } o el objeto directo
      const u = res?.usuario ?? res;

      // normalizamos lo que guardamos
      const safeUser = {
        id: Number(u?.id),
        email: String(u?.email || ''),
        nombre: u?.nombre ? String(u.nombre) : null,
        rol: u?.rol ? String(u.rol) : 'user'
      };

      // clave estándar que usaremos en la compra
      localStorage.setItem('usuario', JSON.stringify(safeUser));
      // (opcional) mantén tu clave anterior por compatibilidad
      localStorage.setItem('usuarioActual', JSON.stringify(safeUser));

      // navegá una sola vez
      this.router.navigate(['/productos']); 
      // si querés forzar recarga, usá esta línea en lugar de la de arriba:
      // this.router.navigate(['/productos']).then(() => window.location.reload());


       // guardamos el usuario
  localStorage.setItem('usuario', JSON.stringify(safeUser));
  localStorage.setItem('usuarioActual', JSON.stringify(safeUser)); // opcional/compat

  // UNA sola navegación + reload para que el navbar lea el user
  this.router.navigate(['/productos']).then(() => window.location.reload());
    },
    error: () => {
      this.mensaje = '❌ Email o contraseña incorrectos.';
    }
  });
}
}
