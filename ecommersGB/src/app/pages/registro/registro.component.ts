import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  formulario!: FormGroup;
  mensaje = '';
  mostrarToast = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.formulario = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rol: ['usuario']
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  registrarUsuario() {
    if (this.formulario.invalid) {
      this.mensaje = '⚠️ Completá todos los campos correctamente.';
      return;
    }

    const usuario = this.formulario.value;
    console.log('📤 Enviando usuario al backend:', usuario);

    this.http.post('http://localhost:4000/api/usuarios', usuario).subscribe({
      next: (res: any) => {
        console.log('✅ Usuario registrado con éxito:', res);

        this.mensaje = '';
        this.mostrarToast = true;

        setTimeout(() => {
          this.mostrarToast = false;
          this.router.navigate(['/login']);
        }, 4000);
      },
      error: (err) => {
        console.error('❌ Error al registrar usuario:', err);
        this.mensaje = err.error?.message || '❌ Error al registrar el usuario.';
      }
    });
  }
}
