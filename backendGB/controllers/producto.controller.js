const Producto = require('../models/producto.model');

// Crear producto
exports.crearProducto = async (req, res) => {
  const nuevoProducto = req.body;

  if (!nuevoProducto.nombre || !nuevoProducto.precio) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const id_insertado = await Producto.crear(nuevoProducto);
    console.log(req.body); // Confirmación
    res.status(201).json({
      mensaje: 'Producto creado correctamente',
      id_insertado
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error al crear producto' });
  }
};

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.obtenerTodos();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error al obtener productos' });
  }
};

// Obtener producto por ID
exports.obtenerProductoPorId = async (req, res) => {
  const id = req.params.id;

  try {
    const producto = await Producto.obtenerPorId(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error al obtener producto' });
  }
};

// Eliminar producto
exports.eliminarProducto = async (req, res) => {
  const id = req.params.id;

  try {
    const resultado = await Producto.eliminar(id);
    if (resultado === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error al eliminar producto' });
  }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
  const id = req.params.id;
  const datosActualizados = req.body;

  try {
    const resultado = await Producto.actualizar(id, datosActualizados);
    if (resultado === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Error al actualizar producto' });
  }
};
