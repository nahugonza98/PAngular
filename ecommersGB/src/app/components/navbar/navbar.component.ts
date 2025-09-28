import { Component, inject, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CarritoService } from '../../servicios/carrito.service';
import { AuthService, AppUser } from '../../servicios/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements DoCheck {
  public carritoService = inject(CarritoService);
  private router = inject(Router);
  private authService = inject(AuthService);

  usuarioActual: AppUser | null = null;
  mostrarCategorias = false;
  mostrarDropdown = false;
  mostrarMiniCarrito = false;

  ngDoCheck(): void {
    const userEnMemoria = this.authService.getUsuarioActual();

    // Solo actualiza si hubo cambio
    if (
      userEnMemoria &&
      (!this.usuarioActual || this.usuarioActual?.email !== userEnMemoria.email)
    ) {
      this.usuarioActual = userEnMemoria;
    }

    // Si no hay nada, revisa localStorage
    if (!this.usuarioActual && typeof localStorage !== 'undefined') {
      const local = localStorage.getItem('usuarioActual');
      if (local) {
        this.usuarioActual = JSON.parse(local);
      }
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
    this.authService.logout();
    this.usuarioActual = null;
    this.router.navigate(['/login']);
  }
}
