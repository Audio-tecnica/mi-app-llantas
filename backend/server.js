import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import path from "path";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Carpeta para fotos
const FILES_PATH = path.join(process.cwd(), "files");
app.use("/files", express.static(FILES_PATH));

// Configuración de DB
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// ===========================
//  ACCESORIOS
// ===========================

// GET todos los accesorios
app.get("/api/accesorios", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM accesorios ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar accesorios" });
  }
});

// POST agregar accesorio
app.post("/api/accesorios", async (req, res) => {
  try {
    const { nombre, categoria, costo, precio, stock } = req.body;
    const result = await db.query(
      "INSERT INTO accesorios (nombre, categoria, costo, precio, stock) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [nombre, categoria, Number(costo) ?? 0, Number(precio) ?? 0, Number(stock) ?? 0]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar accesorio" });
  }
});
// ===========================
//  RINES
// ===========================

// GET todos los rines
app.get("/api/rines", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM rines ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar rines" });
  }
});

// POST agregar rin
app.post("/api/agregar-rin", async (req, res) => {
  try {
    const { referencia, marca, proveedor, medida, costo, precio, stock, remision, comentario } = req.body;

    const result = await db.query(
      `INSERT INTO rines (referencia, marca, proveedor, medida, costo, precio, stock, remision, comentario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        referencia,
        marca,
        proveedor ?? "",
        medida ?? "",
        Number(costo) ?? 0,
        Number(precio) ?? 0,
        Number(stock) ?? 0,
        remision ?? false,
        comentario ?? ""
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar rin" });
  }
});

// POST editar rin
// POST editar rin (VERSIÓN CORREGIDA)
app.post("/api/editar-rin", async (req, res) => {
  try {
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
      comentario
    } = req.body;

    console.log("📥 Backend recibió:", { id, remision, comentario }); // Para debug

    const result = await db.query(
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
      RETURNING *`,  // ⬅️ ESTO ES LO QUE FALTABA
      [
        marca,
        referencia,
        proveedor || "",
        medida || "",
        Number(costo) || 0,
        Number(precio) || 0,
        Number(stock) || 0,
        remision === true || remision === "true",  // Asegurar boolean
        comentario || "",
        id
      ]
    );

    console.log("📤 Backend devuelve:", result.rows[0]); // Para debug

    res.json(result.rows[0]);  // ⬅️ Devolver el registro actualizado
  } catch (error) {
    console.error("❌ Error en backend:", error);
    res.status(500).json({ error: "Error al editar el rin" });
  }
});

// POST eliminar rin
app.post("/api/eliminar-rin", async (req, res) => {
  try {
    const { id } = req.body;
    await db.query("DELETE FROM rines WHERE id=$1", [id]);
    res.json({ message: "Rin eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar rin" });
  }
});

// ===========================
//  SUBIR FOTO PARA RINES
// ===========================
app.post("/api/rines/subir-foto", async (req, res) => {
  try {
    const { id } = req.body;
    const archivo = req.files?.foto;

    if (!archivo) {
      return res.status(400).json({ error: "No se envió ninguna imagen" });
    }

    // Crear nombre único
    const nombreArchivo = `rin_${id}_${Date.now()}.jpg`;
    const rutaLocal = path.join(FILES_PATH, nombreArchivo);

    // Guardar imagen
    await archivo.mv(rutaLocal);

    // URL pública (usar variable de entorno)
    const urlFoto = `${process.env.BACKEND_URL}/files/${nombreArchivo}`;

    // Guardar en DB
    await db.query("UPDATE rines SET foto = $1 WHERE id = $2", [urlFoto, id]);

    res.json({ success: true, foto: urlFoto });
  } catch (error) {
    console.error("❌ Error al subir foto:", error);
    res.status(500).json({ error: "Error al subir foto" });
  }
});

// ===========================
//  INICIAR SERVIDOR
// ===========================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});


