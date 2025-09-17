import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-factura-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-preview.component.html',
  styleUrls: ['./factura-preview.component.css']
})
export class FacturaPreviewComponent implements OnInit {
  @Output() confirmarCompra = new EventEmitter<void>();
  @Input() productos: any[] = [];
  cotizacionUSD: number = 0;

  constructor(private http: HttpClient) {}

 
  ngOnInit(): void {
    
    this.http.get<any[]>('/bcra-api/usd', {
      headers: {
        Authorization: 'BEARER eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODE3MzIwOTcsInR5cGUiOiJleHRlcm5hbCIsInVzZXIiOiJuYWh1ZWwuc2ViYXN0aWFuLmdvbnphbGV6MTk4QGdtYWlsLmNvbSJ9.MQn_CwdunCvddms6QYgNLGO_yC6MXaBmQhRhniJtoR2NcEdSAt3cWwVUYV_DWOE2rjP_x2i5j6Zz4S6ZpU6ejA'
      }
    }).subscribe({
      next: (res) => {
        console.table(res.slice(-5));
        const ultima = res[res.length - 1];
        this.cotizacionUSD = ultima.v;
      },
      error: (err) => {
        console.error('❌ Error al obtener cotización BCRA:', err);
      }
    });
  } 




   confirmar() {
    this.confirmarCompra.emit();
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
}
