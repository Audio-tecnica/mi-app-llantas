import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './index.css';
import { Link, useNavigate } from 'react-router-dom';

function App() {
  const [llantas, setLlantas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const navigate = useNavigate();

  useEffect(() => {
       axios.get('https://mi-app-llantas-1.onrender.com/api/llantas') // ✅ dominio actualizado
      .then(res => setLlantas(res.data))
      .catch(() => setMensaje({ texto: 'Error al cargar llantas', tipo: 'error' }));
  }, []);

  const marcasUnicas = [...new Set(llantas.map(l => l.marca))];
  const filtradas = llantas.filter(l => 
    l.referencia.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!marcaSeleccionada || l.marca === marcaSeleccionada)
  );

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* ✅ Botón para subir archivo */}
      <div className="mb-4 flex justify-end">
        <Link to="/subir" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Subir archivo
        </Link>
      </div>

      <h1 className="text-xl font-bold mb-4">Consulta de Llantas</h1>

      {mensaje.texto && <div className="mb-4 text-red-500">{mensaje.texto}</div>}

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar..."
          className="border p-2 rounded w-full"
        />
        <select
          value={marcaSeleccionada}
          onChange={e => setMarcaSeleccionada(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Todas las marcas</option>
          {marcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Referencia</th>
            <th className="border p-2">Marca</th>
            <th className="border p-2">Proveedor</th>
            <th className="border p-2">Precio</th>
          </tr>
        </thead>
        <tbody>
          {filtradas.map(ll => (
            <tr key={ll.id} className="text-center border-t">
              <td className="p-2">{ll.referencia}</td>
              <td className="p-2">{ll.marca}</td>
              <td className="p-2">{ll.proveedor}</td>
              <td className="p-2">${ll.precio_cliente.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
