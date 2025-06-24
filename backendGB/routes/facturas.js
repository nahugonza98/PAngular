const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// Ruta para registrar una factura
router.post('/', async (req, res) => {
  console.log('📦 Recibí esto:', req.body); // Debug del request

  const { productos, total, fecha } = req.body;

  // Validación básica
  if (!productos || productos.length === 0 || !total || !fecha) {
    return res.status(400).json({ error: 'Datos incompletos para generar la factura' });
  }

  try {
    // Insertar en la tabla facturas
    const [facturaResult] = await db.execute(
      'INSERT INTO facturas (fecha, total) VALUES (?, ?)',
      [fecha, total]
    );

    const facturaId = facturaResult.insertId;

    // Insertar detalles de la factura
    for (let item of productos) {
      await db.execute(
        `INSERT INTO factura_detalle 
         (factura_id, producto_id, cantidad, precio_unitario) 
         VALUES (?, ?, ?, ?)`,
        [facturaId, item.id, item.cantidad, Number(item.precio)]
      );
    }

    // Respuesta exitosa
    res.status(201).json({ success: true, facturaId });

  } catch (err) {
    console.error('🔥 Error al insertar la factura o sus detalles:', err);
    res.status(500).json({ error: 'Error al guardar la factura' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [facturas] = await db.query(`
      SELECT f.id, f.fecha, f.total
      FROM facturas f
      ORDER BY f.fecha DESC
    `);

    res.json(facturas);
  } catch (err) {
    console.error('🔥 Error al obtener facturas:', err);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
});


module.exports = router;
