const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const xlsx = require("xlsx");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 10000;

// 🔗 Conexión a PostgreSQL
const pool = new Pool({
  connectionString:
    "postgresql://postgres.xihejxjynnsxcrdxvtng:Audio.2025*ñ@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

// 🛠️ Middleware
app.use(fileUpload());
app.use(cors({ origin: "https://mi-app-llantas.vercel.app" }));
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
    console.error("❌ Error al crear la tabla:", e);
  }
}
crearTabla();

// 📤 Subida de archivo Excel
app.post("/api/upload", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: "No se subió ningún archivo" });
  }

  const archivo = req.files.file;
  const workbook = xlsx.read(archivo.data, { type: "buffer" });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = xlsx.utils.sheet_to_json(hoja);

  try {
    await pool.query("DELETE FROM llantas");

    const query = `
      INSERT INTO llantas (referencia, marca, proveedor, costo_empresa, precio_cliente, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const l of datos) {
      await pool.query(query, [
        l["referencia"] || "",
        l["marca"] || "",
        l["proveedor"] || "",
        parseInt(l["costo_empresa"]) || 0,
        parseInt(l["precio_cliente"]) || 0,
        parseInt(l["stock"]) || 0,
      ]);
    }

    res.json({ message: "Archivo cargado correctamente" });
  } catch (e) {
    console.error("❌ Error al importar:", e);
    res.status(500).json({ error: "Error al importar los datos" });
  }
});

// 📥 Consultar llantas
app.get("/api/llantas", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM llantas");
    res.json(rows);
  } catch (e) {
    console.error("❌ Error al obtener llantas:", e);
    res.status(500).json({ error: "Error al obtener las llantas" });
  }
});

// ✅ Editar ítem existente
app.post("/api/editar-llanta", async (req, res) => {
  const {
    id,
    referencia,
    marca,
    proveedor,
    costo_empresa,
    precio_cliente,
    stock,
  } = req.body;
  try {
    await pool.query(
      `
      UPDATE llantas
      SET referencia = $1,
          marca = $2,
          proveedor = $3,
          costo_empresa = $4,
          precio_cliente = $5,
          stock = $6
      WHERE id = $7
    `,
      [
        referencia,
        marca,
        proveedor,
        parseInt(costo_empresa) || 0,
        parseInt(precio_cliente) || 0,
        parseInt(stock) || 0,
        id,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("❌ Error al actualizar item:", e);
    res.status(500).json({ error: "Error al actualizar item" });
  }
});

// ✅ Agregar ítem nuevo
app.post("/api/agregar-llanta", async (req, res) => {
  const { referencia, marca, proveedor, costo_empresa, precio_cliente, stock } =
    req.body;
  try {
    await pool.query(
      `
      INSERT INTO llantas (referencia, marca, proveedor, costo_empresa, precio_cliente, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        referencia || "",
        marca || "",
        proveedor || "",
        parseInt(costo_empresa) || 0,
        parseInt(precio_cliente) || 0,
        parseInt(stock) || 0,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("❌ Error al agregar item:", e);
    res.status(500).json({ error: "Error al agregar item" });
  }
});

// ✅ Eliminar ítem
app.post("/api/eliminar-llanta", async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query("DELETE FROM llantas WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (e) {
    console.error("❌ Error al eliminar item:", e);
    res.status(500).json({ error: "Error al eliminar item" });
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

// ========================== //
//        TAPETES             //
// ========================== //

// 📥 Consultar tapetes
app.get("/api/tapetes", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM tapetes ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    console.error("❌ Error al obtener tapetes:", e);
    res.status(500).json({ error: "Error al obtener los tapetes" });
  }
});

// ✅ Agregar tapete
await pool.query(
  `
  INSERT INTO tapetes (marca, referencia, proveedor, costo, precio, stock, fecha_creacion)
  VALUES ($1, $2, $3, $4, $5, $6, NOW())
`,
  [
    marca || "",
    referencia || "",
    proveedor || "",
    parseFloat(costo) || 0,
    parseFloat(precio) || 0,
    parseInt(stock) || 0,
  ]
);

// ✅ Editar tapete
app.post("/api/editar-tapete", async (req, res) => {
  const { id, marca, referencia, proveedor, costo, precio, stock } = req.body;
  try {
    await pool.query(
      `
      UPDATE tapetes
      SET marca=$1, referencia=$2, proveedor=$3, costo=$4, precio=$5, stock=$6
      WHERE id=$7
    `,
      [
        marca,
        referencia,
        proveedor,
        parseFloat(costo) || 0,
        parseFloat(precio) || 0,
        parseInt(stock) || 0,
        id,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("❌ Error al actualizar tapete:", e);
    res.status(500).json({ error: "Error al actualizar tapete" });
  }
});

// ✅ Eliminar tapete
app.post("/api/eliminar-tapete", async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query("DELETE FROM tapetes WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (e) {
    console.error("❌ Error al eliminar tapete:", e);
    res.status(500).json({ error: "Error al eliminar tapete" });
  }
});

// ✅ Actualizar stock de tapete
app.post("/api/actualizar-stock-tapete", async (req, res) => {
  const { id, stock } = req.body;
  try {
    await pool.query("UPDATE tapetes SET stock = $1 WHERE id = $2", [
      parseInt(stock) || 0,
      id,
    ]);
    res.json({ success: true });
  } catch (e) {
    console.error("❌ Error al actualizar stock de tapete:", e);
    res.status(500).json({ error: "Error al actualizar stock" });
  }
});

// ==========================================
// ENDPOINTS PARA RINES
// ==========================================

// 📦 Obtener todos los rines
app.get('/api/rines', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rines ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener rines:', error);
    res.status(500).json({ error: 'Error al obtener rines' });
  }
});

// ➕ Agregar un rin (PostgreSQL)
app.post('/api/agregar-rin', async (req, res) => {
  try {
    const { marca, referencia, proveedor, medida, costo, precio, stock } = req.body;
    
    const query = `
      INSERT INTO rines (marca, referencia, proveedor, medida, costo, precio, stock) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    await pool.query(query, [
      marca,
      referencia,
      proveedor || '',
      medida || '',
      parseFloat(costo) || 0,
      parseFloat(precio) || 0,
      parseInt(stock) || 0
    ]);
    
    res.json({ success: true, message: 'Rin agregado correctamente' });
  } catch (error) {
    console.error('Error al agregar rin:', error);
    res.status(500).json({ error: 'Error al agregar rin' });
  }
});

// ✏️ Editar un rin (PostgreSQL)
app.post('/api/editar-rin', async (req, res) => {
  try {
    const { id, marca, referencia, proveedor, medida, costo, precio, stock } = req.body;
    
    const query = `
      UPDATE rines 
      SET marca = $1, referencia = $2, proveedor = $3, medida = $4, 
          costo = $5, precio = $6, stock = $7
      WHERE id = $8
    `;
    
    await pool.query(query, [
      marca,
      referencia,
      proveedor || '',
      medida || '',
      parseFloat(costo) || 0,
      parseFloat(precio) || 0,
      parseInt(stock) || 0,
      id
    ]);
    
    res.json({ success: true, message: 'Rin actualizado correctamente' });
  } catch (error) {
    console.error('Error al editar rin:', error);
    res.status(500).json({ error: 'Error al editar rin' });
  }
});

// 🗑️ Eliminar un rin (PostgreSQL)
app.post('/api/eliminar-rin', async (req, res) => {
  try {
    const { id } = req.body;
    
    await pool.query('DELETE FROM rines WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Rin eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar rin:', error);
    res.status(500).json({ error: 'Error al eliminar rin' });
  }
});