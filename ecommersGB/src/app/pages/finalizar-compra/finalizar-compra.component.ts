import { Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../servicios/carrito.service';
import { FacturaService } from '../../servicios/factura.service';
import { FacturaPreviewComponent } from '../facturas-preview/factura-preview.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-finalizar-compra',
  standalone: true,
  imports: [CommonModule, FacturaPreviewComponent],
  templateUrl: './finalizar-compra.component.html',
  styleUrls: ['./finalizar-compra.component.css']
})
export class FinalizarCompraComponent implements OnInit {
  productosSeleccionados: any[] = [];

  constructor(
    private carritoService: CarritoService,
    private facturaService: FacturaService,
     private router: Router
  ) {}

  ngOnInit(): void {
    this.productosSeleccionados = this.carritoService.obtenerProductos();
  }

  confirmarCompra(): void {
    const factura = {
      productos: this.productosSeleccionados,
      fecha: new Date(),
    total: this.carritoService.obtenerTotalPrecio()
    };

    this.facturaService.guardarFactura(factura).subscribe({
      next: () => {
        this.carritoService.vaciarCarrito();
        this.productosSeleccionados = [];
        alert('✅ Compra finalizada con éxito');
        setTimeout(() => {
  this.router.navigate(['/']);
}, 2000);
      },
      error: (err) => {
        console.error('❌ Error al guardar la factura:', err);
        alert('❌ Hubo un error al guardar la factura');
      }
    });
  }
}
