const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const xlsx = require("xlsx");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 10000;

// PostgreSQL
const pool = new Pool({
  connectionString:
    "postgresql://postgres.xihejxjynnsxcrdxvtng:Audio.2025*ñ@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

// Middleware
app.use(fileUpload());
app.use(cors());
app.use(express.json());

// Crear tabla llantas si no existe
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
    console.log('Tabla "llantas" lista.');
  } catch (err) {
    console.error("Error creando tabla:", err);
  }
}
crearTabla();

// ---------------- LLANTAS ----------------

// Subir Excel
app.post("/api/upload", async (req, res) => {
  if (!req.files || !req.files.file)
    return res.status(400).json({ error: "Archivo faltante" });

  const archivo = req.files.file;
  const workbook = xlsx.read(archivo.data, { type: "buffer" });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = xlsx.utils.sheet_to_json(hoja);

  try {
    await pool.query("DELETE FROM llantas");

    const query = `
      INSERT INTO llantas (referencia, marca, proveedor, costo_empresa, precio_cliente, stock)
      VALUES ($1,$2,$3,$4,$5,$6)
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

    res.json({ message: "Archivo importado correctamente" });
  } catch (e) {
    console.error("Error importando:", e);
    res.status(500).json({ error: "Error importando datos" });
  }
});

// Obtener llantas
app.get("/api/llantas", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM llantas ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error obteniendo llantas" });
  }
});

// Editar llanta
app.post("/api/editar-llanta", async (req, res) => {
  const { id, referencia, marca, proveedor, costo_empresa, precio_cliente, stock } =
    req.body;

  try {
    await pool.query(
      `
      UPDATE llantas SET
        referencia=$1,
        marca=$2,
        proveedor=$3,
        costo_empresa=$4,
        precio_cliente=$5,
        stock=$6
      WHERE id=$7
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
    res.status(500).json({ error: "Error editando llanta" });
  }
});

// Agregar llanta
app.post("/api/agregar-llanta", async (req, res) => {
  const { referencia, marca, proveedor, costo_empresa, precio_cliente, stock } =
    req.body;

  try {
    await pool.query(
      `
      INSERT INTO llantas (referencia, marca, proveedor, costo_empresa, precio_cliente, stock)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        referencia,
        marca,
        proveedor,
        parseInt(costo_empresa),
        parseInt(precio_cliente),
        parseInt(stock),
      ]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error agregando llanta" });
  }
});

// Eliminar llanta
app.post("/api/eliminar-llanta", async (req, res) => {
  try {
    await pool.query("DELETE FROM llantas WHERE id=$1", [req.body.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error eliminando llanta" });
  }
});

// ---------------- TAPETES ----------------

// Obtener tapetes
app.get("/api/tapetes", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM tapetes ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error obteniendo tapetes" });
  }
});

// Agregar tapete
app.post("/api/agregar-tapete", async (req, res) => {
  const { marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO tapetes (marca, referencia, proveedor, costo, precio, stock, fecha_creacion)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      `,
      [
        marca,
        referencia,
        proveedor,
        parseFloat(costo) || 0,
        parseFloat(precio) || 0,
        parseInt(stock) || 0,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error agregando tapete" });
  }
});

// Editar tapete
app.post("/api/editar-tapete", async (req, res) => {
  const { id, marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `
      UPDATE tapetes SET
        marca=$1, referencia=$2, proveedor=$3, costo=$4, precio=$5, stock=$6
      WHERE id=$7
      `,
      [
        marca,
        referencia,
        proveedor,
        parseFloat(costo),
        parseFloat(precio),
        parseInt(stock),
        id,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error editando tapete" });
  }
});

// Eliminar tapete
app.post("/api/eliminar-tapete", async (req, res) => {
  try {
    await pool.query("DELETE FROM tapetes WHERE id=$1", [req.body.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Error eliminando tapete" });
  }
});

// ---------------- RINES ----------------

// Obtener
app.get("/api/rines", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rines ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo rines" });
  }
});

// Agregar
app.post("/api/agregar-rin", async (req, res) => {
  const { marca, referencia, proveedor, medida, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO rines (marca, referencia, proveedor, medida, costo, precio, stock)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        marca,
        referencia,
        proveedor,
        medida,
        parseFloat(costo),
        parseFloat(precio),
        parseInt(stock),
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error agregando rin" });
  }
});

// Editar
app.post("/api/editar-rin", async (req, res) => {
  const { id, marca, referencia, proveedor, medida, costo, precio, stock } =
    req.body;

  try {
    await pool.query(
      `
      UPDATE rines SET
      marca=$1, referencia=$2, proveedor=$3, medida=$4,
      costo=$5, precio=$6, stock=$7
      WHERE id=$8
      `,
      [
        marca,
        referencia,
        proveedor,
        medida,
        parseFloat(costo),
        parseFloat(precio),
        parseInt(stock),
        id,
      ]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error editando rin" });
  }
});

// Eliminar
app.post("/api/eliminar-rin", async (req, res) => {
  try {
    await pool.query("DELETE FROM rines WHERE id=$1", [req.body.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando rin" });
  }
});

// Run server
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});


