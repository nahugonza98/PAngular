import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

type InvoiceItemPayload = {
  producto_id: number | null;
  producto_nombre: string;
  cantidad: number;
  precio_unit_ars: number;
  subtotal_ars: number;
  precio_unit_usd: number;   // 0 si no hay tipo_cambio aún
  subtotal_usd: number;      // 0 si no hay tipo_cambio aún
};

type InvoicePayload = {
  fecha: string;             // ISO; el backend puede normalizar a AR
  cliente_id: number | null; // si hoy no tenés login, dejamos null
  cliente_nombre: string | null;
  tipo_cambio: number;       // 0 si no disponible (mejor bloquear confirmación)
  total_ars: number;
  total_usd: number;         // 0 si no hay tipo_cambio
  items: InvoiceItemPayload[];
};

@Component({
  selector: 'app-factura-preview',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './factura-preview.component.html',
  styleUrls: ['./factura-preview.component.css']
})
export class FacturaPreviewComponent implements OnInit {
  @Output() confirmarCompra = new EventEmitter<InvoicePayload>();
  @Input() productos: any[] = [];
  cotizacionUSD: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any>('https://dolarapi.com/v1/dolares/oficial')
      .subscribe({
        next: (res) => {
          console.log('📊 Cotización oficial:', res);
          this.cotizacionUSD = Number(res.venta) || 0;
        },
        error: (err) => {
          console.error('❌ Error al obtener cotización DolarApi:', err);
          this.cotizacionUSD = 0;
        }
      });
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  obtenerSubtotal(p: any): number {
    return p.precio * p.cantidad;
  }

  obtenerSubtotalUSD(p: any): number {
    return this.cotizacionUSD ? this.obtenerSubtotal(p) / this.cotizacionUSD : 0;
  }

  obtenerTotal(): number {
    return this.productos.reduce((acc, p) => acc + this.obtenerSubtotal(p), 0);
  }

  obtenerTotalUSD(): number {
    return this.cotizacionUSD ? this.obtenerTotal() / this.cotizacionUSD : 0;
  }

  confirmar() {
    const fx = this.cotizacionUSD || 0;

    const items: InvoiceItemPayload[] = this.productos.map((p: any) => {
      const subtotalArs = this.obtenerSubtotal(p);
      const precioUsd   = fx ? p.precio / fx : 0;
      const subtotalUsd = fx ? subtotalArs / fx : 0;

      return {
        producto_id: typeof p.id === 'number' ? p.id : null,
        producto_nombre: p.nombre,
        cantidad: p.cantidad,
        precio_unit_ars: this.round2(p.precio),
        subtotal_ars: this.round2(subtotalArs),
        precio_unit_usd: this.round2(precioUsd),
        subtotal_usd: this.round2(subtotalUsd),
      };
    });

    const payload: InvoicePayload = {
      fecha: new Date().toISOString(),
      cliente_id: null,
      cliente_nombre: 'Invitado',
      tipo_cambio: fx,
      total_ars: this.round2(this.obtenerTotal()),
      total_usd: this.round2(this.obtenerTotalUSD()),
      items
    };

    console.log('[FacturaPreview] Payload listo para confirmar:', payload);
    this.confirmarCompra.emit(payload);
  }
}
