import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { FacturaService, FacturaRTDB } from '../../servicios/factura.service';
import { FiltroNombrePipe } from '../../pages/pipes/filtro-nombre.pipe';
import { FiltroFacturaPipe } from '../../pages/pipes/filtro-factura.pipe';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule, FiltroFacturaPipe],
  templateUrl: './facturas.component.html',
  styleUrls: ['./facturas.component.css']
})
export class FacturasComponent implements OnInit, OnDestroy {

  facturasRaw: FacturaRTDB[] = [];
  facturas: Array<{
    id: string;
    fecha: Date | null;
    total: number;
    total_ars: number;
    total_usd: number | null;
    cliente_nombre: string;
  }> = [];

  filtroFactura = '';
  descargandoCsv = false;
  private sub?: Subscription;

  constructor(private facturasSrv: FacturaService) {}

  ngOnInit(): void {
    // Opción simple: traer todas las facturas
    this.sub = this.facturasSrv.obtenerFacturas$().subscribe((list) => {
      this.facturasRaw = list;
      this.facturas = list.map((f) => ({
        id: f.id,
        fecha: f.ts ? new Date(f.ts) : (f.fechaISO ? new Date(f.fechaISO) : null),
        total: f.totalARS,
        total_ars: f.totalARS,
        total_usd: f.totalUSD ?? null,
        cliente_nombre: f.cliente?.nombre ?? '—',
      }));
    });

    // Si querés probar por un día que seguro tiene datos:
    // this.sub = this.facturasSrv.obtenerFacturasPorDia$('2025-06-18').subscribe(...);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  exportarCSV() {
    this.descargandoCsv = true;
    try {
      const blob = this.facturasSrv.generarCSVDesdeFacturas(this.facturasRaw);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facturas-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      this.descargandoCsv = false;
    }
  }
}
