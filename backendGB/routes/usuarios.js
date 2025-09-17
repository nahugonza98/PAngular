const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', async (req, res) => {
  const { email, password, rol } = req.body;

  try {
    await db.query('INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)', [
      email,
      password,
      rol || 'usuario'
    ]);
    res.status(201).json({ message: '✅ Usuario creado con éxito' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: '⚠️ El email ya está registrado' });
    } else {
      console.error('❌ Error en el servidor:', error);
      res.status(500).json({ message: '❌ Error interno del servidor' });
    }
  }
});

module.exports = router;
