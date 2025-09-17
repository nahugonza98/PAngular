import { Pipe, PipeTransform } from '@angular/core';
import { Producto } from '../../servicios/productos.service';

@Pipe({
  name: 'filtroNombre',
  standalone: true
})
export class FiltroNombrePipe implements PipeTransform {
  transform(productos: Producto[], texto: string): Producto[] {
    if (!texto) return productos;
    const textoLower = texto.toLowerCase();
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(textoLower)
    );
  }
}
