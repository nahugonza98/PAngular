import { Injectable } from '@angular/core';

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private productos: Producto[] = [
    { id: 1, nombre: 'Mouse inalámbrico', precio: 3500, stock: 15 },
    { id: 2, nombre: 'Teclado mecánico', precio: 8500, stock: 10 },
    { id: 3, nombre: 'Monitor 24"', precio: 45000, stock: 5 }
  ];

  obtenerProductos(): Producto[] {
    return this.productos;
  }
}
