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
