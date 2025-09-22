import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
/* import { Observable } from 'rxjs'; */

@Injectable({
  providedIn: 'root'
})
export class FacturaService {
  private apiUrl = 'http://localhost:4000/facturas'; 

  constructor(private http: HttpClient) {}

  /* guardarFactura(factura: any): Observable<any> {
    return this.http.post(this.apiUrl, factura);
  } */

  guardarFactura(payload: any) {
    return this.http.post<{ invoice_id: number }>(`${this.apiUrl}`, payload);
  }
}
