import { Component, OnInit } from '@angular/core';
import { CarritoService } from '../../servicios/carrito.service';
import { CommonModule } from '@angular/common';
import { Producto } from '../../servicios/productos.service';
import { HttpClient } from '@angular/common/http';
import { FacturaPreviewComponent } from '../../pages/facturas-preview/factura-preview.component';
import { Router } from '@angular/router';


@Component({
  standalone: true,
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css'],
  imports: [
    CommonModule,
  ],
})
export class CarritoComponent implements OnInit {
  productosEnCarrito: ProductoCarrito[] = [];
  compraRealizada: boolean = false;
  constructor(
    private carritoService: CarritoService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.productosEnCarrito = this.carritoService.obtenerProductos();
  }

  obtenerTotal(): number {
    return this.productosEnCarrito.reduce(
      (acc, prod) => acc + prod.precio * prod.cantidad,
      0
    )
  }

  aumentarCantidad(producto: ProductoCarrito): void {
    this.carritoService.modificarCantidad(producto.id, 1);
    this.productosEnCarrito = this.carritoService.obtenerProductos();
  }

  disminuirCantidad(producto: ProductoCarrito): void {
    this.carritoService.modificarCantidad(producto.id, -1);
    this.productosEnCarrito = this.carritoService.obtenerProductos();
  }


  irAProductos() {
    this.router.navigate(['/productos']);
  }

  irAFacturas() {
    this.router.navigate(['/facturas']);
  }

  irAFinalizarCompra() {
    this.router.navigate(['/finalizar-compra']);
  }

  finalizarCompra(): void {
    const productos = this.carritoService.obtenerProductos();

    if (productos.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    const total = productos.reduce(
      (acc, item) => acc + item.precio * item.cantidad,
      0
    );

    const factura = {
      productos,
      total,
      fecha: new Date()
    };

    this.http.post('http://localhost:4000/facturas', factura).subscribe({
      next: () => {
        this.carritoService.vaciarCarrito();
        this.productosEnCarrito = [];

        this.compraRealizada = true;

        setTimeout(() => {
          this.compraRealizada = false;
        }, 3000);
      },
      error: (err) => {
        console.error('Error al generar la factura', err);
        alert('Ocurrió un error');
      }
    });
  }
}


interface ProductoCarrito extends Producto {
  cantidad: number;
}
