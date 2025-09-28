import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CarritoService } from '../../servicios/carrito.service';
import { AuthService, AppUser } from '../../servicios/auth.service';
import { get, ref } from 'firebase/database';
import { getFirebase } from '../../firebase.init';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  public carritoService = inject(CarritoService);
  private router = inject(Router);
  private authService = inject(AuthService);

  usuarioActual: AppUser | null = null;
  mostrarCategorias = false;
  mostrarDropdown = false;
  mostrarMiniCarrito = false;

  async refrescarRolDesdeRTDB(): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    try {
      const raw = localStorage.getItem('usuarioActual');
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const uid = parsed?.uid;
      if (!uid) return;

      const { database } = await getFirebase();
      const snap = await get(ref(database, `users/${uid}`));
      if (!snap.exists()) return;

      const data = snap.val();
      const nuevoRol = data?.rol ?? 'user';

      const actualizado = {
        ...parsed,
        rol: nuevoRol
      };

      localStorage.setItem('usuarioActual', JSON.stringify(actualizado));
      this.usuarioActual = actualizado;

      // 🔥 Forzar actualización del observable para que el HTML se entere del cambio
      this.authService['usuarioSubject'].next(actualizado);
    } catch (err) {
      console.error('❌ Error al refrescar rol desde RTDB', err);
    }
  }

  ngOnInit(): void {
    // Escuchar cambios en el observable del usuario
    this.authService.usuario$.subscribe((usuario) => {
      this.usuarioActual = usuario;
    });

    // Rehidratar desde localStorage si el observable todavía no emitió
    if (!this.usuarioActual && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('usuarioActual');
        if (raw) {
          const parsed = JSON.parse(raw);
          this.usuarioActual = {
            ...parsed,
            role: parsed.role ?? 'user'
          };
        }
      } catch {
        this.usuarioActual = null;
      }
    }

    // Forzar relectura del rol desde Firebase
    this.refrescarRolDesdeRTDB();
  }

  get cantidadEnCarrito(): number {
    return this.carritoService.obtenerCantidadTotal();
  }

  toggleCategorias(): void {
    this.mostrarCategorias = !this.mostrarCategorias;
  }

  toggleMiniCarrito(): void {
    this.mostrarMiniCarrito = !this.mostrarMiniCarrito;
  }

  toggleDropdown(): void {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  sumarCantidad(producto: any): void {
    this.carritoService.agregarProducto(producto);
  }

  restarCantidad(producto: any): void {
    this.carritoService.restarProducto(producto);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.usuarioActual = null;

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('usuarioActual');
    }

    this.router.navigate(['/login']);
  }
}
