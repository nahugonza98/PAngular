import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FiltroFacturaPipe } from '../pipes/filtro-factura.pipe'; 

interface Factura {
  id: number;
  fecha: string;
  total: number;
}

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,          
    FiltroFacturaPipe     
  ],
  templateUrl: './facturas.component.html',
  styleUrls: ['./facturas.component.css']
})
export class FacturasComponent implements OnInit {
  facturas: Factura[] = [];
  filtroFactura = ''; 

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Factura[]>('http://localhost:4000/facturas').subscribe({
      next: (res) => {
        this.facturas = res;
        console.log('📄 Facturas cargadas:', res);
      },
      error: (err) => {
        console.error('❌ Error al cargar facturas:', err);
      }
    });
  }
}
