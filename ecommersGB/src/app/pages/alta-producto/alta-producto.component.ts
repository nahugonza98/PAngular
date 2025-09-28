import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductosService, Producto } from '../../servicios/productos.service';

@Component({
  selector: 'app-alta-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alta-producto.component.html',
  styleUrls: ['./alta-producto.component.css']
})
export class AltaProductoComponent {
  producto: Partial<Producto> = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    imagen: ''
  };

  mensaje = '';
  guardando = false;

  constructor(
    private productosService: ProductosService,
    private router: Router
  ) {}

  async crearProducto() {
    this.guardando = true;
    this.mensaje = '';

    try {
      console.log('Producto a guardar:', this.producto);

      const id = await this.productosService.crearProducto(this.producto);
      console.log('✅ Producto creado con ID:', id);

      this.mensaje = 'Producto creado correctamente';

      setTimeout(() => {
        this.mensaje = '';
        this.router.navigate(['/productos']);
      }, 2000);

    } catch (err) {
      console.error('❌ Error al crear el producto:', err);
      this.mensaje = 'Error al crear el producto';
    } finally {
      this.guardando = false;
    }
  }
}
