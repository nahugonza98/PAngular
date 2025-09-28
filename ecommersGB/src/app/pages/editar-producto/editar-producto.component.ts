import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto, ProductosService } from '../../servicios/productos.service';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-producto.component.html',
  styleUrls: ['./editar-producto.component.css']
})
export class EditarProductoComponent implements OnInit {
  producto: Producto = {
    id: 0,
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    imagen: ''
  };

  mensaje = '';
  cargando = false;
  guardando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productosService: ProductosService
  ) {}

  async ngOnInit(): Promise<void> {
    this.cargando = true;
    const id = Number(this.route.snapshot.paramMap.get('id'));

    try {
      const data = await this.productosService.obtenerProductoPorId(id);
      if (data) {
        this.producto = data;
      } else {
        this.mensaje = 'Producto no encontrado';
      }
    } catch (error) {
      console.error('Error al cargar producto:', error);
      this.mensaje = 'Error al cargar el producto';
    } finally {
      this.cargando = false;
    }
  }

  async guardarCambios(): Promise<void> {
    this.guardando = true;
    this.mensaje = '';

    try {
      await this.productosService.actualizarProducto(this.producto);
      this.mensaje = 'Producto actualizado correctamente';

      setTimeout(() => {
        this.mensaje = '';
        this.router.navigate(['/productos']);
      }, 2000);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      this.mensaje = 'Error al actualizar el producto';
    } finally {
      this.guardando = false;
    }
  }
}
