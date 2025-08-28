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

  constructor(private productosService: ProductosService, private router: Router) {}

  crearProducto() {

      console.log('Producto a guardar:', this.producto); 

    this.productosService.crearProducto(this.producto).subscribe({
      next: () => {
        this.mensaje = 'Producto creado correctamente';
        setTimeout(() => {
          this.mensaje = '';
          this.router.navigate(['/productos']);
        }, 2000);
      },
      error: (err) => {
        this.mensaje = 'Error al crear el producto';
        console.error(err);
      }
    });
  }
}
