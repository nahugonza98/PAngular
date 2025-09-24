import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CarritoService } from '../../servicios/carrito.service';
import { FacturaService } from '../../servicios/factura.service';
import { FacturaPreviewComponent } from '../facturas-preview/factura-preview.component';

// Tipos del payload que emite el hijo (idénticos a los del preview)
interface InvoiceItemPayload {
  producto_id: number | null;
  producto_nombre: string;
  cantidad: number;
  precio_unit_ars: number;
  subtotal_ars: number;
  precio_unit_usd: number;
  cliente_email?: string | null;
  subtotal_usd: number;
}

interface InvoicePayload {
  fecha: string;                 // ISO
  cliente_id: number | null;
  cliente_nombre: string | null;
  tipo_cambio: number;
  total_ars: number;
   cliente_email?: string | null;
  total_usd: number;
  items: InvoiceItemPayload[];
}

@Component({
  selector: 'app-finalizar-compra',
  standalone: true,
  imports: [CommonModule, FacturaPreviewComponent],
  templateUrl: './finalizar-compra.component.html',
  styleUrls: ['./finalizar-compra.component.css']
})
export class FinalizarCompraComponent implements OnInit {
  productosSeleccionados: any[] = [];
  guardando = false;

  constructor(
    private carritoService: CarritoService,
    private facturaService: FacturaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productosSeleccionados = this.carritoService.obtenerProductos();
  }

  // Recibe el objeto emitido por <app-factura-preview (confirmarCompra)="confirmarCompra($event)">
  confirmarCompra(payload: InvoicePayload) {
    console.log('[Padre] Recibí payload:', payload);
    const u = JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('usuarioActual') || 'null');


    // Validaciones mínimas antes de guardar

    if (u?.id && u?.email) {
    payload.cliente_id = Number(u.id);
    payload.cliente_email = String(u.email);
    payload.cliente_nombre = String(u.nombre || u.email);
/*     payload.cliente_nombre = payload.cliente_nombre || (u.nombre || u.email);
 */  }

    if (!payload || !payload.items?.length) {
      alert('No hay ítems para facturar.');
      return;
    }
    if (!payload.tipo_cambio || payload.tipo_cambio <= 0) {
      alert('No se pudo obtener la cotización del dólar. Intenta nuevamente.');
      return;
    }

    this.guardando = true;

    this.facturaService.guardarFactura(payload).subscribe({
      next: (res) => {
        console.log('✅ Factura guardada:', res);
        // Limpiar carrito y UI
        this.carritoService.vaciarCarrito();
        this.productosSeleccionados = [];
        alert('✅ Compra finalizada con éxito');

        // Redirigir al inicio o a la lista de facturas
        setTimeout(() => this.router.navigate(['/']), 800);
      },
      error: (err) => {
  console.error('❌ Error guardando factura:', err?.error || err);
  alert(err?.error?.message || '❌ Hubo un error al guardar la factura');
},
      complete: () => {
        this.guardando = false;
      }
    });
  }
}
