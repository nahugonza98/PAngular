import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {

  // Carrito vacío por defecto
  private carrito: any[] = []; //

  constructor() { }

  // Devuelve el total de unidades en el carrito
  obtenerCantidadTotal(): number { //
    return this.carrito.reduce((total, item) => total + item.cantidad, 0); 
}
}
