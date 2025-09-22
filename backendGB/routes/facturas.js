// backendGB/routes/facturas.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // mysql2/promise pool

// POST /facturas → inserta factura + items (transacción)
router.post('/', async (req, res) => {
  const p = req.body;
  console.log('📦 Recibí payload:', JSON.stringify(p, null, 2));

  const toNum  = (x) => (x === null || x === undefined ? null : Number(x));
  const isNum  = (x) => x !== null && Number.isFinite(x);

  const fecha         = p.fecha || new Date().toISOString();
  const clienteId     = p.cliente_id ?? null;
  const clienteNombre = p.cliente_nombre ?? null;
  const fx            = toNum(p.tipo_cambio);

  // total (ARS) puede venir como total_ars (nuevo) o total (viejo)
  let totalArs = toNum(p.total_ars);
  if (!isNum(totalArs)) totalArs = toNum(p.total);

  // si todavía no está, lo calculamos desde items
  if (!isNum(totalArs) && Array.isArray(p.items)) {
    totalArs = p.items.reduce((acc, it) => {
      const cant   = toNum(it.cantidad) || 0;
      const precio = toNum(it.precio_unit_ars) || 0;
      const sub    = toNum(it.subtotal_ars);
      return acc + (isNum(sub) ? sub : precio * cant);
    }, 0);
    totalArs = Number(totalArs.toFixed(2));
  }

  const totalUsd = isNum(toNum(p.total_usd))
    ? toNum(p.total_usd)
    : (isNum(totalArs) && isNum(fx) ? Number((totalArs / fx).toFixed(2)) : null);

  // Validaciones
  if (!Array.isArray(p.items) || p.items.length === 0) {
    return res.status(400).json({ message: 'payload inválido: items vacío' });
  }
  if (!isNum(fx) || fx <= 0) {
    return res.status(400).json({ message: 'payload inválido: tipo_cambio requerido' });
  }
  if (!isNum(totalArs)) {
    return res.status(400).json({ message: 'payload inválido: total_ars/total requerido' });
  }
  if (p.items.some(it => !isNum(toNum(it.producto_id)))) {
    return res.status(400).json({ message: 'Cada ítem debe tener producto_id válido' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // FACTURA (columna `total` es ARS)
    console.log('→ facturas INSERT:', [fecha, clienteId, clienteNombre, totalArs, totalUsd, fx]);
    const [r] = await conn.query(
      `INSERT INTO facturas (fecha, cliente_id, cliente_nombre, total, total_usd, tipo_cambio, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'PAGADA')`,
      [fecha, clienteId, clienteNombre, totalArs, totalUsd, fx]
    );
    const facturaId = r.insertId;

    // DETALLE (NO mandes subtotal_ars: la BD lo genera)
    for (const it of p.items) {
      const productoId     = toNum(it.producto_id);
      const productoNombre = it.producto_nombre ?? 'Producto';
      const cantidad       = toNum(it.cantidad) || 0;
      const precioUnitArs  = toNum(it.precio_unit_ars) || 0;
      const precioUnitUsd  = isNum(toNum(it.precio_unit_usd))
        ? toNum(it.precio_unit_usd)
        : Number((precioUnitArs / fx).toFixed(2));
      const subtotalUsd    = isNum(toNum(it.subtotal_usd))
        ? toNum(it.subtotal_usd)
        : Number(((precioUnitArs * cantidad) / fx).toFixed(2));

      await conn.query(
        `INSERT INTO factura_detalle
         (factura_id, producto_id, producto_nombre, cantidad, precio_unitario, precio_unit_usd, subtotal_usd)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [facturaId, productoId, productoNombre, cantidad, precioUnitArs, precioUnitUsd, subtotalUsd]
      );
    }

    await conn.commit();
    return res.status(201).json({ invoice_id: facturaId });
  } catch (e) {
    await conn.rollback();
    console.error('🔥 Error al guardar factura:', e);
    return res.status(500).json({ message: 'error al guardar factura', detail: e.message });
  } finally {
    conn.release();
  }
});

// GET /facturas → listado
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.id, f.fecha, f.total AS total_ars, f.total_usd, f.tipo_cambio, f.estado
         FROM facturas f
        ORDER BY f.fecha DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error('🔥 Error al obtener facturas:', e);
    res.status(500).json({ message: 'error al obtener facturas' });
  }
});

module.exports = router;
