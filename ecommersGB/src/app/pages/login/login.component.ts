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
      localStorage.setItem('usuarioActual', JSON.stringify(res.usuario));

      this.router.navigate(['/productos']).then(() => {
        window.location.reload(); 
      });
    },
    error: () => {
      this.mensaje = '❌ Email o contraseña incorrectos.';
    }
  });
}

}
