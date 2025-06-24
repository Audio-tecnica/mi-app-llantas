// src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './index.css';

function App() {
  const [llantas, setLlantas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('');
  const [ancho, setAncho] = useState('');
  const [perfil, setPerfil] = useState('');
  const [rin, setRin] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get('https://mi-app-llantas.onrender.com/api/llantas')
      .then(res => setLlantas(res.data))
      .catch(() => setMensaje('Error al cargar llantas ❌'))
      .finally(() => setCargando(false));
  }, []);

  const marcasUnicas = [...new Set(llantas.map(l => l.marca))];
  const anchos = [], perfiles = [], rines = [];

  llantas.forEach(l => {
    const partes = l.referencia?.split(/[ /R]/).filter(Boolean);
    if (partes?.length >= 3) {
      if (!anchos.includes(partes[0])) anchos.push(partes[0]);
      if (!perfiles.includes(partes[1])) perfiles.push(partes[1]);
      if (!rines.includes(partes[2])) rines.push(partes[2]);
    }
  });

  const filtradas = llantas.filter(l =>
    l.referencia.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!marcaSeleccionada || l.marca === marcaSeleccionada) &&
    (!ancho || l.referencia.includes(ancho)) &&
    (!perfil || l.referencia.includes(perfil)) &&
    (!rin || l.referencia.includes(rin))
  );

  const actualizarCampo = (index, campo, valor) => {
    const nuevas = [...llantas];
    nuevas[index][campo] = valor;
    setLlantas(nuevas);
  };

  const guardarCambios = async (llanta, index) => {
    try {
      const url = llanta.id
        ? 'https://mi-app-llantas.onrender.com/api/actualizar-item'
        : 'https://mi-app-llantas.onrender.com/api/agregar-item';

      await axios.post(url, llanta);
      setMensaje('Guardado correctamente ✅');
      setEditando(null);
      const res = await axios.get('https://mi-app-llantas.onrender.com/api/llantas');
      setLlantas(res.data);
    } catch {
      setMensaje('Error al guardar ❌');
    } finally {
      setTimeout(() => setMensaje(''), 2000);
    }
  };

  const cancelarEdicion = (index) => {
    const nuevas = [...llantas];
    if (!nuevas[index].id) {
      nuevas.splice(index, 1); // eliminar si era nuevo
    } else {
      axios.get('https://mi-app-llantas.onrender.com/api/llantas')
        .then(res => setLlantas(res.data))
        .catch(() => setMensaje('Error al restaurar ❌'));
    }
    setEditando(null);
    setLlantas(nuevas);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🛞 Llantas Audio Tecnica</h1>
        <div className="flex gap-2">
          <Link to="/subir" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Subir archivo</Link>
          <button onClick={() => {
            localStorage.removeItem('acceso');
            window.location.href = '/login';
          }} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Cerrar sesión</button>
        </div>
      </div>

      {mensaje && <div className="text-center text-red-600 font-semibold mb-2">❌ {mensaje}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded shadow-md border md:col-span-1">
          <h2 className="text-lg font-semibold mb-3">Filtros</h2>
          <input type="text" placeholder="Buscar referencia..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full mb-3 p-2 border rounded" />
          <label className="block text-sm mb-1">Marca</label>
          <select value={marcaSeleccionada} onChange={e => setMarcaSeleccionada(e.target.value)} className="w-full mb-3 p-2 border rounded">
            <option value="">Todas</option>
            {marcasUnicas.map(m => <option key={m}>{m}</option>)}
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
          <button onClick={() => {
            setBusqueda('');
            setMarcaSeleccionada('');
            setAncho('');
            setPerfil('');
            setRin('');
          }} className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-sm py-1 rounded">Limpiar filtros</button>
        </div>

        <div className="md:col-span-3">
          <div className="mb-4 text-right">
            <button onClick={() => setLlantas([...llantas, {
              referencia: '', marca: '', proveedor: '', costo_empresa: 0, precio_cliente: 0, stock: 0
            }])} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              + Agregar llanta
            </button>
          </div>
          {cargando ? (
            <div className="text-center text-gray-500">⏳ Cargando llantas...</div>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Referencia</th>
                  <th className="p-2 border">Marca</th>
                  <th className="p-2 border">Proveedor</th>
                  <th className="p-2 border">Costo</th>
                  <th className="p-2 border">Precio</th>
                  <th className="p-2 border">Stock</th>
                  <th className="p-2 border">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((ll, index) => (
                  <tr key={index} className="border-t text-center">
                    <td className="p-2">
                      <input type="text" value={ll.referencia} onChange={e => actualizarCampo(index, 'referencia', e.target.value)} className="w-full border rounded px-1" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={ll.marca} onChange={e => actualizarCampo(index, 'marca', e.target.value)} className="w-full border rounded px-1" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={ll.proveedor} onChange={e => actualizarCampo(index, 'proveedor', e.target.value)} className="w-full border rounded px-1" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={ll.costo_empresa} onChange={e => actualizarCampo(index, 'costo_empresa', e.target.value)} className="w-full border rounded px-1" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={ll.precio_cliente} onChange={e => actualizarCampo(index, 'precio_cliente', e.target.value)} className="w-full border rounded px-1" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={ll.stock} onChange={e => actualizarCampo(index, 'stock', e.target.value)} className="w-full border rounded px-1 text-center" />
                    </td>
                    <td className="p-2">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => guardarCambios(ll, index)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 rounded text-xs">Guardar</button>
                        <button onClick={() => cancelarEdicion(index)} className="bg-gray-300 hover:bg-gray-400 text-black px-2 py-0.5 rounded text-xs">Cancelar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtradas.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-gray-500">No se encontraron llantas</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;












