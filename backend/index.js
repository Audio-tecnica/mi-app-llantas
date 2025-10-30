const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const xlsx = require('xlsx');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;

// 🔗 Conexión a PostgreSQL
const pool = new Pool({
  connectionString: 'postgresql://postgres.xihejxjynnsxcrdxvtng:Audio.2025*ñ@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// 🛠️ Middleware
app.use(fileUpload());
app.use(cors({ origin: 'https://mi-app-llantas.vercel.app' }));
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

// 📥 Consultar llantas
app.get('/api/llantas', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM llantas');
    res.json(rows);
  } catch (e) {
    console.error('❌ Error al obtener llantas:', e);
    res.status(500).json({ error: 'Error al obtener las llantas' });
  }
});

// ✅ Editar ítem existente
app.post('/api/editar-llanta', async (req, res) => {
  const { id, referencia, marca, proveedor, costo_empresa, precio_cliente, stock } = req.body;
  try {
    await pool.query(`
      UPDATE llantas
      SET referencia = $1,
          marca = $2,
          proveedor = $3,
          costo_empresa = $4,
          precio_cliente = $5,
          stock = $6
      WHERE id = $7
    `, [
      referencia,
      marca,
      proveedor,
      parseInt(costo_empresa) || 0,
      parseInt(precio_cliente) || 0,
      parseInt(stock) || 0,
      id
    ]);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error al actualizar item:', e);
    res.status(500).json({ error: 'Error al actualizar item' });
  }
});

// ✅ Agregar ítem nuevo
app.post('/api/agregar-llanta', async (req, res) => {
  const { referencia, marca, proveedor, costo_empresa, precio_cliente, stock } = req.body;
  try {
    await pool.query(`
      INSERT INTO llantas (referencia, marca, proveedor, costo_empresa, precio_cliente, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      referencia || '',
      marca || '',
      proveedor || '',
      parseInt(costo_empresa) || 0,
      parseInt(precio_cliente) || 0,
      parseInt(stock) || 0
    ]);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error al agregar item:', e);
    res.status(500).json({ error: 'Error al agregar item' });
  }
});

// ✅ Eliminar ítem
app.post('/api/eliminar-llanta', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('DELETE FROM llantas WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error al eliminar item:', e);
    res.status(500).json({ error: 'Error al eliminar item' });
  }
});

// Guardar acción en historial
app.post("/api/historial", async (req, res) => {
  const { usuario, accion, detalle } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO historial (usuario, accion, detalle) VALUES ($1, $2, $3) RETURNING *",
      [usuario, accion, detalle]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error guardando historial:", err);
    res.status(500).json({ error: "Error guardando historial" });
  }
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});


// 📦 --- TAPETES --- 📦

// Crear tabla de tapetes si no existe
async function crearTablaTapetes() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tapetes (
        id SERIAL PRIMARY KEY,
        referencia TEXT,
        marca TEXT,
        proveedor TEXT,
        costo INTEGER,
        precio INTEGER,
        stock INTEGER
      )
    `);
    console.log('✅ Tabla "tapetes" verificada o creada');
  } catch (e) {
    console.error('❌ Error al crear la tabla tapetes:', e);
  }
}
crearTablaTapetes();

// Consultar tapetes
app.get('/api/tapetes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tapetes');
    res.json(rows);
  } catch (e) {
    console.error('❌ Error al obtener tapetes:', e);
    res.status(500).json({ error: 'Error al obtener los tapetes' });
  }
});

// Agregar tapete
app.post('/api/agregar-tapete', async (req, res) => {
  const { referencia, marca, proveedor, costo, precio, stock } = req.body;
  try {
    await pool.query(
      'INSERT INTO tapetes (referencia, marca, proveedor, costo, precio, stock) VALUES ($1,$2,$3,$4,$5,$6)',
      [referencia, marca, proveedor, parseInt(costo)||0, parseInt(precio)||0, parseInt(stock)||0]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error al agregar tapete:', e);
    res.status(500).json({ error: 'Error al agregar tapete' });
  }
});

// Editar tapete
app.post('/api/editar-tapete', async (req, res) => {
  const { id, referencia, marca, proveedor, costo, precio, stock } = req.body;
  try {
    await pool.query(
      `UPDATE tapetes SET referencia=$1, marca=$2, proveedor=$3, costo=$4, precio=$5, stock=$6 WHERE id=$7`,
      [referencia, marca, proveedor, parseInt(costo)||0, parseInt(precio)||0, parseInt(stock)||0, id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error al editar tapete:', e);
    res.status(500).json({ error: 'Error al editar tapete' });
  }
});

// Eliminar tapete
app.post('/api/eliminar-tapete', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('DELETE FROM tapetes WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error al eliminar tapete:', e);
    res.status(500).json({ error: 'Error al eliminar tapete' });
  }
});









