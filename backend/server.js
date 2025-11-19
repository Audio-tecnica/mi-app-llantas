import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

const db = new Pool({ connectionString: process.env.DATABASE_URL });

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
      [nombre, categoria, Number(costo), Number(precio), Number(stock)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar accesorio" });
  }
});

app.listen(3001, () => console.log("Servidor corriendo en puerto 3001"));

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
    const { referencia, marca, proveedor, medida, costo, precio, stock } = req.body;

    const result = await db.query(
      `INSERT INTO rines (referencia, marca, proveedor, medida, costo, precio, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        referencia,
        marca,
        proveedor ?? "",
        medida ?? "",
        Number(costo) || 0,
        Number(precio) || 0,
        Number(stock) || 0
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar rin" });
  }
});

// POST editar rin
app.post("/api/editar-rin", async (req, res) => {
  try {
    const { id, referencia, marca, proveedor, medida, costo, precio, stock } = req.body;

    const result = await db.query(
      `UPDATE rines
       SET referencia=$1, marca=$2, proveedor=$3, medida=$4,
           costo=$5, precio=$6, stock=$7
       WHERE id=$8
       RETURNING *`,
      [
        referencia,
        marca,
        proveedor ?? "",
        medida ?? "",
        Number(costo) || 0,
        Number(precio) || 0,
        Number(stock) || 0,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al editar rin" });
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
