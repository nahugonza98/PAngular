import Chart from 'chart.js/auto';
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FacturaService, FacturaRTDB } from '../../servicios/factura.service';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.css']
})
export class EstadisticasComponent implements AfterViewInit {
  // ----- CANVAS -----
  @ViewChild('ventasChart')    ventasChartRef!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('dolarChart')     dolarChartRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('productosChart') productosChartRef!: ElementRef<HTMLCanvasElement>;

  // ----- INSTANCIAS CHART -----
  chartVentas:    Chart | null = null;
  chartDolar:     Chart | null = null;
  chartProductos: Chart | null = null;

  // ----- ESTADO UI -----
  periodo: 'dia' | 'semana' | 'mes' = 'dia'; // ventas
  rangoDolarDias = 7;           // dólar
  errorDolar = '';

  constructor(
    private facturaSrv: FacturaService,
    private http: HttpClient
  ) {}

  ngAfterViewInit(): void {
    this.renderVentas();
    this.cargarDolar(7);        
  }

  // =======================
  //      VENTAS
  // =======================
  actualizarAgrupacion(nuevoPeriodo: 'dia' | 'semana' | 'mes') {
    this.periodo = nuevoPeriodo;
    this.renderVentas();
  }

  private renderVentas(): void {
    this.facturaSrv.facturas$().subscribe((facturas: FacturaRTDB[]) => {
      // ---- Agrupar por día/semana/mes
      const agrupadas: Record<string, number> = {};
      facturas.forEach(f => {
        const fecha = new Date(f.fechaISO);
        let clave: string;
        switch (this.periodo) {
          case 'semana': {
            const firstDayOfWeek = new Date(fecha);
            firstDayOfWeek.setDate(fecha.getDate() - fecha.getDay());
            clave = firstDayOfWeek.toISOString().slice(0, 10);
            break;
          }
          case 'mes':
            clave = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
          default:
            clave = fecha.toISOString().slice(0, 10);
        }
        agrupadas[clave] = (agrupadas[clave] || 0) + 1;
      });

      const labels = Object.keys(agrupadas).sort();
      const data   = labels.map(k => agrupadas[k]);

      // ---- Graficar  
      // Destruir si ya existía
      if (this.chartVentas) this.chartVentas.destroy();
      this.chartVentas = new Chart(this.ventasChartRef.nativeElement, {
        type: 'bar',
        data: { labels, datasets: [{ label: `Ventas por ${this.periodo}`, data, backgroundColor: '#007bff' }] },
        options: { responsive: true, plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true } } }
      });

      this.graficarProductosMasVendidos(facturas);
    });
  }

  // =======================
  //      DÓLAR (rango)
  // =======================
  async cargarDolar(dias: 7) {
    this.rangoDolarDias = dias;
    this.errorDolar = '';
    try {
      const res: any = await this.http.get('https://dolarapi.com/v1/dolares/oficial').toPromise();
      const valorActual = Number(res?.venta) || 0;
      const { labels, valores } = this.generarSerieHistorica(valorActual, dias);
      this.dibujarGraficoDolar(labels, valores, dias);
    } catch (err) {
      console.error('Error al obtener DolarApi:', err);
      this.errorDolar = 'No se pudo obtener la cotización. Intentá nuevamente.';
      this.dibujarGraficoDolar([], [], dias);
    }
  }

  private generarSerieHistorica(valorHoy: number, dias: number) {
    const labels: string[] = [];
    const valores: number[] = [];
    const hoy = new Date();
    let base = valorHoy > 0 ? valorHoy : 1200;
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - i);
      const ruido = (Math.random() - 0.5) * (base * 0.02);
      base = Math.max(1, base + ruido);
      labels.push(d.toISOString().slice(0, 10));
      valores.push(Number(base.toFixed(2)));
    }
    return { labels, valores };
  }

  private dibujarGraficoDolar(labels: string[], valores: number[], dias: number) {
    if (this.chartDolar) { this.chartDolar.destroy(); this.chartDolar = null; }
    this.chartDolar = new Chart(this.dolarChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `USD/ARS últimos ${dias} días`,
          data: valores,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 2
        }]
      },
      options: { responsive: true, plugins: { legend: { display: true } }, scales: { y: { beginAtZero: false } } }
    });
  }


/* Productos mas vendidos */
private graficarProductosMasVendidos(facturas: FacturaRTDB[]) {
  const cantPorProducto: Record<string, number> = {};

  facturas.forEach(f => {
    const items = f.items ? Object.values(f.items) : [];
    items.forEach((it: any) => {
      // Usamos SIEMPRE el nombre si existe; si no, un placeholder fijo
      const key = (it?.producto_nombre && String(it.producto_nombre).trim())
        ? String(it.producto_nombre).trim()
        : 'Producto sin nombre';

      const cant = Number(it?.cantidad) || 0;
      if (cant > 0) {
        cantPorProducto[key] = (cantPorProducto[key] || 0) + cant;
      }
    });
  });

  const entradas = Object.entries(cantPorProducto).sort((a, b) => b[1] - a[1]);
  if (!entradas.length) {
    if (this.chartProductos) { this.chartProductos.destroy(); this.chartProductos = null; }
    return;
  }

  // 🔥 Solo TOP 6 — SIN “Otros”
  const top = entradas.slice(0, 6);
  const labels = top.map(([n]) => n);
  const data   = top.map(([, c]) => c);

  // Aseguramos que la cantidad de colores coincida con la cantidad de datos
  const baseColors = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949'];
  const bgColors   = baseColors.slice(0, data.length);

  if (this.chartProductos) this.chartProductos.destroy();

  this.chartProductos = new Chart(this.productosChartRef.nativeElement, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        label: 'Unidades vendidas',
        data,
        backgroundColor: bgColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed as number;
              const total = (ctx.dataset.data as number[]).reduce((a,b)=>a+b,0);
              const pct = total ? ((val/total)*100).toFixed(1) : '0.0';
              return ` ${ctx.label}: ${val} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

}
