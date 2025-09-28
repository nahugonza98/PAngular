import { Injectable } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { getDbReference, getNodeValue, listenToNode } from '../firebase.init';

export type EstadoFactura = 'PAGADA' | 'ANULADA';

export interface FacturaItem {
  producto_id: number;
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
  totalUSD?: number | null;
  tipo_cambio?: number | null;
  estado: EstadoFactura;
  cliente?: { id?: number | null; nombre?: string | null };
  items?: Record<string, FacturaItem>;
}

@Injectable({ providedIn: 'root' })
export class FacturaService {

  /** TODAS las facturas (si la base crece mucho, usá por día) */
  obtenerFacturas$(): Observable<FacturaRTDB[]> {
    return new Observable<FacturaRTDB[]>((subscriber) => {
      let off: (() => void) | undefined;

      getNodeValue<Record<string, any>>('/facturas')
        .then(obj => subscriber.next(this.mapColeccion(obj)))
        .catch(err => subscriber.error(err));

      listenToNode<Record<string, any>>('/facturas', (obj) => {
        subscriber.next(this.mapColeccion(obj));
      })
        .then(fn => off = fn)
        .catch(err => subscriber.error(err));

      return () => off?.();
    });
  }

  /** Facturas por fecha (índice /facturasPorFecha/{YYYY-MM-DD}) */
  obtenerFacturasPorDia$(diaYYYYMMDD: string): Observable<FacturaRTDB[]> {
    const idx = `/facturasPorFecha/${diaYYYYMMDD}`;

    const ids$ = new Observable<string[]>((subscriber) => {
      let off: (() => void) | undefined;

      getNodeValue<Record<string, true>>(idx)
        .then(o => subscriber.next(Object.keys(o ?? {})))
        .catch(err => subscriber.error(err));

      listenToNode<Record<string, true>>(idx, (o) =>
        subscriber.next(Object.keys(o ?? {}))
      ).then(fn => off = fn)
       .catch(err => subscriber.error(err));

      return () => off?.();
    });

    return ids$.pipe(
      switchMap(ids => {
        if (!ids?.length) return of<FacturaRTDB[]>([]);
        const perId$ = ids.map(id => this.getFactura$(id));
        return combineLatest(perId$);
      }),
      map(list => list.sort((a,b) => (b.ts ?? 0) - (a.ts ?? 0)))
    );
  }

  /** Una factura individual */
  getFactura$(id: string): Observable<FacturaRTDB> {
    const path = `/facturas/${id}`;
    return new Observable<FacturaRTDB>((subscriber) => {
      let off: (() => void) | undefined;

      getNodeValue<any>(path)
        .then(f => subscriber.next(this.mapFactura(id, f)))
        .catch(err => subscriber.error(err));

      listenToNode<any>(path, (f) => subscriber.next(this.mapFactura(id, f)))
        .then(fn => off = fn)
        .catch(err => subscriber.error(err));

      return () => off?.();
    });
  }


  // ---------- CREAR FACTURA EN RTDB (fan-out) ----------
async guardarFacturaEnRTDB(payload: {
  totalARS: number;
  estado: 'PAGADA' | 'ANULADA';
  items: Array<{
    producto_id: number;
    producto_nombre?: string | null;
    cantidad: number;
    precio_unitario: number;
    subtotal_ars: number | null;
  }>;
  tipo_cambio?: number | null;
  totalUSD?: number | null;
  cliente?: { id?: number | null; nombre?: string | null };
  fecha?: Date;
}): Promise<string> {
  const fecha = payload.fecha ?? new Date();
  const ts = fecha.getTime();
  const fechaISO = fecha.toISOString();
  const yyyyMmDd = fechaISO.slice(0, 10); // YYYY-MM-DD

  // id simple (timestamp + random). Si preferís pushId lo cambiamos.
  const rid = Math.random().toString(36).slice(2, 8);
  const id = `${ts}-${rid}`;

  // array -> objeto {1:{...}, 2:{...}}
  const itemsObj: Record<string, any> = {};
  payload.items.forEach((it, idx) => (itemsObj[String(idx + 1)] = it));

  const facturaData = {
    ts,
    fechaISO,
    totalARS: payload.totalARS,
    totalUSD: payload.totalUSD ?? null,
    tipo_cambio: payload.tipo_cambio ?? null,
    estado: payload.estado,
    cliente: payload.cliente,
    items: itemsObj,
  };

  const refRoot = await getDbReference('/');
  const { update } = await import('firebase/database');

  await update(refRoot, {
    [`facturas/${id}`]: facturaData,
    [`facturasPorFecha/${yyyyMmDd}/${id}`]: true,
    [`facturasPorEstado/${payload.estado}/${id}`]: true,
  });

  return id;
}

  /** CSV local (sin backend) */
  generarCSVDesdeFacturas(facturas: FacturaRTDB[]): Blob {
    const headers = [
      'id','fechaISO','totalARS','estado','cliente_nombre','items_cantidad','items_detalle'
    ];
    const rows = facturas.map(f => {
      const itemsArr = Object.values(f.items ?? {});
      const detalle = itemsArr
        .map(it => `${it.producto_nombre ?? ('ID ' + it.producto_id)} x${it.cantidad} @${it.precio_unitario}`)
        .join(' | ');
      return [
        f.id, f.fechaISO, f.totalARS, f.estado, f.cliente?.nombre ?? '', itemsArr.length, detalle
      ];
    });

    const csv = [headers, ...rows]
      .map(cols => cols.map(v => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;
      }).join(','))
      .join('\n');

    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  // ---- helpers ----
  private mapColeccion(obj: Record<string, any> | null | undefined): FacturaRTDB[] {
    const arr = Object.entries(obj ?? {}).map(([id, f]) => this.mapFactura(id, f));
    return arr.sort((a,b) => (b.ts ?? 0) - (a.ts ?? 0));
  }
  private mapFactura(id: string, f: any): FacturaRTDB {
    return {
      id,
      ts: Number(f?.ts ?? 0),
      fechaISO: String(f?.fechaISO ?? ''),
      totalARS: Number(f?.totalARS ?? 0),
      totalUSD: f?.totalUSD ?? null,
      tipo_cambio: f?.tipo_cambio ?? null,
      estado: (f?.estado as any) ?? 'PAGADA',
      cliente: f?.cliente ? { id: f.cliente.id ?? null, nombre: f.cliente.nombre ?? null } : undefined,
      items: f?.items ?? undefined
    };
  }
}
