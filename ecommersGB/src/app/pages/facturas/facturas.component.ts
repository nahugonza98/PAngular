import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FiltroFacturaPipe } from '../pipes/filtro-factura.pipe'; 
import { FacturaService } from '../../servicios/factura.service'; 

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
  descargandoCsv = false;
  constructor(private http: HttpClient,  private facturaService: FacturaService ) {}

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

  exportarCSV() {
  this.descargandoCsv = true;
  this.facturaService.descargarFacturasCSV().subscribe({
    next: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facturas-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    error: (err) => {
      console.error('❌ Error al exportar CSV:', err);
      alert('No se pudo generar el CSV.');
    },
    complete: () => (this.descargandoCsv = false),
  });
}











}
