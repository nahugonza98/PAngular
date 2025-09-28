import { Component, OnInit } from '@angular/core';
import { CarritoService } from '../../servicios/carrito.service';
import { CommonModule } from '@angular/common';
import { Producto } from '../../servicios/productos.service';
import { Router } from '@angular/router';
import { FacturaService } from '../../servicios/factura.service'; // ← RTDB

@Component({
  standalone: true,
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css'],
  imports: [ CommonModule ],
})
export class CarritoComponent implements OnInit {
  productosEnCarrito: ProductoCarrito[] = [];
  compraRealizada = false;

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private facturaSrv: FacturaService, // ← inyectamos el service RTDB
  ) {}

  ngOnInit(): void {
    this.productosEnCarrito = this.carritoService.obtenerProductos();
  }

  obtenerTotal(): number {
    return this.productosEnCarrito.reduce(
      (acc, prod) => acc + prod.precio * prod.cantidad,
      0
    );
  }

  aumentarCantidad(producto: ProductoCarrito): void {
    this.carritoService.modificarCantidad(producto.id, 1);
    this.productosEnCarrito = this.carritoService.obtenerProductos();
  }

  disminuirCantidad(producto: ProductoCarrito): void {
    this.carritoService.modificarCantidad(producto.id, -1);
    this.productosEnCarrito = this.carritoService.obtenerProductos();
  }

  irAProductos() { this.router.navigate(['/productos']); }
  irAFacturas()  { this.router.navigate(['/facturas']); }
  irAFinalizarCompra() { this.router.navigate(['/finalizar-compra']); }

  // === RTDB ===
  async finalizarCompra(): Promise<void> {
    const productos = this.carritoService.obtenerProductos();
    if (productos.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    const totalARS = productos.reduce(
      (acc, item) => acc + item.precio * item.cantidad,
      0
    );

    // armamos los items como espera RTDB
    const items = productos.map(p => ({
      producto_id: p.id,
      producto_nombre: p.nombre,
      cantidad: p.cantidad,
      precio_unitario: p.precio,
      subtotal_ars: p.cantidad * p.precio,
    }));

    try {
      await this.facturaSrv.guardarFacturaEnRTDB({
        totalARS,
        estado: 'PAGADA',
        items,
        // si querés: cliente: { id: ..., nombre: ... },
        fecha: new Date(),
      });

      this.carritoService.vaciarCarrito();
      this.productosEnCarrito = [];
      this.compraRealizada = true;
      setTimeout(() => (this.compraRealizada = false), 3000);
    } catch (err) {
      console.error('Error al generar la factura en RTDB', err);
      alert('Ocurrió un error al guardar la factura.');
    }
  }
}

interface ProductoCarrito extends Producto {
  cantidad: number;
}
