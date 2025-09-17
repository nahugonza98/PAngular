// Creación de Modelo
// El modelo habla con la DB y pide la query

const db = require('../config/db');

const Producto = {
  // Crear producto
  crear: async (nuevoProducto) => {
    const sql = 'INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES (?, ?, ?, ?, ?)';
    const valores = [
      nuevoProducto.nombre,
      nuevoProducto.descripcion,
      nuevoProducto.precio,
      nuevoProducto.stock,
      nuevoProducto.imagen
    ];
    const [result] = await db.query(sql, valores);
    return result.insertId; // opcional: devolver el ID del nuevo producto
  },

  // Obtener todos los productos
  obtenerTodos: async () => {
    const [rows] = await db.query('SELECT * FROM productos');
    return rows;
  },

  // Obtener producto por ID
  obtenerPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
    return rows[0]; // si solo esperás uno
  },

  // Eliminar producto por ID
  eliminar: async (id) => {
    const [result] = await db.query('DELETE FROM productos WHERE id = ?', [id]);
    return result.affectedRows;
  },

  // Actualizar producto
  actualizar: async (id, datosActualizados) => {
    const sql = `
      UPDATE productos
      SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen = ?
      WHERE id = ?
    `;
    const valores = [
      datosActualizados.nombre,
      datosActualizados.descripcion,
      datosActualizados.precio,
      datosActualizados.stock,
      datosActualizados.imagen,
      id
    ];
    const [result] = await db.query(sql, valores);
    return result.affectedRows;
  }
};

module.exports = Producto;
