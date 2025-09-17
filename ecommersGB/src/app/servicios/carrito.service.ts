import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carrito: any[] = [];

  constructor() {
    this.carrito = this.cargarCarritoDesdeLocalStorage();
  }

  obtenerCantidadTotal(): number {
    return this.carrito.reduce((total, item) => total + item.cantidad, 0);
  }

  agregarProducto(producto: any) {
    const itemExistente = this.carrito.find(p => p.id === producto.id);

    if (itemExistente) {
      itemExistente.cantidad += 1;
    } else {
      this.carrito.push({ ...producto, cantidad: 1 });
    }

    this.guardarCarritoEnLocalStorage();
  }

  modificarCantidad(idProducto: number, cambio: number) {
    const index = this.carrito.findIndex(p => p.id === idProducto);
    if (index !== -1) {
      this.carrito[index].cantidad += cambio;

      if (this.carrito[index].cantidad <= 0) {
        this.carrito.splice(index, 1);
      }

      this.guardarCarritoEnLocalStorage();
    }
  }

  restarProducto(producto: any) {
    const item = this.carrito.find(p => p.id === producto.id);
    if (item) {
      item.cantidad -= 1;
      if (item.cantidad <= 0) {
        this.carrito = this.carrito.filter(p => p.id !== producto.id);
      }
      this.guardarCarritoEnLocalStorage();
    }
  }

  obtenerProductos(): any[] {
    return this.carrito;
  }

  obtenerTotalPrecio(): number {
    return this.carrito.reduce((total, producto) => total + producto.precio * producto.cantidad, 0);
  }

  private guardarCarritoEnLocalStorage(): void {
    localStorage.setItem('carrito', JSON.stringify(this.carrito));
  }

  vaciarCarrito(): void {
  this.carrito = [];
  localStorage.removeItem('carrito');
}

  private cargarCarritoDesdeLocalStorage(): any[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const carritoGuardado = localStorage.getItem('carrito');
      return carritoGuardado ? JSON.parse(carritoGuardado) : [];
    } else {
      return [];
    }
  }
}
