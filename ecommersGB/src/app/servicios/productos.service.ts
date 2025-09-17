import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://localhost:4000/api/productos';

  constructor(private http: HttpClient) {}

  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  crearProducto(producto: Partial<Producto>): Observable<any> {
  return this.http.post(this.apiUrl, producto);
}


obtenerProductoPorId(id: number): Observable<Producto> {
  return this.http.get<Producto>(`${this.apiUrl}/${id}`);
}

actualizarProducto(producto: Producto): Observable<any> {
  return this.http.put(`${this.apiUrl}/${producto.id}`, producto);
}

eliminarProducto(id: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${id}`);
}


}
