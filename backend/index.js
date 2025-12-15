const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const xlsx = require("xlsx");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");
const axios = require("axios"); // ⬅️ NUEVO: Para remove.bg
const FormData = require("form-data"); // ⬅️ NUEVO: Para remove.bg

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

// ⬇️⬇️⬇️ NUEVO: API KEY DE REMOVE.BG ⬇️⬇️⬇️
// Consigue tu API key gratis en: https://remove.bg/api
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || 'BFz2WwvkwPfh33YAbnMiD7Ke';
// ⬆️⬆️⬆️ IMPORTANTE: Reemplaza 'TU_API_KEY_AQUI' con tu API key real ⬆️⬆️⬆️

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

// ⬇️⬇️⬇️ NUEVAS FUNCIONES PARA REMOVE.BG ⬇️⬇️⬇️

/**
 * Función para remover el fondo de una imagen usando remove.bg
 * @param {string} imageUrl - URL de la imagen en Cloudinary
 * @returns {Promise<string>} - URL de la imagen procesada en Cloudinary
 */
async function removerFondoRin(imageUrl) {
  try {
    console.log('🔄 Procesando imagen con remove.bg:', imageUrl);

    // Descargar la imagen desde Cloudinary
    const imageResponse = await axios.get(imageUrl, { 
      responseType: 'arraybuffer' 
    });

    // Crear FormData para enviar a remove.bg
    const formData = new FormData();
    formData.append('image_file_b64', Buffer.from(imageResponse.data).toString('base64'));
    formData.append('size', 'auto');

    // Llamar a la API de remove.bg
    const response = await axios({
      method: 'post',
      url: 'https://api.remove.bg/v1.0/removebg',
      data: formData,
      responseType: 'arraybuffer',
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
    });

    if (response.status !== 200) {
      throw new Error(`remove.bg retornó status ${response.status}`);
    }

    console.log('✅ Fondo removido exitosamente');

    // Subir la imagen procesada de vuelta a Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'rines',
          format: 'png', // Importante: guardar como PNG para mantener transparencia
          public_id: `sin-fondo-${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            console.error('❌ Error subiendo a Cloudinary:', error);
            reject(error);
          } else {
            console.log('✅ Imagen sin fondo subida a Cloudinary:', result.secure_url);
            resolve(result.secure_url);
          }
        }
      );

      uploadStream.end(Buffer.from(response.data));
    });

  } catch (error) {
    console.error('❌ Error al remover fondo:', error.message);
    
    // Si falla, retornar la imagen original
    if (error.response?.status === 403) {
      console.error('❌ API Key inválida o límite de remove.bg alcanzado');
    }
    
    return imageUrl; // Retornar imagen original si falla
  }
}

/**
 * Endpoint para procesar un rin específico y remover su fondo
 */
app.post("/api/rines/:id/procesar-fondo", async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Procesando fondo del rin ID: ${id}`);

    // Obtener el rin de la base de datos
    const result = await pool.query("SELECT * FROM rines WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rin no encontrado" });
    }

    const rin = result.rows[0];
    
    if (!rin.foto) {
      return res.status(400).json({ error: "El rin no tiene foto" });
    }

    // Procesar la imagen
    const urlSinFondo = await removerFondoRin(rin.foto);
    
    // Actualizar en la base de datos
    await pool.query(
      "UPDATE rines SET foto = $1, foto_original = $2 WHERE id = $3",
      [urlSinFondo, rin.foto, id]
    );

    res.json({
      success: true,
      message: 'Fondo removido correctamente',
      foto_nueva: urlSinFondo,
      foto_original: rin.foto
    });

  } catch (error) {
    console.error('❌ Error procesando fondo:', error);
    res.status(500).json({ 
      error: 'Error al procesar imagen',
      detalle: error.message 
    });
  }
});

/**
 * Endpoint para procesar TODOS los rines en lote
 */
app.post("/api/rines/procesar-todos", async (req, res) => {
  try {
    console.log('🔄 Iniciando procesamiento en lote...');

    const result = await pool.query("SELECT * FROM rines WHERE foto IS NOT NULL");
    const rines = result.rows;

    const resultados = {
      total: rines.length,
      exitosos: 0,
      fallidos: 0,
      detalles: []
    };

    for (const rin of rines) {
      try {
        // Saltar si ya tiene foto_original (ya fue procesado)
        if (rin.foto_original) {
          console.log(`⏭️ Rin ${rin.id} ya fue procesado, saltando...`);
          continue;
        }

        console.log(`🔄 Procesando rin ${rin.id}: ${rin.referencia}`);
        
        const urlSinFondo = await removerFondoRin(rin.foto);
        
        // Solo actualizar si cambió la URL (remove.bg funcionó)
        if (urlSinFondo !== rin.foto) {
          await pool.query(
            "UPDATE rines SET foto = $1, foto_original = $2 WHERE id = $3",
            [urlSinFondo, rin.foto, rin.id]
          );
          
          resultados.exitosos++;
          resultados.detalles.push({
            id: rin.id,
            referencia: rin.referencia,
            estado: 'exitoso'
          });
        } else {
          resultados.fallidos++;
          resultados.detalles.push({
            id: rin.id,
            referencia: rin.referencia,
            estado: 'fallido'
          });
        }

        // Esperar 1 segundo entre cada imagen (límite de rate de remove.bg)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error procesando rin ${rin.id}:`, error.message);
        resultados.fallidos++;
        resultados.detalles.push({
          id: rin.id,
          referencia: rin.referencia,
          estado: 'error',
          error: error.message
        });
      }
    }

    console.log('✅ Procesamiento completado:', resultados);

    res.json({
      success: true,
      message: 'Procesamiento completado',
      resultados
    });

  } catch (error) {
    console.error('❌ Error en procesamiento en lote:', error);
    res.status(500).json({ 
      error: 'Error al procesar lote',
      detalle: error.message 
    });
  }
});

// ⬆️⬆️⬆️ FIN DE NUEVAS FUNCIONES ⬆️⬆️⬆️

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
  const { id, marca, referencia, proveedor, medida, costo, precio, stock, remision, comentario } = req.body;

  console.log("📥 Datos recibidos para editar:", req.body);

  try {
    const result = await pool.query(
      `UPDATE rines SET
       marca = $1, 
       referencia = $2, 
       proveedor = $3, 
       medida = $4,
       costo = $5, 
       precio = $6, 
       stock = $7,
       remision = $8,
       comentario = $9
       WHERE id = $10
       RETURNING *`,
      [
        marca || "",
        referencia || "",
        proveedor || "",
        medida || "",
        parseFloat(costo) || 0,
        parseFloat(precio) || 0,
        parseInt(stock) || 0,
        remision === true || remision === "true",
        comentario || "",
        id,
      ]
    );
    
    console.log("✅ Rin actualizado:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error editando rin:", error);
    res.status(500).json({ 
      error: "Error editando rin",
      detalle: error.message 
    });
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
// ⬇️ MODIFICADO: Ahora procesa automáticamente con remove.bg
app.post("/api/rines/subir-foto", upload.single('foto'), async (req, res) => {
  try {
    console.log("📥 Body recibido:", req.body);
    console.log("📸 Archivo recibido:", req.file);
    
    const { id, procesarFondo } = req.body;
    
    if (!id) {
      console.error("❌ ID no proporcionado");
      return res.status(400).json({ error: "ID del rin no proporcionado" });
    }
    
    if (!req.file) {
      console.error("❌ No se recibió archivo");
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }

    let urlFoto = req.file.path;

    console.log("✅ Foto subida a Cloudinary:", urlFoto);

    // Si procesarFondo es true, remover el fondo
    if (procesarFondo === 'true' || procesarFondo === true) {
      console.log("🔄 Procesando fondo automáticamente...");
      const urlSinFondo = await removerFondoRin(urlFoto);
      
      if (urlSinFondo !== urlFoto) {
        // Guardar original y usar la procesada
        await pool.query(
          "UPDATE rines SET foto = $1, foto_original = $2 WHERE id = $3", 
          [urlSinFondo, urlFoto, id]
        );
        
        console.log("✅ Foto procesada y guardada");
        return res.json({ 
          success: true, 
          foto: urlSinFondo,
          foto_original: urlFoto,
          procesada: true
        });
      }
    }

    // Si no se procesa o falla, guardar original
    await pool.query("UPDATE rines SET foto = $1 WHERE id = $2", [urlFoto, id]);

    console.log("✅ URL guardada en BD para rin ID:", id);

    res.json({ success: true, foto: urlFoto, procesada: false });
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

// Guardar log
app.post("/api/log-actividad", async (req, res) => {
  const { tipo, detalles, fecha } = req.body;

  try {
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

// Obtener logs
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

// ---------------- CARPAS ----------------

// Obtener carpas
app.get("/api/carpas", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM carpas ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    console.error("Error obteniendo carpas:", e);
    res.status(500).json({ error: "Error obteniendo carpas" });
  }
});

// Agregar carpa
app.post("/api/agregar-carpa", async (req, res) => {
  const { marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO carpas (marca, referencia, proveedor, costo, precio, stock, fecha_creacion)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      `,
      [
        marca,
        referencia,
        proveedor || "",
        parseFloat(costo) || 0,
        parseFloat(precio) || 0,
        parseInt(stock) || 0,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Error agregando carpa:", e);
    res.status(500).json({ error: "Error agregando carpa" });
  }
});

// Editar carpa
app.post("/api/editar-carpa", async (req, res) => {
  const { id, marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `
      UPDATE carpas SET
        marca=$1, referencia=$2, proveedor=$3, costo=$4, precio=$5, stock=$6
      WHERE id=$7
      `,
      [
        marca,
        referencia,
        proveedor || "",
        parseFloat(costo),
        parseFloat(precio),
        parseInt(stock),
        id,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Error editando carpa:", e);
    res.status(500).json({ error: "Error editando carpa" });
  }
});

// Eliminar carpa
app.post("/api/eliminar-carpa", async (req, res) => {
  try {
    await pool.query("DELETE FROM carpas WHERE id=$1", [req.body.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("Error eliminando carpa:", e);
    res.status(500).json({ error: "Error eliminando carpa" });
  }
});

// ---------------- TIROS DE ARRASTRE ----------------

// Obtener tiros de arrastre
app.get("/api/tiros-arrastre", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM tiros_arrastre ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    console.error("Error obteniendo tiros de arrastre:", e);
    res.status(500).json({ error: "Error obteniendo tiros de arrastre" });
  }
});

// Agregar tiro de arrastre
app.post("/api/agregar-tiro-arrastre", async (req, res) => {
  const { marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `INSERT INTO tiros_arrastre (marca, referencia, proveedor, costo, precio, stock, fecha_creacion)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [
        marca,
        referencia,
        proveedor || "",
        parseFloat(costo) || 0,
        parseFloat(precio) || 0,
        parseInt(stock) || 0,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Error agregando tiro de arrastre:", e);
    res.status(500).json({ error: "Error agregando tiro de arrastre" });
  }
});

// Editar tiro de arrastre
app.post("/api/editar-tiro-arrastre", async (req, res) => {
  const { id, marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `UPDATE tiros_arrastre SET
        marca=$1, referencia=$2, proveedor=$3, costo=$4, precio=$5, stock=$6
       WHERE id=$7`,
      [marca, referencia, proveedor || "", parseFloat(costo), parseFloat(precio), parseInt(stock), id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Error editando tiro de arrastre:", e);
    res.status(500).json({ error: "Error editando tiro de arrastre" });
  }
});

// Eliminar tiro de arrastre
app.post("/api/eliminar-tiro-arrastre", async (req, res) => {
  try {
    await pool.query("DELETE FROM tiros_arrastre WHERE id=$1", [req.body.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("Error eliminando tiro de arrastre:", e);
    res.status(500).json({ error: "Error eliminando tiro de arrastre" });
  }
});

// ---------------- SONIDO ----------------

// Obtener productos de sonido
app.get("/api/sonido", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM sonido ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    console.error("Error obteniendo productos de sonido:", e);
    res.status(500).json({ error: "Error obteniendo productos de sonido" });
  }
});

// Agregar producto de sonido
app.post("/api/agregar-sonido", async (req, res) => {
  const { marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `INSERT INTO sonido (marca, referencia, proveedor, costo, precio, stock, fecha_creacion)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [
        marca,
        referencia,
        proveedor || "",
        parseFloat(costo) || 0,
        parseFloat(precio) || 0,
        parseInt(stock) || 0,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Error agregando producto de sonido:", e);
    res.status(500).json({ error: "Error agregando producto de sonido" });
  }
});

// Editar producto de sonido
app.post("/api/editar-sonido", async (req, res) => {
  const { id, marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `UPDATE sonido SET
        marca=$1, referencia=$2, proveedor=$3, costo=$4, precio=$5, stock=$6
       WHERE id=$7`,
      [marca, referencia, proveedor || "", parseFloat(costo), parseFloat(precio), parseInt(stock), id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Error editando producto de sonido:", e);
    res.status(500).json({ error: "Error editando producto de sonido" });
  }
});

// Eliminar producto de sonido
app.post("/api/eliminar-sonido", async (req, res) => {
  try {
    await pool.query("DELETE FROM sonido WHERE id=$1", [req.body.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("Error eliminando producto de sonido:", e);
    res.status(500).json({ error: "Error eliminando producto de sonido" });
  }
});

// ---------------- LUCES ----------------

// Obtener luces
app.get("/api/luces", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM luces ORDER BY id ASC");
    res.json(rows);
  } catch (e) {
    console.error("Error obteniendo luces:", e);
    res.status(500).json({ error: "Error obteniendo luces" });
  }
});

// Agregar luz
app.post("/api/agregar-luz", async (req, res) => {
  const { marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `INSERT INTO luces (marca, referencia, proveedor, costo, precio, stock, fecha_creacion)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [
        marca,
        referencia,
        proveedor || "",
        parseFloat(costo) || 0,
        parseFloat(precio) || 0,
        parseInt(stock) || 0,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Error agregando luz:", e);
    res.status(500).json({ error: "Error agregando luz" });
  }
});

// Editar luz
app.post("/api/editar-luz", async (req, res) => {
  const { id, marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `UPDATE luces SET
        marca=$1, referencia=$2, proveedor=$3, costo=$4, precio=$5, stock=$6
       WHERE id=$7`,
      [marca, referencia, proveedor || "", parseFloat(costo), parseFloat(precio), parseInt(stock), id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Error editando luz:", e);
    res.status(500).json({ error: "Error editando luz" });
  }
});

// Eliminar luz
app.post("/api/eliminar-luz", async (req, res) => {
  try {
    await pool.query("DELETE FROM luces WHERE id=$1", [req.body.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("Error eliminando luz:", e);
    res.status(500).json({ error: "Error eliminando luz" });
  }
});

// Run server
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
  console.log(`📁 Cloudinary configurado correctamente`);
  console.log(`🎨 Remove.bg ${REMOVE_BG_API_KEY !== 'TU_API_KEY_AQUI' ? 'ACTIVADO ✅' : 'PENDIENTE (configura tu API key)'}`);
});

