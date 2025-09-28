// src/app/servicios/factura.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  getDatabase,
  ref,
  onValue,
  off,
  get,
  set,
  update,
  DataSnapshot,
} from 'firebase/database';
import { AuthService } from './auth.service';
import { getFirebase } from '../firebase.init';

export type EstadoFactura = 'PAGADA' | 'ANULADA';

export interface FacturaItem {
  producto_id: number | string;
  producto_nombre?: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal_ars: number | null;
}

export interface FacturaRTDB {
  id: string;
  ts: number;
  fechaISO: string;
  totalARS: number;
  totalUSD: number | null;
  tipo_cambio: number | null;
  estado: EstadoFactura;
  userId?: string | null;
  cliente_email?: string | null;
  cliente_nombre?: string | null;
  items?: FacturaItem[];
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private readonly ROOT = 'facturas';

  constructor(private auth: AuthService) {}

  /** Observa todas las facturas (ordenadas por ts desc) */
  facturas$(): Observable<FacturaRTDB[]> {
    return new Observable<FacturaRTDB[]>((sub) => {
      // Traemos la instancia de RTDB y nos suscribimos con onValue
      getFirebase()
        .then(({ database }) => {
          const r = ref(database, this.ROOT);

          const handler = (snap: DataSnapshot) => {
            const val = (snap.val() || {}) as Record<string, any>;
            const arr = Object.entries(val).map(([id, f]) => this.mapFactura(id, f));
            sub.next(arr.sort((a, b) => b.ts - a.ts));
          };

          onValue(r, handler, (err) => sub.error(err));

          // Teardown de la suscripción
          sub.add(() => off(r, 'value', handler));
        })
        .catch((err) => sub.error(err));
    });
  }

  /** Lee todas las facturas una vez */
  async facturasOnce(): Promise<FacturaRTDB[]> {
    const { database } = await getFirebase();
    const r = ref(database, this.ROOT);
    const snap = await get(r);
    const val = (snap.val() || {}) as Record<string, any>;
    const arr = Object.entries(val).map(([id, f]) => this.mapFactura(id, f));
    return arr.sort((a, b) => b.ts - a.ts);
  }

  /** Crea una factura tomando SIEMPRE el usuario actual */
  async crearFactura(payload: {
    items: FacturaItem[];
    totalARS: number;
    totalUSD: number | null;
    tipo_cambio: number | null;
  }): Promise<string> {
    const now = Date.now();
    const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;

    // 🔄 Esperar a que se resuelva el usuario actual
    const usuario = await this.auth.getUsuarioActual();

    const userId = usuario?.uid ?? null;
    const cliente_email = usuario?.email ?? null;
    const cliente_nombre = usuario?.displayName ?? usuario?.email ?? null;

    const factura: Omit<FacturaRTDB, 'id'> = {
      ts: now,
      fechaISO: new Date(now).toISOString(),
      totalARS: payload.totalARS,
      totalUSD: payload.totalUSD,
      tipo_cambio: payload.tipo_cambio,
      estado: 'PAGADA',
      userId,
      cliente_email,
      cliente_nombre,
      items: payload.items ?? [],
    };

    const { database } = await getFirebase();
    await set(ref(database, `${this.ROOT}/${id}`), factura);
    return id;
  }

  /** Actualiza el estado de una factura */
  async actualizarEstado(id: string, estado: EstadoFactura): Promise<void> {
    const { database } = await getFirebase();
    await update(ref(database, `${this.ROOT}/${id}`), { estado });
  }

  /** CSV simple para exportar */
  generarCSVDesdeFacturas(facturas: FacturaRTDB[]): Blob {

    //Columna del CSV
    const headers = [
      'ID',
      'Fecha',
      'Total_ARS',
      'Total_USD',
      'Tipo_Cambio',
      'Estado',
      'Cliente_Email',
      'Cliente_Nombre',
      'Detalle',
    ];

    // Cada fila es un array de strings/valores
    const rows = facturas.map((f) => [
      f.id,
      this.formatFechaLocal(f.ts),
      this.formatMoneyARS(f.totalARS),
      f.totalUSD != null ? this.formatMoneyUSD(f.totalUSD) : '',
      f.tipo_cambio ?? '',
      f.estado,
      f.cliente_email ?? '',
      f.cliente_nombre ?? '',
      this.buildDetalle(f), // Detalle armado a partir de items
    ]);

    // Construcción del CSV
    // - Escapando valores que lo requieran (", \n, ,)
    // - Uniendo con comas
    // - Uniendo filas con saltos de línea
    // - Blob con tipo text/csv
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => this.csvEscape(String(v ?? ''))).join(','))
      .join('\n');

    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  // ---------- helpers ----------
  private csvEscape(s: string): string {
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  private formatFechaLocal(ts: number): string {
    try { return new Date(ts).toLocaleString(); } catch { return ''; }
  }

  private formatMoneyARS(n: number): string {
    try {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(n);
    } catch { return String(n); }
  }

  private formatMoneyUSD(n: number): string {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
    } catch { return String(n); }
  }

  private mapFactura(id: string, f: any): FacturaRTDB {
    return {
      id,
      ts: Number(f?.ts ?? 0),
      fechaISO: String(f?.fechaISO ?? ''),
      totalARS: Number(f?.totalARS ?? 0),
      totalUSD: f?.totalUSD ?? null,
      tipo_cambio: f?.tipo_cambio ?? null,
      estado: (f?.estado as EstadoFactura) ?? 'PAGADA',
      userId: f?.userId ?? null,
      cliente_email: f?.cliente_email ?? null,
      cliente_nombre: f?.cliente_nombre ?? null,
      items: f?.items ?? undefined,
    };
  }

  /** Arma el texto "Detalle" a partir de los items de la factura */
  private buildDetalle(f: FacturaRTDB): string {
    const items = Array.isArray(f?.items) ? f.items : [];
    if (!items.length) return '';

    const fmt = (n: any) => {
      const x = Number(n);
      return isNaN(x) ? '' : x.toFixed(2);
    };

    // FacturaItem: producto_nombre, cantidad, precio_unitario, subtotal_ars
    return items
      .map((it) => {
        const nombre = it.producto_nombre ?? '(sin nombre)';
        const cantidad = Number(it.cantidad ?? 1);
        const unit = Number(it.precio_unitario ?? 0);
        const subtotal =
          it.subtotal_ars != null ? Number(it.subtotal_ars) : unit * (isNaN(cantidad) ? 0 : cantidad);
        const subTxt = isNaN(subtotal) ? '' : subtotal.toFixed(2);

        return `${nombre} x${isNaN(cantidad) ? '' : cantidad} @${fmt(unit)} = ${subTxt}`;
      })
      .join(' | ');
  }
}
