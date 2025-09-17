import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ingresar-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ingresar-producto.component.html',
  styleUrls: ['./ingresar-producto.component.css']
})
export class IngresarProductoComponent {
  formulario!: FormGroup;
  mensaje = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      precio: [null, [Validators.required, Validators.min(1)]],
      imagen: ['', Validators.required],
      descripcion: ['']
    });
  }
  
campoInvalido(campo: string): boolean {
  const control = this.formulario.get(campo);
  return !!(control && control.invalid && (control.dirty || control.touched));
}

  guardarProducto() {
    if (this.formulario.invalid) {
      this.mensaje = '⚠️ Completá todos los campos requeridos.';
      return;
    }

    const producto = this.formulario.value;

    this.http.post('http://localhost:4000/api/productos', producto).subscribe({
      next: () => {
        this.mensaje = '✅ Producto guardado con éxito.';
        this.formulario.reset();
      },
      error: (err) => {
        console.error(err);
        this.mensaje = '❌ Error al guardar el producto.';
      }
    });
  }
}
