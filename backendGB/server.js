// server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productosRoutes = require('./routes/productos.routes');
const facturasRouter = require('./routes/facturas');        
const usuariosRouter = require('./routes/usuarios');
const loginRouter = require('./routes/login');
const reportesRouter = require('./routes/reportes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/productos', productosRoutes);
app.use('/facturas', facturasRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/login', loginRouter);
app.use('/reportes', reportesRouter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Backend funcionando correctamente');
});

// Levantar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
