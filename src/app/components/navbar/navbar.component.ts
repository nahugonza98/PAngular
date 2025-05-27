import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarritoService } from '../../servicios/carrito.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private carritoService = inject(CarritoService);

  // ✔ Esto es lo que estás agregando para el menú desplegable
  mostrarCategorias = false; // ← NUEVO

  toggleCategorias() {       // ← NUEVO
    this.mostrarCategorias = !this.mostrarCategorias;
  }

  // Carrito
  mostrarCarrito = false;

  get cantidadEnCarrito(): number {
    return this.carritoService.obtenerCantidadTotal();
  }
}
