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
  async confirmarCompra(payload: InvoicePayload): Promise<void> {
    console.log('[Padre] Recibí payload:', payload);

    if (!payload || !payload.items?.length) {
      alert('No hay ítems para facturar.');
      return;
    }

    if (!payload.tipo_cambio || payload.tipo_cambio <= 0) {
      alert('No se pudo obtener la cotización del dólar. Intenta nuevamente.');
      return;
    }

    // 🔹 Adaptamos a lo que espera crearFactura():
    const facturaAdaptada = {
      totalARS: payload.total_ars,
      totalUSD: payload.total_usd,
      tipo_cambio: payload.tipo_cambio,
      items: payload.items.map(item => ({
        producto_id: item.producto_id ?? 0,
        producto_nombre: item.producto_nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unit_ars,
        subtotal_ars: item.subtotal_ars
      }))
    };

    this.guardando = true;

    try {
      // ✅ Usamos el método nuevo del servicio
      const res = await this.facturaService.crearFactura(facturaAdaptada);
      console.log('✅ Factura guardada:', res);

      this.carritoService.vaciarCarrito();
      this.productosSeleccionados = [];

      setTimeout(() => this.router.navigate(['/']), 800);
    } catch (err: any) {
      console.error('❌ Error guardando factura:', err?.error || err);
      alert(err?.error?.message || '❌ Hubo un error al guardar la factura');
    } finally {
      this.guardando = false;
    }
  }
}
