const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const xlsx = require("xlsx");
const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = process.env.PORT || 10000;

// ===========================
// CONFIGURAR CLOUDINARY
// ===========================
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: "dlgub1vaf",
  api_key: "971754543599966",
  api_secret: "q8N34PNwLpnmBSvfhGYuk6jmYR4",
});

// ⬇️⬇️⬇️ NUEVO: API KEY DE REMOVE.BG ⬇️⬇️⬇️
const REMOVE_BG_API_KEY =
  process.env.REMOVE_BG_API_KEY || "BFz2WwvkwPfh33YAbnMiD7Ke";

// Configuración de Cloudinary para imágenes
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "llantas",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

// ⬅️ Para subir imágenes a Cloudinary
const uploadImage = multer({ storage: cloudinaryStorage });

// ⬅️ Para subir PDFs (se guardan en memoria)
const uploadPDF = multer({ storage: multer.memoryStorage() });

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
app.use(cors());

// ===========================
//  CREAR CARPETA PARA FOTOS (legacy)
// ===========================
const FILES_PATH = path.join(__dirname, "files");
if (!fs.existsSync(FILES_PATH)) {
  fs.mkdirSync(FILES_PATH, { recursive: true });
}

// Servir archivos estáticos
app.use("/files", express.static(FILES_PATH));

// ============================================
// ENDPOINT FINAL: PROCESAR EXCEL DE LLANTAR
// ============================================

app.post("/api/procesar-excel-llantar", fileUpload(), async (req, res) => {
  try {
    console.log("📊 ========================================");
    console.log("📊 INICIO - Recibiendo Excel de Llantar");
    console.log("📊 ========================================");

    if (!req.files || !req.files.excel) {
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    }

    // Leer Excel
    const workbook = xlsx.read(req.files.excel.data, { type: "buffer" });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const datos = xlsx.utils.sheet_to_json(hoja);

    console.log(`📊 Excel tiene ${datos.length} filas`);

    const datosLlantar = [];

    for (const fila of datos) {
      // Extraer datos
      const marca = fila["MARCA"]?.toString().trim().toUpperCase();
      const referencia = fila["REF"]?.toString().trim();
      const medida = fila["MEDIDA"]?.toString().trim();
      const diseno = fila["DISEÑO"]?.toString().trim();

      // ✅ COLUMNA CORRECTA: "MINIMA"
      let precioTexto = fila["MINIMA"] || "";

      if (typeof precioTexto === "number") {
        precioTexto = precioTexto.toString();
      }

      precioTexto = precioTexto.toString().replace(/[,\.]/g, "").trim();
      const precio = parseInt(precioTexto);

      // Validaciones
      if (!marca || !medida || isNaN(precio) || precio < 100000) {
        continue;
      }

      datosLlantar.push({
        marca,
        referencia: referencia || "",
        diseno: diseno || "",
        medida,
        precio,
      });
    }

    console.log(`\n✅ Extraídas ${datosLlantar.length} llantas del Excel`);

    // Obtener inventario actual
    const { rows: inventario } = await pool.query("SELECT * FROM llantas");

    console.log(`\n📦 Inventario tiene ${inventario.length} llantas`);

    const resultado = {
      actualizadas: 0,
      margenBajo: 0,
      bloqueadas: 0,
      noEncontradas: 0,
      detalles: [],
      noEncontradasLista: [],
    };

    console.log("\n🔄 ========================================");
    console.log("🔄 INICIANDO PROCESO DE COINCIDENCIAS");
    console.log("🔄 ========================================\n");

    let intentos = 0;
    for (const itemLlantar of datosLlantar) {
      intentos++;

      // 🎯 ESTRATEGIA DE COINCIDENCIA MEJORADA
      const llantaDB = inventario.find((l) => {
        // 1. Coincidencia de marca (obligatoria)
        const marcaInv = (l.marca || "").toUpperCase().trim();
        const marcaLlantar = itemLlantar.marca.toUpperCase().trim();

        if (marcaInv !== marcaLlantar) {
          return false;
        }

        // 2. Preparar strings para comparación
        const refInventario = (l.referencia || "").toUpperCase().trim();
        const medidaLlantar = itemLlantar.medida.toUpperCase().trim();
        const disenoLlantar = (itemLlantar.diseno || "").toUpperCase().trim();

        // 3. ✅ NUEVO: Verificar EXACTAMENTE la medida (incluyendo LT/P)
        // Quitar solo espacios extras, MANTENER el prefijo LT/P
        const medidaLimpia = medidaLlantar.replace(/\s+/g, "");
        const refLimpia = refInventario.replace(/\s+/g, "");

        // 4. Verificar si la medida EXACTA está en la referencia
        const coincideMedida = refLimpia.includes(medidaLimpia);

        if (!coincideMedida) {
          return false;
        }

        // 5. Verificar diseño de forma flexible (60% de palabras)
        if (disenoLlantar && disenoLlantar.length > 2) {
          // Dividir el diseño en palabras significativas
          const palabrasDiseno = disenoLlantar
            .split(/\s+/)
            .filter((p) => p.length > 2);

          if (palabrasDiseno.length === 0) {
            return true; // No hay diseño que validar
          }

          // Contar cuántas palabras coinciden
          let palabrasCoinciden = 0;
          for (const palabra of palabrasDiseno) {
            if (refInventario.includes(palabra)) {
              palabrasCoinciden++;
            }
          }

          // ✅ Si al menos el 60% de las palabras coinciden, es válido
          const porcentajeCoincidencia =
            palabrasCoinciden / palabrasDiseno.length;

          if (porcentajeCoincidencia < 0.6) {
            return false;
          }
        }

        return true;
      });
      if (!llantaDB) {
        resultado.noEncontradas++;
        resultado.noEncontradasLista.push({
          marca: itemLlantar.marca,
          medida: itemLlantar.medida,
          diseno: itemLlantar.diseno,
          precio: itemLlantar.precio,
        });

        if (intentos <= 10) {
          console.log(
            `⚠️ No encontrada: ${itemLlantar.marca} ${itemLlantar.medida} ${itemLlantar.diseno}`
          );
        }
        continue;
      }

      // ✅ COINCIDENCIA ENCONTRADA
      if (intentos <= 10) {
        console.log(
          `✅ MATCH: "${llantaDB.referencia}" ↔ "${itemLlantar.medida} ${itemLlantar.diseno}"`
        );
      }

      // 📊 Calcular margen según la marca
      const divisor = itemLlantar.marca === "TOYO" ? 1.15 : 1.2;
      const precioEsperado = llantaDB.costo_empresa / divisor;
      const margenReal = itemLlantar.precio - llantaDB.costo_empresa;
      const porcentajeReal = (margenReal / llantaDB.costo_empresa) * 100;

      let alertaMargen = null;
      let estadoActualizacion = "actualizada";

      // 🚨 VALIDAR MARGEN (menor a 15% es preocupante, menor a 10% es crítico)
      if (porcentajeReal < 15) {
        const tipo = porcentajeReal < 10 ? "critico" : "bajo";

        // ✅ GUARDAR ALERTA EN LA LLANTA
        alertaMargen = {
          tipo,
          costoReal: llantaDB.costo_empresa,
          precioEsperado: Math.round(precioEsperado),
          precioPublico: itemLlantar.precio,
          margenDisponible: Math.round(margenReal),
          porcentajeReal: parseFloat(porcentajeReal.toFixed(1)),
        };

        estadoActualizacion = tipo === "critico" ? "critico" : "margen_bajo";

        if (tipo === "critico") {
          resultado.bloqueadas++;
          console.log(
            `🔴 MARGEN CRÍTICO: ${
              llantaDB.referencia
            } - Margen: ${porcentajeReal.toFixed(1)}%`
          );
        } else {
          resultado.margenBajo++;
          console.log(
            `⚠️ MARGEN BAJO: ${
              llantaDB.referencia
            } - Margen: ${porcentajeReal.toFixed(1)}%`
          );
        }
      }

      // 💾 ACTUALIZAR PRECIO EN BD (SIEMPRE, sin importar el margen)
      const precioAnterior = llantaDB.precio_cliente;
      const cambio =
        precioAnterior > 0
          ? ((itemLlantar.precio - precioAnterior) / precioAnterior) * 100
          : 0;

      // ✅ ACTUALIZAR SIEMPRE (incluso si es crítico)
      await pool.query(
        `UPDATE llantas 
         SET precio_cliente = $1, 
             alerta_margen = $2,
             fecha_ultima_actualizacion = NOW()
         WHERE id = $3`,
        [itemLlantar.precio, JSON.stringify(alertaMargen), llantaDB.id]
      );

      resultado.actualizadas++;

      resultado.detalles.push({
        marca: itemLlantar.marca,
        medida: itemLlantar.medida,
        diseno: itemLlantar.diseno,
        referencia: llantaDB.referencia,
        estado: estadoActualizacion,
        precioAnterior,
        precioNuevo: itemLlantar.precio,
        cambio: parseFloat(cambio.toFixed(1)),
        margen: parseFloat(porcentajeReal.toFixed(1)),
      });
    }

    console.log("\n📊 ========================================");
    console.log("📊 RESULTADO FINAL");
    console.log("📊 ========================================");
    console.log(`✅ Actualizadas: ${resultado.actualizadas}`);
    console.log(`⚠️ Margen Bajo: ${resultado.margenBajo}`);
    console.log(`🔴 Críticas: ${resultado.bloqueadas}`);
    console.log(`❌ No encontradas: ${resultado.noEncontradas}`);
    console.log("========================================\n");

    // ✅ GUARDAR REPORTE EN LOG DE ACTIVIDADES
    try {
      const resumenLog = `
ACTUALIZACIÓN DE PRECIOS LLANTAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Actualizadas: ${resultado.actualizadas}
⚠️ Margen Bajo (10-15%): ${resultado.margenBajo}
🔴 Críticas (<10%): ${resultado.bloqueadas}
❌ No encontradas: ${resultado.noEncontradas}

${
  resultado.bloqueadas > 0
    ? `
🔴 LLANTAS CRÍTICAS (NO COMPRAR):
${resultado.detalles
  .filter((d) => d.estado === "critico")
  .slice(0, 5)
  .map((d) => `   • ${d.referencia} - Margen: ${d.margen}%`)
  .join("\n")}
${
  resultado.detalles.filter((d) => d.estado === "critico").length > 5
    ? `   ... y ${
        resultado.detalles.filter((d) => d.estado === "critico").length - 5
      } más`
    : ""
}
`
    : ""
}

${
  resultado.margenBajo > 0
    ? `
⚠️ LLANTAS MARGEN BAJO (EVALUAR):
${resultado.detalles
  .filter((d) => d.estado === "margen_bajo")
  .slice(0, 5)
  .map((d) => `   • ${d.referencia} - Margen: ${d.margen}%`)
  .join("\n")}
${
  resultado.detalles.filter((d) => d.estado === "margen_bajo").length > 5
    ? `   ... y ${
        resultado.detalles.filter((d) => d.estado === "margen_bajo").length - 5
      } más`
    : ""
}
`
    : ""
}
      `.trim();

      await pool.query(
        "INSERT INTO logs_actividad (tipo, detalles, fecha) VALUES ($1, $2, NOW())",
        ["ACTUALIZACIÓN PRECIOS LLANTAR", resumenLog]
      );

      console.log("✅ Reporte guardado en log de actividades");
    } catch (logError) {
      console.error("⚠️ Error guardando log (no crítico):", logError.message);
    }

    res.json(resultado);
  } catch (error) {
    console.error("❌ ========================================");
    console.error("❌ ERROR FATAL");
    console.error("❌ ========================================");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("========================================\n");

    res.status(500).json({
      error: "Error procesando Excel de Llantar",
      detalles: error.message,
    });
  }
});

// ============================================
// FUNCIÓN PARA REMOVER FONDO DE RINES
// ============================================
async function removerFondoRin(imageUrl) {
  try {
    console.log("🔄 Procesando imagen con remove.bg:", imageUrl);

    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const formData = new FormData();
    formData.append(
      "image_file_b64",
      Buffer.from(imageResponse.data).toString("base64")
    );
    formData.append("size", "auto");

    const response = await axios({
      method: "post",
      url: "https://api.remove.bg/v1.0/removebg",
      data: formData,
      responseType: "arraybuffer",
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
    });

    if (response.status !== 200) {
      throw new Error(`remove.bg retornó status ${response.status}`);
    }

    console.log("✅ Fondo removido exitosamente");

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "rines",
          format: "png",
          public_id: `sin-fondo-${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            console.error("❌ Error subiendo a Cloudinary:", error);
            reject(error);
          } else {
            console.log(
              "✅ Imagen sin fondo subida a Cloudinary:",
              result.secure_url
            );
            resolve(result.secure_url);
          }
        }
      );

      uploadStream.end(Buffer.from(response.data));
    });
  } catch (error) {
    console.error("❌ Error al remover fondo:", error.message);

    if (error.response?.status === 403) {
      console.error("❌ API Key inválida o límite de remove.bg alcanzado");
    }

    return imageUrl;
  }
}
/**
 * Endpoint para procesar TODOS los rines en lote
 */
app.post("/api/rines/procesar-todos", async (req, res) => {
  try {
    console.log("🔄 Iniciando procesamiento en lote...");

    const result = await pool.query(
      "SELECT * FROM rines WHERE foto IS NOT NULL"
    );
    const rines = result.rows;

    const resultados = {
      total: rines.length,
      exitosos: 0,
      fallidos: 0,
      detalles: [],
    };

    for (const rin of rines) {
      try {
        if (rin.foto_original) {
          console.log(`⏭️ Rin ${rin.id} ya fue procesado, saltando...`);
          continue;
        }

        console.log(`🔄 Procesando rin ${rin.id}: ${rin.referencia}`);

        const urlSinFondo = await removerFondoRin(rin.foto);

        if (urlSinFondo !== rin.foto) {
          await pool.query(
            "UPDATE rines SET foto = $1, foto_original = $2 WHERE id = $3",
            [urlSinFondo, rin.foto, rin.id]
          );

          resultados.exitosos++;
          resultados.detalles.push({
            id: rin.id,
            referencia: rin.referencia,
            estado: "exitoso",
          });
        } else {
          resultados.fallidos++;
          resultados.detalles.push({
            id: rin.id,
            referencia: rin.referencia,
            estado: "fallido",
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error procesando rin ${rin.id}:`, error.message);
        resultados.fallidos++;
        resultados.detalles.push({
          id: rin.id,
          referencia: rin.referencia,
          estado: "error",
          error: error.message,
        });
      }
    }

    console.log("✅ Procesamiento completado:", resultados);

    res.json({
      success: true,
      message: "Procesamiento completado",
      resultados,
    });
  } catch (error) {
    console.error("❌ Error en procesamiento en lote:", error);
    res.status(500).json({
      error: "Error al procesar lote",
      detalle: error.message,
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
        l["comentario"] || "",
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
app.post("/api/editar-llanta", async (req, res) => {
  const {
    id,
    referencia,
    marca,
    proveedor,
    costo_empresa,
    precio_cliente,
    stock,
    consignacion,
    comentario,
  } = req.body;

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
        comentario || "",
        id,
      ]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error editando llanta:", error);
    res.status(500).json({ error: error.message });
  }
});

// Agregar llanta
app.post("/api/agregar-llanta", async (req, res) => {
  const {
    referencia,
    marca,
    proveedor,
    costo_empresa,
    precio_cliente,
    stock,
    consignacion,
    comentario,
  } = req.body;

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
        comentario || "",
      ]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Error agregando llanta:", e);
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
  const { marca, referencia, proveedor, medida, costo, precio, stock } =
    req.body;

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
  const {
    id,
    marca,
    referencia,
    proveedor,
    medida,
    costo,
    precio,
    stock,
    remision,
    comentario,
  } = req.body;

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
      detalle: error.message,
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
app.post(
  "/api/rines/subir-foto",
  uploadImage.single("foto"),
  async (req, res) => {
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

      if (procesarFondo === "true" || procesarFondo === true) {
        console.log("🔄 Procesando fondo automáticamente...");
        const urlSinFondo = await removerFondoRin(urlFoto);

        if (urlSinFondo !== urlFoto) {
          await pool.query(
            "UPDATE rines SET foto = $1, foto_original = $2 WHERE id = $3",
            [urlSinFondo, urlFoto, id]
          );

          console.log("✅ Foto procesada y guardada");
          return res.json({
            success: true,
            foto: urlSinFondo,
            foto_original: urlFoto,
            procesada: true,
          });
        }
      }

      await pool.query("UPDATE rines SET foto = $1 WHERE id = $2", [
        urlFoto,
        id,
      ]);

      console.log("✅ URL guardada en BD para rin ID:", id);

      res.json({ success: true, foto: urlFoto, procesada: false });
    } catch (error) {
      console.error("❌ Error completo al subir foto:", error);
      res.status(500).json({
        error: error.message || "Error al subir foto",
        details: error.toString(),
      });
    }
  }
);

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
    res
      .status(500)
      .json({ error: "Error al guardar log", detalles: err.message });
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
    res
      .status(500)
      .json({ error: "Error al obtener logs", detalles: err.message });
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
    const { rows } = await pool.query(
      "SELECT * FROM tiros_arrastre ORDER BY id ASC"
    );
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
        parseFloat(stock) || 0,
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

// ---------------- PROMOCIONES ----------------

// Obtener promociones activas
app.get("/api/promociones", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM promociones ORDER BY marca, referencia"
    );
    res.json(rows);
  } catch (e) {
    console.error("Error obteniendo promociones:", e);
    res.status(500).json({ error: "Error obteniendo promociones" });
  }
});

// Extraer texto del PDF para SQL manual
app.post(
  "/api/procesar-promociones",
  uploadPDF.single("pdf"),
  async (req, res) => {
    console.log("🔥 INICIO - Recibida petición de extraer texto del PDF");

    try {
      if (!req.file) {
        console.log("❌ No se recibió archivo PDF");
        return res.status(400).json({ error: "No se recibió archivo PDF" });
      }

      console.log("📄 Tamaño del archivo:", req.file.size, "bytes");

      // Intentar extraer texto con pdf-parse
      let texto = "";
      try {
        const pdfData = await pdfParse(req.file.buffer);
        texto = pdfData.text;
        console.log("✅ Texto extraído con pdf-parse");
      } catch (err) {
        console.log(
          "⚠️ No se pudo extraer texto (probablemente es una imagen)"
        );
        return res.json({
          success: false,
          esImagen: true,
          mensaje:
            "El PDF parece ser una imagen escaneada. Use OCR online primero: https://www.onlineocr.net/",
        });
      }

      console.log("📄 Longitud del texto:", texto.length, "caracteres");

      // Detectar marca
      let marcaActual = "DESCONOCIDA";
      const textoUpper = texto.toUpperCase();

      if (textoUpper.includes("YOKOHAMA")) marcaActual = "YOKOHAMA";
      else if (textoUpper.includes("PIRELLI")) marcaActual = "PIRELLI";
      else if (textoUpper.includes("GOODYEAR")) marcaActual = "GOODYEAR";
      else if (textoUpper.includes("FEDERAL")) marcaActual = "FEDERAL";
      else if (textoUpper.includes("NITTO")) marcaActual = "NITTO";
      else if (textoUpper.includes("ALLIANCE")) marcaActual = "ALLIANCE";
      else if (textoUpper.includes("VENOM")) marcaActual = "VENOM";
      else if (textoUpper.includes("YEADA")) marcaActual = "YEADA";
      else if (textoUpper.includes("GENERAL")) marcaActual = "GENERAL";
      else if (textoUpper.includes("MOMO")) marcaActual = "MOMO";

      console.log("🏷️ Marca detectada:", marcaActual);

      // Detectar mes actual
      const mesActual = new Date().toLocaleDateString("es-CO", {
        month: "long",
        year: "numeric",
      });

      // Expresiones regulares para detectar líneas de promociones
      const regexFormatos = [
        /(\d{3}\/\d{2}\s*R\d{2}[A-Z]*)\s+([A-Z0-9\s\.]+?)\s+(\d+)\s+\$?([\d,\.]+)/gi,
        /(\d{3}\/\d{2}R\d{2}[A-Z]*)\s+([A-Z0-9\s\.]+?)\s+(\d+)\s+([\d,\.]+)/gi,
      ];

      let promociones = [];

      for (const regex of regexFormatos) {
        let match;
        while ((match = regex.exec(texto)) !== null) {
          const referencia = match[1].trim().replace(/\s+/g, "");
          const diseno = match[2].trim();
          const cantidades = parseInt(match[3]);
          const precioTexto = match[4].replace(/[,$\.]/g, "");
          const precio = parseFloat(precioTexto);

          if (
            referencia &&
            !isNaN(precio) &&
            precio > 0 &&
            !isNaN(cantidades)
          ) {
            promociones.push({
              marca: marcaActual,
              referencia,
              diseno,
              precio,
              cantidades,
            });
          }
        }
      }

      console.log(`✅ ${promociones.length} promociones detectadas`);

      // Generar SQL
      let sqlScript = `-- Promociones de ${marcaActual} - ${mesActual}\n`;
      sqlScript += `-- Total: ${promociones.length} referencias\n\n`;
      sqlScript += `-- Desactivar promociones anteriores\n`;
      sqlScript += `UPDATE promociones SET activa=false WHERE marca='${marcaActual}' AND activa=true;\n\n`;
      sqlScript += `-- Insertar nuevas promociones\n`;
      sqlScript += `INSERT INTO promociones (marca, referencia, diseno, precio_promo, cantidades_disponibles, mes, activa) VALUES\n`;

      promociones.forEach((promo, index) => {
        const coma = index < promociones.length - 1 ? "," : ";";
        sqlScript += `('${promo.marca}', '${promo.referencia}', '${promo.diseno}', ${promo.precio}, ${promo.cantidades}, '${mesActual}', true)${coma}\n`;
      });

      res.json({
        success: true,
        marca: marcaActual,
        mes: mesActual,
        totalPromociones: promociones.length,
        sqlScript: sqlScript,
        primerasLineas: promociones.slice(0, 5),
      });
    } catch (e) {
      console.error("❌❌❌ ERROR FATAL:", e.message);
      console.error("Stack trace:", e.stack);
      res.status(500).json({
        error: "Error procesando PDF",
        detalle: e.message,
      });
    }
  }
);

// Desactivar promoción
app.post("/api/desactivar-promocion", async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query("UPDATE promociones SET activa=false WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (e) {
    console.error("Error desactivando promoción:", e);
    res.status(500).json({ error: "Error desactivando promoción" });
  }
});

// Limpiar promociones inactivas
app.post("/api/limpiar-promociones-inactivas", async (req, res) => {
  try {
    await pool.query("DELETE FROM promociones WHERE activa=false");
    res.json({ success: true });
  } catch (e) {
    console.error("Error limpiando promociones:", e);
    res.status(500).json({ error: "Error limpiando promociones" });
  }
});
// ============================================
// FUNCIÓN PARA EXTRAER DATOS DEL PDF DE LLANTAR
// ============================================
async function extraerDatosPDFLlantar(buffer) {
  try {
    const data = await pdfParse(buffer);
    const texto = data.text;
    const lineas = texto.split("\n");

    const llantas = [];

    for (let linea of lineas) {
      linea = linea.trim();

      if (
        !linea ||
        linea.includes("MARCA") ||
        linea.includes("DISEÑO") ||
        linea.includes("MEDIDA")
      ) {
        continue;
      }

      const medidaMatch = linea.match(/(\d{3}\/\d{2}[A-Z]\d{2}[A-Z]?)/);

      if (medidaMatch) {
        const medida = medidaMatch[1];
        const partes = linea.split(/\s+/);

        const precioTexto = partes[partes.length - 1].replace(/[,$]/g, "");
        const precio = parseInt(precioTexto);

        if (isNaN(precio) || precio === 0) continue;

        const marca = partes[0];
        const referencia = partes[1] || "";
        const medidaIndex = partes.findIndex((p) => p === medida);
        const diseno = partes.slice(2, medidaIndex).join(" ");

        llantas.push({ marca, referencia, diseno, medida, precio });
      }
    }

    console.log(`✅ PDF procesado: ${llantas.length} llantas encontradas`);
    return llantas;
  } catch (error) {
    console.error("❌ Error procesando PDF:", error);
    throw error;
  }
}

// ============================================
// ENDPOINT: PROCESAR LISTA LLANTAR
// ============================================
app.post(
  "/api/procesar-lista-llantar",
  uploadPDF.single("pdf"),
  async (req, res) => {
    try {
      console.log("📄 Recibiendo PDF de Llantar...");

      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo" });
      }

      const datosLlantar = await extraerDatosPDFLlantar(req.file.buffer);

      // 🔍 LOG 1: Ver qué extrajo del PDF
      console.log("🔍 PRIMERAS 10 LLANTAS EXTRAÍDAS:");
      console.log(JSON.stringify(datosLlantar.slice(0, 10), null, 2));

      if (datosLlantar.length === 0) {
        return res
          .status(400)
          .json({ error: "No se pudieron extraer datos del PDF" });
      }

      const { rows: inventario } = await pool.query("SELECT * FROM llantas");

      // 🔍 LOG 2: Ver qué hay en tu inventario
      console.log("🔍 PRIMERAS 5 LLANTAS EN INVENTARIO:");
      console.log(
        JSON.stringify(
          inventario.slice(0, 5).map((l) => ({
            id: l.id,
            marca: l.marca,
            referencia: l.referencia,
            costo: l.costo_empresa,
          })),
          null,
          2
        )
      );

      const resultado = {
        actualizadas: 0,
        margenBajo: 0,
        bloqueadas: 0,
        detalles: [],
      };

      for (const itemLlantar of datosLlantar) {
        const llantaDB = inventario.find((l) => {
          const coincideMarca =
            l.marca?.toUpperCase() === itemLlantar.marca?.toUpperCase();
          const coincideMedida = l.referencia?.includes(itemLlantar.medida);

          // 🔍 LOG 3: Ver intentos de coincidencia
          if (coincideMarca) {
            console.log(
              `🔍 Coincide marca ${itemLlantar.marca}, buscando medida ${itemLlantar.medida} en ${l.referencia}`
            );
          }

          if (itemLlantar.referencia && l.referencia) {
            const coincideRef = l.referencia
              ?.toUpperCase()
              .includes(itemLlantar.referencia?.toUpperCase());
            return coincideMarca && (coincideMedida || coincideRef);
          }

          return coincideMarca && coincideMedida;
        });

        if (!llantaDB) continue;

        const divisor =
          itemLlantar.marca?.toUpperCase() === "TOYO" ? 1.15 : 1.2;
        const precioEsperado = llantaDB.costo_empresa / divisor;
        const margenReal = itemLlantar.precio - llantaDB.costo_empresa;
        const porcentajeReal = (margenReal / llantaDB.costo_empresa) * 100;

        let alertaMargen = null;
        let estadoActualizacion = "actualizada";

        if (porcentajeReal < 15) {
          const tipo = porcentajeReal < 10 ? "critico" : "bajo";

          alertaMargen = {
            tipo,
            costoReal: llantaDB.costo_empresa,
            precioEsperado: Math.round(precioEsperado),
            precioPublico: itemLlantar.precio,
            margenDisponible: Math.round(margenReal),
            porcentajeReal: parseFloat(porcentajeReal.toFixed(1)),
          };

          estadoActualizacion = tipo === "critico" ? "critico" : "margen_bajo";

          if (tipo === "critico") {
            resultado.bloqueadas++;
          } else {
            resultado.margenBajo++;
          }
        }

        const precioAnterior = llantaDB.precio_cliente;
        const cambio =
          ((itemLlantar.precio - precioAnterior) / precioAnterior) * 100;

        await pool.query(
          `UPDATE llantas 
         SET precio_cliente = $1, 
             alerta_margen = $2, 
             fecha_ultima_actualizacion = NOW()
         WHERE id = $3`,
          [itemLlantar.precio, JSON.stringify(alertaMargen), llantaDB.id]
        );

        resultado.actualizadas++;

        resultado.detalles.push({
          marca: itemLlantar.marca,
          medida: itemLlantar.medida,
          diseno: itemLlantar.diseno,
          referencia: llantaDB.referencia,
          estado: estadoActualizacion,
          precioAnterior,
          precioNuevo: itemLlantar.precio,
          cambio: parseFloat(cambio.toFixed(1)),
          margen: alertaMargen ? parseFloat(porcentajeReal.toFixed(1)) : null,
        });
      }

      console.log(
        `✅ Actualizadas: ${resultado.actualizadas}, ⚠️ Bajo: ${resultado.margenBajo}, 🔴 Bloq: ${resultado.bloqueadas}`
      );

      res.json(resultado);
    } catch (error) {
      console.error("❌ Error:", error);
      res.status(500).json({
        error: "Error procesando lista de Llantar",
        detalles: error.message,
      });
    }
  }
);
// Verificar si una llanta tiene promoción
app.get("/api/verificar-promocion/:marca/:referencia", async (req, res) => {
  const { marca, referencia } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM promociones WHERE marca=$1 AND referencia=$2 AND activa=true LIMIT 1",
      [marca, referencia]
    );
    res.json(rows[0] || null);
  } catch (e) {
    console.error("Error verificando promoción:", e);
    res.status(500).json({ error: "Error verificando promoción" });
  }
});

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

// Run server
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
  console.log(`📁 Cloudinary configurado correctamente`);
  console.log(
    `🎨 Remove.bg ${
      REMOVE_BG_API_KEY !== "TU_API_KEY_AQUI"
        ? "ACTIVADO ✅"
        : "PENDIENTE (configura tu API key)"
    }`
  );
});
