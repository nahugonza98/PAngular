import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CarritoService } from '../../servicios/carrito.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  public carritoService = inject(CarritoService);
  private router = inject(Router);

  mostrarCategorias = false;
  mostrarDropdown = false;
  mostrarCarrito = false;
  mostrarMiniCarrito = false;
  usuarioActual: any = null;

  ngOnInit() {
  if (typeof window !== 'undefined' && localStorage.getItem('usuarioActual')) {
    this.usuarioActual = JSON.parse(localStorage.getItem('usuarioActual')!);
  } else {
    this.usuarioActual = null;
  }
}


  get cantidadEnCarrito(): number {
    return this.carritoService.obtenerCantidadTotal();
  }

  toggleCategorias() {
    this.mostrarCategorias = !this.mostrarCategorias;
  }

  toggleMiniCarrito() {
    this.mostrarMiniCarrito = !this.mostrarMiniCarrito;
  }

  toggleDropdown() {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  sumarCantidad(producto: any) {
    this.carritoService.agregarProducto(producto);
  }

  restarCantidad(producto: any) {
    this.carritoService.restarProducto(producto);
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    this.usuarioActual = null;
    this.router.navigate(['/login']);
  }
}
