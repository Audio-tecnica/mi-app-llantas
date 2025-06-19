const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const xlsx = require('xlsx');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('llantas.db');

// Middleware
app.use(fileUpload());
app.use(cors({
  origin: 'https://mi-app-llantas.vercel.app' // Cambia si tu frontend tiene otro dominio
}));
app.use(express.json());

// Crear tabla si no existe
db.prepare(`CREATE TABLE IF NOT EXISTS llantas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referencia TEXT,
  marca TEXT,
  proveedor TEXT,
  costo_empresa INTEGER,
  precio_cliente INTEGER,
  stock INTEGER
)`).run();

// Endpoint para subir archivo Excel
app.post('/api/upload', (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('No se subió ningún archivo');
  }

  const archivo = req.files.file;
  const workbook = xlsx.read(archivo.data, { type: 'buffer' });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = xlsx.utils.sheet_to_json(hoja);

  // Limpiar tabla antes de importar nuevos datos
  db.prepare('DELETE FROM llantas').run();

  const insert = db.prepare(`INSERT INTO llantas (referencia, marca, proveedor, costo_empresa, precio_cliente, stock)
    VALUES (?, ?, ?, ?, ?, ?)`);

  const transaction = db.transaction((rows) => {
    for (const l of rows) {
      insert.run(
        l.referencia || '',
        l.marca || '',
        l.proveedor || '',
        parseInt(l.costo_empresa) || 0,
        parseInt(l.precio_cliente) || 0,
        parseInt(l.stock) || 0
      );
    }
  });

  try {
    transaction(datos);
    res.send('Archivo cargado correctamente');
  } catch (e) {
    console.error('Error al importar datos:', e);
    res.status(500).send('Error al procesar el archivo');
  }
});

// Endpoint para obtener los datos
app.get('/api/llantas', (req, res) => {
  try {
    const llantas = db.prepare('SELECT * FROM llantas').all();
    res.json(llantas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
