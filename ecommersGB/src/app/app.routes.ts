// app.routes.ts
import { Routes } from '@angular/router';
import { ProductosComponent } from './components/productos/productos.component';
import { CarritoComponent } from './components/carrito/carrito.component';
import { AltaProductoComponent } from './pages/alta-producto/alta-producto.component';
import { EditarProductoComponent } from './pages/editar-producto/editar-producto.component';
import { FacturasComponent } from './pages/facturas/facturas.component';
import { FinalizarCompraComponent } from './pages/finalizar-compra/finalizar-compra.component';
import { IngresarProductoComponent } from './pages/ingresar-producto/ingresar-producto.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { LoginComponent } from './pages/login/login.component';
import { ChatComponent } from './components/chat/chat.component';

export const routes: Routes = [
  { path: '', redirectTo: 'productos', pathMatch: 'full' },
  { path: 'productos', component: ProductosComponent },
  { path: 'alta-producto', component: AltaProductoComponent },
  { path: 'editar-producto/:id', component: EditarProductoComponent },
  { path: 'carrito', component: CarritoComponent },
  { path: 'finalizar-compra', component: FinalizarCompraComponent },
  { path: 'ingresar-producto', component: IngresarProductoComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'facturas', component: FacturasComponent },
  { path: 'login', component: LoginComponent },
  { path: 'chat', component: ChatComponent }




];



