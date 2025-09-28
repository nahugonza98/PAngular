import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductosService, Producto } from '../../servicios/productos.service';
import { CarritoService } from '../../servicios/carrito.service';
import { FiltroNombrePipe } from '../../pages/pipes/filtro-nombre.pipe';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,        
    FiltroNombrePipe     
  ],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  filtro = '';
  mostrarConfirmacion = false;
  productoAgregado = '';
  idProductoAEliminar: number | null = null;
  mostrarModalEliminar = false;
  usuarioActual: any = null;

  constructor(
    private productosService: ProductosService,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    // Cargar productos
    this.productosService.obtenerProductos().subscribe((data) => {
      this.productos = data;
    });

    // Cargar usuario actual desde localStorage
    if (typeof window !== 'undefined') {
      const usuario = localStorage.getItem('usuarioActual');
      this.usuarioActual = usuario ? JSON.parse(usuario) : null;
    }
  }

  agregarAlCarrito(producto: Producto) {
    this.carritoService.agregarProducto(producto);
    this.productoAgregado = producto.nombre;
    this.mostrarConfirmacion = true;

    setTimeout(() => {
      this.mostrarConfirmacion = false;
    }, 2500);
  }

  confirmarEliminar(id: number) {
    this.idProductoAEliminar = id;
    this.mostrarModalEliminar = true;
  }

  cancelarEliminar() {
    this.idProductoAEliminar = null;
    this.mostrarModalEliminar = false;
  }

  eliminarConfirmado() {
    if (this.idProductoAEliminar !== null) {
      this.productosService.eliminarProducto(this.idProductoAEliminar).subscribe(() => {
        this.productos = this.productos.filter(p => p.id !== this.idProductoAEliminar);
        this.mostrarModalEliminar = false;
      });
    }
  }
}
