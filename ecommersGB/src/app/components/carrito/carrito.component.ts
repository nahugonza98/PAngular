import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { CarritoService } from '../../servicios/carrito.service';
import { FacturaService } from '../../servicios/factura.service'; // RTDB
import { Producto } from '../../servicios/productos.service';

@Component({
  standalone: true,
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css'],
  imports: [CommonModule, HttpClientModule],
})
export class CarritoComponent implements OnInit {
  productosEnCarrito: ProductoCarrito[] = [];
  compraRealizada = false;

  // cotización del USD (venta) — se usa para totalUSD
  cotizacionUSD: number | null = null;
  cargandoCotizacion = false;

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private facturaSrv: FacturaService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.productosEnCarrito = this.carritoService.obtenerProductos();
    this.obtenerCotizacionUSD();
  }

  // -------- helpers de UI --------
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

  // -------- cotización del dólar --------
  private async obtenerCotizacionUSD() {
    try {
      this.cargandoCotizacion = true;
      // Oficial venta (DolarApi)
      const res: any = await this.http
        .get('https://dolarapi.com/v1/dolares/oficial')
        .toPromise();
      this.cotizacionUSD = Number(res?.venta) || null;
    } catch (err) {
      console.error('Error al obtener cotización DolarApi:', err);
      this.cotizacionUSD = null; // seguimos sin frenar la compra
    } finally {
      this.cargandoCotizacion = false;
    }
  }

  // -------- finalizar compra (guarda en RTDB) --------
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

  // armamos los items como espera RTDB (con nombre!)
  const items = productos.map(p => ({
    producto_id: p.id,
    producto_nombre: p.nombre,
    cantidad: p.cantidad,
    precio_unitario: p.precio,
    subtotal_ars: p.cantidad * p.precio,
  }));

  // totalUSD si tenemos tipo_cambio válido
  const tipo_cambio = this.cotizacionUSD ?? null;
  const totalUSD =
    tipo_cambio && tipo_cambio > 0
      ? Number((totalARS / tipo_cambio).toFixed(2))
      : null;

  try {
    // ✅ Llamamos al método nuevo del servicio
    await this.facturaSrv.crearFactura({
      items,
      totalARS,
      totalUSD,
      tipo_cambio,
    });

    // limpiar carrito y mostrar mensaje
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
