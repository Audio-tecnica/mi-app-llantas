const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const xlsx = require('xlsx');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;

// 🔗 Conexión a PostgreSQL (REEMPLAZA con tu cadena real si es diferente)
  const pool = new Pool({
  connectionString: 'postgresql://postgres.xihejxjynnsxcrdxvtng:Audio.2025*ñ@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

// 🛠️ Middleware
app.use(fileUpload());
app.use(cors({
  origin: 'https://mi-app-llantas.vercel.app',
}));
app.use(express.json());

// 🧱 Crear tabla si no existe
async function crearTabla() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS llantas (
        id SERIAL PRIMARY KEY,
        referencia TEXT,
        marca TEXT,
        proveedor TEXT,
        costo_empresa INTEGER,
        precio_cliente INTEGER,
        stock INTEGER
      )
    `);
    console.log('✅ Tabla "llantas" verificada o creada');
  } catch (e) {
    console.error('❌ Error al crear la tabla:', e);
  }
}
crearTabla();

// 📤 Subida de archivo Excel
app.post('/api/upload', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  const archivo = req.files.file;
  const workbook = xlsx.read(archivo.data, { type: 'buffer' });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = xlsx.utils.sheet_to_json(hoja);

  try {
    await pool.query('DELETE FROM llantas');

    const query = `
      INSERT INTO llantas (referencia, marca, proveedor, costo_empresa, precio_cliente, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const l of datos) {
      await pool.query(query, [
        l['referencia'] || '',
        l['marca'] || '',
        l['proveedor'] || '',
        parseInt(l['costo_empresa']) || 0,
        parseInt(l['precio_cliente']) || 0,
        parseInt(l['stock']) || 0
      ]);
    }

    res.json({ message: 'Archivo cargado correctamente' });
  } catch (e) {
    console.error('❌ Error al importar:', e);
    res.status(500).json({ error: 'Error al importar los datos' });
  }
});

// 📥 Consulta de llantas
app.get('/api/llantas', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM llantas');
    res.json(rows);
  } catch (e) {
    console.error('❌ Error al obtener llantas:', e);
    res.status(500).json({ error: 'Error al obtener las llantas' });
  }
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});







