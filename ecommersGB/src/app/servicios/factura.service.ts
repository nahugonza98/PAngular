import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
/* import { Observable } from 'rxjs'; */

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private apiUrl = 'http://localhost:4000/facturas'; 

  constructor(private http: HttpClient) {}

// Descarga el CSV de facturas (fecha, cliente, productos, total)
descargarFacturasCSV() {
  return this.http.get('http://localhost:4000/reportes/facturas.csv', {
    responseType: 'blob'
  });
}

  guardarFactura(payload: any) {
    return this.http.post<{ invoice_id: number }>(`${this.apiUrl}`, payload);
  }
}
