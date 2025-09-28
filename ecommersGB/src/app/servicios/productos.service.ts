import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getDbReference, getNodeValue, listenToNode } from '../firebase.init';

export interface Producto {
  id: number;           // seguimos usando number para tu UI
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {

  /** Stream en tiempo real de /productos */
  obtenerProductos(): Observable<Producto[]> {
    return new Observable<Producto[]>((subscriber) => {
      let off: (() => void) | undefined;

      // snapshot inicial
      getNodeValue<Record<string, any>>('/productos')
        .then(obj => subscriber.next(this.mapColeccion(obj)))
        .catch(err => subscriber.error(err));

      // onValue
      listenToNode<Record<string, any>>('/productos', (obj) => {
        subscriber.next(this.mapColeccion(obj));
      })
      .then(fn => off = fn)
      .catch(err => subscriber.error(err));

      return () => off?.();
    });
  }

  /** Crear producto con id numérico incremental */
  async crearProducto(producto: Partial<Producto>): Promise<number> {
    const obj = await getNodeValue<Record<string, any>>('/productos');
    const ids = Object.keys(obj ?? {});
    const nums = ids.map(id => Number(id)).filter(n => !isNaN(n));
    const nextId = (nums.length ? Math.max(...nums) : 0) + 1;

    const refRoot = await getDbReference('/');
    const { update } = await import('firebase/database');

    const nuevo: Producto = {
      id: nextId,
      nombre: producto.nombre ?? '',
      descripcion: producto.descripcion ?? '',
      precio: Number(producto.precio ?? 0),
      stock: Number(producto.stock ?? 0),
      imagen: producto.imagen ?? ''
    };

    await update(refRoot, {
      [`productos/${nextId}`]: {
        nombre: nuevo.nombre,
        descripcion: nuevo.descripcion,
        precio: nuevo.precio,
        stock: nuevo.stock,
        imagen: nuevo.imagen
      }
    });

    return nextId;
  }

  /** Obtener uno por id */
  async obtenerProductoPorId(id: number): Promise<Producto | null> {
    const p = await getNodeValue<any>(`/productos/${id}`);
    if (!p) return null;
    return this.mapProducto(String(id), p);
  }

  /** Actualizar */
  async actualizarProducto(producto: Producto): Promise<void> {
    const ref = await getDbReference(`/productos/${producto.id}`);
    const { update } = await import('firebase/database');
    await update(ref, {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: Number(producto.precio ?? 0),
      stock: Number(producto.stock ?? 0),
      imagen: producto.imagen ?? ''
    });
  }

  /** Eliminar */
  async eliminarProducto(id: number): Promise<void> {
    const ref = await getDbReference(`/productos/${id}`);
    const { remove } = await import('firebase/database');
    await remove(ref);
  }

  // ---------- helpers ----------
  private mapColeccion(obj: Record<string, any> | null | undefined): Producto[] {
    return Object.entries(obj ?? {}).map(([id, p]) => this.mapProducto(id, p));
  }

  private mapProducto(id: string, p: any): Producto {
    return {
      id: Number(id),
      nombre: p?.nombre ?? '',
      descripcion: p?.descripcion ?? '',
      precio: Number(p?.precio ?? 0),
      stock: Number(p?.stock ?? 0),
      imagen: p?.imagen ?? ''
    };
  }
}
