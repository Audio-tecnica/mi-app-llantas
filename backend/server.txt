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
// POST editar rin
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

    console.log("📥 Backend recibió:", { id, remision, comentario });

    if (!id) {
      return res.status(400).json({ error: "ID es requerido" });
    }

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
      RETURNING *`,
      [
        marca || "",
        referencia || "",
        proveedor || "",
        medida || "",
        Number(costo) || 0,
        Number(precio) || 0,
        Number(stock) || 0,
        remision === true || remision === "true",
        comentario || "",
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rin no encontrado" });
    }

    // ⚠️ IMPORTANTE: Debe devolver result.rows[0], NO {success: true}
    console.log("📤 Backend devuelve:", result.rows[0]);
    res.json(result.rows[0]);
    
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
      `INSERT INTO carpas (marca, referencia, proveedor, costo, precio, stock, fecha_creacion)
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
    console.error("Error agregando carpa:", e);
    res.status(500).json({ error: "Error agregando carpa" });
  }
});

// Editar carpa
app.post("/api/editar-carpa", async (req, res) => {
  const { id, marca, referencia, proveedor, costo, precio, stock } = req.body;

  try {
    await pool.query(
      `UPDATE carpas SET
        marca=$1, referencia=$2, proveedor=$3, costo=$4, precio=$5, stock=$6
       WHERE id=$7`,
      [marca, referencia, proveedor || "", parseFloat(costo), parseFloat(precio), parseInt(stock), id]
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

