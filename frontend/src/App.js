import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [llantas, setLlantas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('');
  const [ancho, setAncho] = useState('');
  const [perfil, setPerfil] = useState('');
  const [rin, setRin] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    axios.get('https://mi-app-llantas.onrender.com/api/llantas')
      .then(res => setLlantas(res.data))
      .catch(() => setMensaje('Error al cargar llantas ❌'));
  }, []);

  const marcasUnicas = [...new Set(llantas.map(l => l.marca))];
  const referencias = llantas.map(l => l.referencia || '');

  const getParte = (indice) => referencias
    .map(ref => ref.split(/[ \/R]/)[indice])
    .filter((v, i, a) => v && a.indexOf(v) === i);

  const anchos = getParte(0);
  const perfiles = getParte(1);
  const rines = getParte(2);

  const filtradas = llantas.filter(l =>
    l.referencia.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!marcaSeleccionada || l.marca === marcaSeleccionada) &&
    (!ancho || l.referencia.includes(ancho)) &&
    (!perfil || l.referencia.includes(perfil)) &&
    (!rin || l.referencia.includes(rin))
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">🛞 Catálogo de Llantas</h1>

      {mensaje && <div className="text-red-500 mb-4">{mensaje}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filtros laterales */}
        <div className="bg-white p-4 rounded shadow-md border md:col-span-1">
          <h2 className="text-lg font-semibold mb-3">Filtros</h2>

          <input
            type="text"
            placeholder="Buscar referencia..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
          />

          <label className="block text-sm mb-1">Marca</label>
          <select
            value={marcaSeleccionada}
            onChange={e => setMarcaSeleccionada(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
          >
            <option value="">Todas</option>
            {marcasUnicas.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <label className="block text-sm mb-1">Ancho</label>
          <select value={ancho} onChange={e => setAncho(e.target.value)} className="w-full mb-3 p-2 border rounded">
            <option value="">Todos</option>
            {anchos.map(a => <option key={a}>{a}</option>)}
          </select>

          <label className="block text-sm mb-1">Perfil</label>
          <select value={perfil} onChange={e => setPerfil(e.target.value)} className="w-full mb-3 p-2 border rounded">
            <option value="">Todos</option>
            {perfiles.map(p => <option key={p}>{p}</option>)}
          </select>

          <label className="block text-sm mb-1">Rin</label>
          <select value={rin} onChange={e => setRin(e.target.value)} className="w-full mb-3 p-2 border rounded">
            <option value="">Todos</option>
            {rines.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        {/* Resultados */}
        <div className="md:col-span-3 overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="p-2 border">Referencia</th>
                <th className="p-2 border">Marca</th>
                <th className="p-2 border">Proveedor</th>
                <th className="p-2 border">Precio Cliente</th>
                <th className="p-2 border">Costo Empresa</th>
                <th className="p-2 border">Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((ll, index) => (
                <tr key={index} className="border-t text-center hover:bg-blue-50">
                  <td className="p-2">{ll.referencia}</td>
                  <td className="p-2">{ll.marca}</td>
                  <td className="p-2">{ll.proveedor}</td>
                  <td className="p-2 text-gray-500 font-semibold">${ll.costo_empresa.toLocaleString()}</td>
                  <td className="p-2 text-green-600 font-semibold">${ll.precio_cliente.toLocaleString()}</td>
                  <td className="p-2">{ll.stock}</td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr><td colSpan="5" className="text-center py-4 text-gray-500">No se encontraron llantas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;




