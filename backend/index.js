const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const xlsx = require('xlsx');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('llantas.db');

app.use(fileUpload());
app.use(cors({ origin: 'https://mi-app-llantas.vercel.app' }));
app.use(express.json());

db.prepare(`CREATE TABLE IF NOT EXISTS llantas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referencia TEXT,
  marca TEXT,
  proveedor TEXT,
  costo_empresa INTEGER,
  precio_cliente INTEGER,
  stock INTEGER
)`).run();

app.post('/api/upload', (req, res) => {
  if (!req.files || !req.files.file) return res.status(400).send('No se subió ningún archivo');

  const archivo = req.files.file;
  const workbook = xlsx.read(archivo.data, { type: 'buffer' });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const datos = xlsx.utils.sheet_to_json(hoja);

  db.prepare('DELETE FROM llantas').run();
  const insert = db.prepare(\`INSERT INTO llantas (referencia, marca, proveedor, costo_empresa, precio_cliente, stock)
                             VALUES (?, ?, ?, ?, ?, ?)\`);

  const transaction = db.transaction(() => {
    for (const l of datos) {
      insert.run(l.Referencia || '', l.Marca || '', l.Proveedor || '', parseInt(l["Costo Empresa"]) || 0, parseInt(l["Precio Cliente"]) || 0, parseInt(l["Cantidad"]) || 0);
    }
  });

  transaction();
  res.send('Archivo cargado correctamente');
});

app.get('/api/llantas', (req, res) => {
  const llantas = db.prepare('SELECT * FROM llantas').all();
  res.json(llantas);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`Servidor escuchando en puerto \${PORT}\`);
});