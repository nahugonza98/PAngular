// src/app/pages/ingresar-producto/ingresar-producto.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductosService, Producto } from '../../servicios/productos.service';

@Component({
  standalone: true,
  selector: 'app-ingresar-producto',
  templateUrl: './ingresar-producto.component.html',
  styleUrls: ['./ingresar-producto.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class IngresarProductoComponent {
  formulario: FormGroup;
  mensaje = '';
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private productosSrv: ProductosService,
    private router: Router
  ) {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      precio: [null, [Validators.required, Validators.min(0.01)]],
      imagen: ['', [Validators.required]],
      descripcion: [''],
      stock: [0, [Validators.min(0)]],
    });
  }

  campoInvalido(nombre: string): boolean {
    const c = this.formulario.get(nombre);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  async guardarProducto(): Promise<void> {
    this.mensaje = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const payload: Partial<Producto> = this.formulario.value;

    try {
      const nuevoId = await this.productosSrv.crearProducto(payload);
      this.mensaje = `✅ Producto creado (ID ${nuevoId}).`;
      // si querés redirigir:
      // await this.router.navigate(['/productos']);
      this.formulario.reset();
    } catch (e) {
      console.error('Error al crear producto en RTDB', e);
      this.mensaje = '❌ No se pudo crear el producto.';
    } finally {
      this.guardando = false;
    }
  }
}
