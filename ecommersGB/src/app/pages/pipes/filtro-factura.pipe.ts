import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroFactura',
  standalone: true
})
export class FiltroFacturaPipe implements PipeTransform {
  transform(facturas: any[], texto: string): any[] {
    if (!texto) return facturas;

    return facturas.filter(f =>
      f.id.toString().includes(texto.trim())
    );
  }
}

