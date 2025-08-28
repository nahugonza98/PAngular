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
  styleUrls: ['./editar-producto.component.css'],

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productosService: ProductosService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productosService.obtenerProductoPorId(id).subscribe((data) => {
      this.producto = data;
    });
  }

  guardarCambios() {
    this.productosService.actualizarProducto(this.producto).subscribe({
      next: () => {
        this.mensaje = 'Producto actualizado correctamente';
        setTimeout(() => {
          this.mensaje = '';
          this.router.navigate(['/productos']);
        }, 2000);
      },
      error: (err) => {
        this.mensaje = 'Error al actualizar';
        console.error(err);
      }
    });
  }
}
