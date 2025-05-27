import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductosService, Producto } from '../../servicios/productos.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent {
  productos: Producto[] = [];

  constructor(private productosService: ProductosService) {
    this.productos = this.productosService.obtenerProductos();
  }
}
