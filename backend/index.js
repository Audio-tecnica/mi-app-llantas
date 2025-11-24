const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const xlsx = require("xlsx");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ===========================
// CONFIGURAR CLOUDINARY
// ===========================
cloudinary.config({
  cloud_name: 'dlgub1vaf',
  api_key: '971754543599966',
  api_secret: 'q8N34PNwLpnmBSvfhGYuk6jmYR4'
});

// Configurar almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rines',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  },
});

const upload = multer({ storage: storage });

// PostgreSQL
const pool = new Pool({
  connectionString:
    "postgresql://postgres.xihejxjynnsxcrdxvtng:Audio.2025*ñ@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===========================
//  CREAR CARPETA PARA FOTOS (legacy)
// ===========================
const FILES_PATH = path.join(__dirname, "files");
if (!fs.existsSync(FILES_PATH)) {
  fs.mkdirSync(FILES_PATH, { recursive: true });
}

// Servir archivos estáticos
app.use("/files", express.static(FILES_PATH));

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
        stock INTEGER,
        consignacion BOOLEAN DEFAULT FALSE,
        comentario TEXT DEFAULT ''
      )
    `);
    
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='llantas' AND column_name='consignacion') THEN
          ALTER TABLE llantas ADD COLUMN consignacion BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='llantas' AND column_name='comentario') THEN
          ALTER TABLE llantas ADD COLUMN comentario TEXT DEFAULT '';
        END IF;
      END $$;
    `);
    
    console.log('Tabla "llantas" lista con todas las columnas.');
  } catch (err) {
    console.error("Error creando tabla:", err);
  }
}
crearTabla();

// ---------------- LLANTAS ----------------

// Subir Excel
app.post("/api/upload", fileUpload(), async (req, res) => {
  if (!req.files || !req.files.file)
    return res.status(400).json({ error: "Archivo faltante" });

  const archivo = req.files.file;
  const workbook = xlsx.read(archivo.data, { type: "buffer" });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = xlsx.utils.sheet_to_json(hoja);

  try {
    await pool.query("DELETE FROM llantas");

    const query = `
      INSERT INTO llantas (referencia, marca, proveedor, costo_empresa, precio_cliente, stock, consignacion, comentario)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `;

    for (const l of datos) {
      await pool.query(query, [
        l["referencia"] || "",
        l["marca"] || "",
        l["proveedor"] || "",
        parseInt(l["costo_empresa"]) || 0,
        parseInt(l["precio_cliente"]) || 0,
        parseInt(l["stock"]) || 0,
        l["consignacion"] || false,
        l["comentario"] || ""
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
    console.error("Error obteniendo llantas:", e);
    res.status(500).json({ error: "Error obteniendo llantas" });
  }
});

// Editar llanta
app.post('/api/editar-llanta', async (req, res) => {
  const { id, referencia, marca, proveedor, costo_empresa, precio_cliente, stock, consignacion, comentario } = req.body;
  
  try {
    await pool.query(
      `UPDATE llantas SET 
        referencia = $1, 
        marca = $2, 
        proveedor = $3, 
        costo_empresa = $4, 
        precio_cliente = $5, 
        stock = $6, 
        consignacion = $7, 
        comentario = $8 
      WHERE id = $9`,
      [
        referencia, 
        marca, 
        proveedor, 
        parseInt(costo_empresa), 
        parseInt(precio_cliente), 
        parseInt(stock), 
        consignacion || false, 
        comentario || '', 
        id
      ]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error editando llanta:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agregar llanta
app.post("/api/agregar-llanta", async (req, res) => {
  const { referencia, marca, proveedor, costo_empresa, precio_cliente, stock, consignacion, comentario } = req.body;

  try {
    await pool.query(
      `INSERT INTO llantas (referencia, marca, proveedor, costo_empresa, precio_cliente, stock, consignacion, comentario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        referencia,
        marca,
        proveedor,
        parseInt(costo_empresa),
        parseInt(precio_cliente),
        parseInt(stock),
        consignacion || false,
        comentario || ''
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('Error agregando llanta:', e);
    res.status(500).json({ error: "Error agregando llanta" });
  }
});

// Eliminar llanta
app.post("/api/eliminar-llanta", async (req, res) => {
  try {
    await pool.query("DELETE FROM llantas WHERE id=$1", [req.body.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("Error eliminando llanta:", e);
    res.status(500).json({ error: "Error eliminando llanta" });
  }
});

// ---------------- TAPETES ----------------

app.get("/api/tapetes", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM tapetes ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    console.error("Error obteniendo tapetes:", e);
    res.status(500).json({ error: "Error obteniendo tapetes" });
  }
});

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
    console.error("Error agregando tapete:", e);
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
    console.error("Error editando tapete:", e);
    res.status(500).json({ error: "Error editando tapete" });
  }
});

// Eliminar tapete
app.post("/api/eliminar-tapete", async (req, res) => {
  try {
    await pool.query("DELETE FROM tapetes WHERE id=$1", [req.body.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("Error eliminando tapete:", e);
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
    console.error("Error obteniendo rines:", error);
    res.status(500).json({ error: "Error obteniendo rines" });
  }
});

// Agregar rin
app.post("/api/agregar-rin", async (req, res) => {
  const { marca, referencia, proveedor, medida, costo, precio, stock } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO rines (marca, referencia, proveedor, medida, costo, precio, stock)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        marca,
        referencia,
        proveedor || "",
        medida || "",
        parseFloat(costo) || 0,
        parseFloat(precio) || 0,
        parseInt(stock) || 0,
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error agregando rin:", error);
    res.status(500).json({ error: "Error agregando rin" });
  }
});

// Editar rin
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
        proveedor || "",
        medida || "0",            // ← 🔥 CORRECCIÓN APLICADA AQUÍ
        parseFloat(costo),
        parseFloat(precio),
        parseInt(stock),
        id,
      ]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error editando rin:", error);
    res.status(500).json({ error: "Error editando rin" });
  }
});


// Eliminar rin
app.post("/api/eliminar-rin", async (req, res) => {
  try {
    await pool.query("DELETE FROM rines WHERE id=$1", [req.body.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error eliminando rin:", error);
    res.status(500).json({ error: "Error eliminando rin" });
  }
});

// ===========================
//   SUBIR FOTO PARA RINES 
// ===========================
app.post("/api/rines/subir-foto", upload.single('foto'), async (req, res) => {
  try {
    console.log("📥 Body recibido:", req.body);
    console.log("📸 Archivo recibido:", req.file);
    
    const { id } = req.body;
    
    if (!id) {
      console.error("❌ ID no proporcionado");
      return res.status(400).json({ error: "ID del rin no proporcionado" });
    }
    
    if (!req.file) {
      console.error("❌ No se recibió archivo");
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }

    const urlFoto = req.file.path;

    console.log("✅ Foto subida a Cloudinary:", urlFoto);

    await pool.query("UPDATE rines SET foto = $1 WHERE id = $2", [urlFoto, id]);

    console.log("✅ URL guardada en BD para rin ID:", id);

    res.json({ success: true, foto: urlFoto });
  } catch (error) {
    console.error("❌ Error completo al subir foto:", error);
    res.status(500).json({ 
      error: error.message || "Error al subir foto",
      details: error.toString()
    });
  }
});

// ===========================
//        LOGS ACTIVIDAD
// ===========================

// Guardar log (CORREGIDO para que funcione sin fecha enviada)
app.post("/api/log-actividad", async (req, res) => {
  const { tipo, detalles, fecha } = req.body;

  try {
    // COALESCE usa la fecha enviada o NOW() si no se envía
    const result = await pool.query(
      "INSERT INTO logs_actividad (tipo, detalles, fecha) VALUES ($1, $2, COALESCE($3, NOW())) RETURNING id",
      [tipo, detalles, fecha]
    );

    res.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error("❌ Error guardando log:", err);
    res.status(500).json({ error: "Error al guardar log", detalles: err.message });
  }
});

// Obtener logs (CORREGIDO)
app.get("/api/logs", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM logs_actividad ORDER BY fecha DESC LIMIT 500"
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error obteniendo logs:", err);
    res.status(500).json({ error: "Error al obtener logs", detalles: err.message });
  }
});


// Run server
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
  console.log(`📁 Cloudinary configurado correctamente`);
});

