// backendGB/routes/reportes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // mysql2/promise pool

// CSV: fecha, cliente, productos, total (una fila por factura)
router.get('/facturas.csv', async (_req, res) => {
  try {
    // por si hay facturas con muchos ítems
    await db.query('SET SESSION group_concat_max_len = 1000000');

    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(f.fecha, '%Y-%m-%d %H:%i') AS fecha,
        TRIM(COALESCE(NULLIF(f.cliente_nombre,''), f.cliente_email, 'Invitado')) AS cliente,
        (
          SELECT GROUP_CONCAT(CONCAT(d.producto_nombre, ' x ', d.cantidad)
                              ORDER BY d.id SEPARATOR ' | ')
          FROM factura_detalle d
          WHERE d.factura_id = f.id
        ) AS productos,
        f.total AS total
      FROM facturas f
      WHERE f.estado IS NULL OR f.estado = 'PAGADA'
      ORDER BY f.fecha DESC
    `);

    // escapado CSV
    const esc = (v) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n|]/.test(s) ? `"${s}"` : s;
    };

    let csv = 'fecha,cliente,productos,total\n';
    for (const r of rows) {
      csv += [esc(r.fecha), esc(r.cliente), esc(r.productos || ''), r.total ?? ''].join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="facturas-${new Date().toISOString().slice(0,10)}.csv"`
    );
    res.send('\uFEFF' + csv); 
  } catch (e) {
    console.error('CSV facturas error:', e);
    res.status(500).json({ message: 'No se pudo generar el CSV' });
  }
});

module.exports = router;
