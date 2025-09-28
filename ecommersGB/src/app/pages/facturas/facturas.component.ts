import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';

import { FacturaService, FacturaRTDB } from '../../servicios/factura.service';
import { FiltroFacturaPipe } from '../../pages/pipes/filtro-factura.pipe';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, FiltroFacturaPipe, RouterModule],
  templateUrl: './facturas.component.html',
  styleUrls: ['./facturas.component.css']
})
export class FacturasComponent implements OnInit, OnDestroy {
  filtroFactura = '';
  facturas: FacturaRTDB[] = [];
  sub?: Subscription;
  descargandoCsv = false;

  constructor(private facturasSrv: FacturaService) {}

  ngOnInit(): void {
    // Suscripción al observable del servicio
    this.sub = this.facturasSrv.facturas$().subscribe((data) => {
      // Asignamos directamente a facturas (ya no facturasRaw)
      this.facturas = data;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }


  // Exportacion CSV
  //Genera factura, te permite descargar y luego limpia 
  exportarCSV(): void {
    if (!this.facturas?.length) return;
    this.descargandoCsv = true;
    try {
      const blob = this.facturasSrv.generarCSVDesdeFacturas(this.facturas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facturas-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      this.descargandoCsv = false;
    }
  }
}
